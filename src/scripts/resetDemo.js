const { Op } = require("sequelize");
const { sequelize, AdminUser, Service, Slot, Customer, Booking, Conversation } = require("../models");
const { config } = require("../config/env");
const { hashPassword } = require("../services/authService");
const { createBooking } = require("../services/bookingService");
const { listAvailability } = require("../services/availabilityService");
const { todayISO, addDays, minutesToLabel, formatDateShort } = require("../utils/time");

const WEEKDAYS = ["1", "2", "3", "4", "5", "6"];

function weeklyFrom(times) {
    return WEEKDAYS.reduce((acc, day) => ({ ...acc, [day]: times }), {});
}

const SERVICES = [
    {
        name: "Facial",
        durationMin: 60,
        aliases: ["facial", "face treatment", "facial eka", "face", "මුහුණු", "මුහුණු ප්‍රතිකාර", "முக", "முகம்"],
        weekly: weeklyFrom([540, 600, 660, 840, 900, 960]),
    },
    {
        name: "Hair Colouring",
        durationMin: 120,
        aliases: ["colour", "color", "colouring", "hair color", "hair colour", "කොණ්ඩය තීන්ත", "හෙයාර් කලර්", "முடி சாயம்"],
        weekly: weeklyFrom([540, 660, 840, 960]),
    },
    {
        name: "Cleanup",
        durationMin: 45,
        aliases: ["cleanup", "clean up", "clean-up", "ක්ලීන් අප්", "கிளீன் அப்"],
        weekly: weeklyFrom([540, 585, 630, 840, 885, 930]),
    },
    {
        name: "Haircut",
        durationMin: 30,
        aliases: ["haircut", "hair cut", "kes kapanna", "හෙයාර් කට්", "කොණ්ඩේ කපන", "முடி வெட்ட"],
        weekly: weeklyFrom([540, 570, 600, 630, 660, 840, 870, 900, 930, 960]),
    },
];

const DEMO_CUSTOMERS = [
    { phone: "94771234567", name: "Nimali Perera", lang: "sien" },
    { phone: "94772345678", name: "Sanduni Fernando", lang: "si" },
    { phone: "94773456789", name: "Kavitha Raj", lang: "ta" },
    { phone: "94774567890", name: "Amaya Silva", lang: "en" },
    { phone: "94775678901", name: "Ishara Bandara", lang: "en" },
    { phone: "94776789012", name: "Tharushi Jayawardena", lang: "sien" },
];

const DEMO_BOOKINGS = [
    { customer: 0, service: 0, dayOffset: 0, startMin: 540, source: "WHATSAPP" },
    { customer: 3, service: 3, dayOffset: 0, startMin: 600, source: "MANUAL" },
    { customer: 1, service: 2, dayOffset: 0, startMin: 840, source: "WHATSAPP" },
    { customer: 4, service: 3, dayOffset: 0, startMin: 900, source: "WHATSAPP" },
    { customer: 2, service: 0, dayOffset: 1, startMin: 600, source: "WHATSAPP" },
    { customer: 5, service: 1, dayOffset: 1, startMin: 840, source: "MANUAL" },
    { customer: 3, service: 3, dayOffset: 2, startMin: 570, source: "WHATSAPP" },
    { customer: 0, service: 2, dayOffset: 2, startMin: 885, source: "WHATSAPP" },
    { customer: 1, service: 0, dayOffset: 3, startMin: 900, source: "MANUAL" },
];

async function wipe() {
    await Booking.destroy({ where: {}, truncate: false });
    await Conversation.destroy({ where: {}, truncate: false });
    await Slot.destroy({ where: {}, truncate: false });
    await Customer.destroy({ where: {}, truncate: false });
    console.log("[reset] cleared bookings, conversations, slots and customers");
}

async function seedAdmin() {
    const email = config.seed.adminEmail.toLowerCase().trim();
    const [admin, isNew] = await AdminUser.findOrCreate({
        where: { email },
        defaults: {
            name: config.seed.adminName,
            email,
            passwordHash: await hashPassword(config.seed.adminPassword),
            isActive: true,
        },
    });
    console.log(`[reset] admin ${isNew ? "created" : "kept"}: ${email} / ${config.seed.adminPassword}`);
    return admin;
}

async function seedServices() {
    const created = [];
    for (const definition of SERVICES) {
        const [service, isNew] = await Service.findOrCreate({
            where: { name: definition.name },
            defaults: definition,
        });
        if (!isNew) await service.update(definition);
        created.push(service);
    }
    const keep = created.map((s) => s.id);
    const [retired] = await Service.update(
        { isActive: false },
        { where: { id: { [Op.notIn]: keep } } },
    );

    console.log(`[reset] ${created.length} services configured`
        + (retired ? `, ${retired} stray service(s) deactivated` : ""));
    return created;
}

async function seedCustomers() {
    const created = [];
    for (const definition of DEMO_CUSTOMERS) {
        created.push(await Customer.create(definition));
    }
    console.log(`[reset] ${created.length} customers created`);
    return created;
}

async function seedBookings(services, customers) {
    const today = todayISO();
    let made = 0;

    for (const entry of DEMO_BOOKINGS) {
        const service = services[entry.service];
        const customer = customers[entry.customer];
        const date = addDays(today, entry.dayOffset);

        const booking = await createBooking({
            customerId: customer.id,
            serviceId: service.id,
            date,
            startMin: entry.startMin,
            source: entry.source,
        });

        if (booking) {
            made += 1;
            console.log(`[reset] ${formatDateShort(date)}  ${minutesToLabel(entry.startMin).padStart(8)}  ${service.name.padEnd(15)} ${customer.name}`);
        }
    }

    console.log(`[reset] ${made} demo bookings created`);
}

async function summary(services) {
    const today = todayISO();
    console.log("");
    console.log("[reset] bookable slots per day (materialised and filtered for past times):");

    for (let day = 0; day <= 3; day += 1) {
        const date = addDays(today, day);
        const parts = [];
        for (const service of services) {
            const open = await listAvailability(service.id, date);
            parts.push(`${service.name} ${String(open.length).padStart(2)}`);
        }
        console.log(`  ${formatDateShort(date).padEnd(24)} ${parts.join("  ·  ")}`);
    }
}

async function resetDemoData({ quiet = false } = {}) {
    const log = console.log;
    if (quiet) console.log = () => {};

    await wipe();
    await seedAdmin();
    const services = await seedServices();
    const customers = await seedCustomers();
    await seedBookings(services, customers);

    if (quiet) console.log = log;
    return { services, customers };
}

async function run() {
    try {
        await sequelize.authenticate();
        const { services } = await resetDemoData();
        await summary(services);

        console.log("");
        console.log("[reset] demo data ready");
        process.exit(0);
    } catch (err) {
        console.error("[reset] failed:", err.message);
        process.exit(1);
    }
}

if (require.main === module) run();

module.exports = { resetDemoData };
