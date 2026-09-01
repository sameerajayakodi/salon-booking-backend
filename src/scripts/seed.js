const { config } = require("../config/env");
const { sequelize, AdminUser, Service, Customer } = require("../models");
const { hashPassword } = require("../services/authService");
const { createBooking } = require("../services/bookingService");
const { todayISO, addDays, minutesToLabel } = require("../utils/time");

const WEEKDAYS = ["1", "2", "3", "4", "5", "6"];

function weeklyFrom(times) {
    return WEEKDAYS.reduce((acc, day) => ({ ...acc, [day]: times }), {});
}

const SERVICES = [
    {
        name: "Facial",
        durationMin: 60,
        aliases: ["facial", "face treatment", "facial eka", "මුහුණු", "මුහුණු ප්‍රතිකාර", "முக", "முகம்"],
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

const SAMPLE_CUSTOMERS = [
    { phone: "94771234567", name: "Nimali Perera", lang: "sien" },
    { phone: "94772345678", name: "Sanduni Fernando", lang: "si" },
    { phone: "94773456789", name: "Kavitha Raj", lang: "ta" },
    { phone: "94774567890", name: "Amaya Silva", lang: "en" },
];

async function seedAdmin() {
    const email = config.seed.adminEmail.toLowerCase().trim();
    const existing = await AdminUser.findOne({ where: { email } });
    if (existing) {
        console.log(`[seed] admin already exists: ${email}`);
        return existing;
    }

    const admin = await AdminUser.create({
        name: config.seed.adminName,
        email,
        passwordHash: await hashPassword(config.seed.adminPassword),
        isActive: true,
    });

    console.log(`[seed] admin created: ${email} / ${config.seed.adminPassword}`);
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
        console.log(`[seed] service ${isNew ? "created" : "updated"}: ${service.name}`);
    }
    return created;
}

async function seedCustomers() {
    const created = [];
    for (const definition of SAMPLE_CUSTOMERS) {
        const [customer] = await Customer.findOrCreate({
            where: { phone: definition.phone },
            defaults: definition,
        });
        created.push(customer);
    }
    return created;
}

async function seedBookings(services, customers) {
    const today = todayISO();
    const plan = [
        { customer: 0, service: 0, date: today, startMin: 600 },
        { customer: 1, service: 3, date: today, startMin: 870 },
        { customer: 2, service: 2, date: today, startMin: 930 },
        { customer: 3, service: 1, date: addDays(today, 1), startMin: 540 },
        { customer: 0, service: 3, date: addDays(today, 2), startMin: 630 },
        { customer: 1, service: 0, date: addDays(today, 3), startMin: 900 },
    ];

    for (const entry of plan) {
        const service = services[entry.service];
        const customer = customers[entry.customer];

        const booking = await createBooking({
            customerId: customer.id,
            serviceId: service.id,
            date: entry.date,
            startMin: entry.startMin,
            source: "MANUAL",
        });

        if (booking) {
            console.log(`[seed] booking: ${customer.name} · ${service.name} · ${entry.date} ${minutesToLabel(entry.startMin)}`);
        }
    }
}

async function run() {
    try {
        await sequelize.authenticate();

        await seedAdmin();
        const services = await seedServices();
        const customers = await seedCustomers();
        await seedBookings(services, customers);

        console.log("[seed] done");
        process.exit(0);
    } catch (err) {
        console.error("[seed] failed:", err.message);
        process.exit(1);
    }
}

run();
