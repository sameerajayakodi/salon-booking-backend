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
        aliases: ["facial", "face treatment", "facial eka", "face", "මුහුණු", "මුහුණු ප්‍රතිකාර", "ෆේෂල්", "முக", "முகம்", "ஃபேஷியல்"],
        weekly: weeklyFrom([540, 600, 660, 840, 900, 960]), // 9:00, 10:00, 11:00, 14:00, 15:00, 16:00
    },
    {
        name: "Hair Colouring",
        durationMin: 120,
        aliases: ["colour", "color", "colouring", "hair color", "hair colour", "hair colour eka", "කොණ්ඩය තීන්ත", "හෙයාර් කලර්", "කලරින්", "முடி சாயம்", "ஹேர் கலர்"],
        weekly: weeklyFrom([540, 660, 840, 960]), // 9:00, 11:00, 14:00, 16:00
    },
    {
        name: "Cleanup",
        durationMin: 45,
        aliases: ["cleanup", "clean up", "clean-up", "cleanup eka", "ක්ලීන් අප්", "ක්ලීනප්", "கிளீன் அப்", "க்ளீன் அப்"],
        weekly: weeklyFrom([540, 585, 630, 840, 885, 930]), // 9:00, 9:45, 10:30, 14:00, 14:45, 15:30
    },
    {
        name: "Haircut",
        durationMin: 30,
        aliases: ["haircut", "hair cut", "hair cut eka", "kes kapanna", "හෙයාර් කට්", "කොණ්ඩේ කපන", "කොණ්ඩ කැපීම", "முடி வெட்ட", "ஹேர்கட்"],
        weekly: weeklyFrom([540, 570, 600, 630, 660, 840, 870, 900, 930, 960]),
    },
];

// Rich Sri Lankan Customers covering all 4 language types (si, sien, ta, en)
const SRI_LANKAN_CUSTOMERS = [
    // Sinhala (si)
    { phone: "94772345678", name: "Sanduni Fernando", lang: "si" },
    { phone: "94712349876", name: "Dilhani Wijesinghe", lang: "si" },
    { phone: "94761238945", name: "Sachini Jayasuriya", lang: "si" },
    { phone: "94701235678", name: "Chamari Athapaththu", lang: "si" },
    { phone: "94778899001", name: "Kaveesha Samaranayake", lang: "si" },

    // Singlish (sien)
    { phone: "94771234567", name: "Nimali Perera", lang: "sien" },
    { phone: "94776789012", name: "Tharushi Jayawardena", lang: "sien" },
    { phone: "94785671234", name: "Oshadi Ranasinghe", lang: "sien" },
    { phone: "94779876543", name: "Dinuka Senanayake", lang: "sien" },
    { phone: "94765432109", name: "Hansi Wickramasinghe", lang: "sien" },

    // Tamil (ta)
    { phone: "94773456789", name: "Kavitha Raj", lang: "ta" },
    { phone: "94777890123", name: "Priyadharshini Shanmugam", lang: "ta" },
    { phone: "94763456789", name: "Anushiya Sivakumar", lang: "ta" },
    { phone: "94718901234", name: "Thivya Tharmalingam", lang: "ta" },
    { phone: "94770123987", name: "Pavithra Selvam", lang: "ta" },

    // English (en)
    { phone: "94774567890", name: "Amaya Silva", lang: "en" },
    { phone: "94775678901", name: "Ishara Bandara", lang: "en" },
    { phone: "94778901234", name: "Natalie De Kauwe", lang: "en" },
    { phone: "94769012345", name: "Shenelle Rodrigo", lang: "en" },
    { phone: "94715678902", name: "Minoli Ratnayake", lang: "en" },
];

// Demo bookings spanning Today, Upcoming, and Past
const DEMO_BOOKINGS = [
    // Today's Bookings (0 dayOffset)
    { customerIndex: 0, serviceIndex: 0, dayOffset: 0, startMin: 540, source: "WHATSAPP" }, // Sanduni Fernando (si) - Facial (09:00 AM)
    { customerIndex: 5, serviceIndex: 2, dayOffset: 0, startMin: 585, source: "WHATSAPP" }, // Nimali Perera (sien) - Cleanup (09:45 AM)
    { customerIndex: 10, serviceIndex: 3, dayOffset: 0, startMin: 660, source: "WHATSAPP" }, // Kavitha Raj (ta) - Haircut (11:00 AM)
    { customerIndex: 15, serviceIndex: 1, dayOffset: 0, startMin: 840, source: "MANUAL" },   // Amaya Silva (en) - Hair Colouring (02:00 PM)
    { customerIndex: 1, serviceIndex: 3, dayOffset: 0, startMin: 900, source: "WHATSAPP" },  // Dilhani Wijesinghe (si) - Haircut (03:00 PM)

    // Tomorrow's Bookings (+1 dayOffset)
    { customerIndex: 6, serviceIndex: 0, dayOffset: 1, startMin: 600, source: "WHATSAPP" }, // Tharushi Jayawardena (sien) - Facial (10:00 AM)
    { customerIndex: 11, serviceIndex: 1, dayOffset: 1, startMin: 660, source: "MANUAL" },  // Priyadharshini Shanmugam (ta) - Hair Colouring (11:00 AM)
    { customerIndex: 16, serviceIndex: 2, dayOffset: 1, startMin: 840, source: "WHATSAPP" }, // Ishara Bandara (en) - Cleanup (02:00 PM)
    { customerIndex: 2, serviceIndex: 3, dayOffset: 1, startMin: 960, source: "MANUAL" },   // Sachini Jayasuriya (si) - Haircut (04:00 PM)

    // Upcoming (+2 days)
    { customerIndex: 7, serviceIndex: 2, dayOffset: 2, startMin: 540, source: "WHATSAPP" }, // Oshadi Ranasinghe (sien) - Cleanup (09:00 AM)
    { customerIndex: 12, serviceIndex: 3, dayOffset: 2, startMin: 570, source: "WHATSAPP" }, // Anushiya Sivakumar (ta) - Haircut (09:30 AM)
    { customerIndex: 17, serviceIndex: 0, dayOffset: 2, startMin: 660, source: "MANUAL" },  // Natalie De Kauwe (en) - Facial (11:00 AM)
    { customerIndex: 3, serviceIndex: 1, dayOffset: 2, startMin: 840, source: "WHATSAPP" },  // Chamari Athapaththu (si) - Hair Colouring (02:00 PM)

    // Upcoming (+3 days)
    { customerIndex: 8, serviceIndex: 3, dayOffset: 3, startMin: 600, source: "WHATSAPP" }, // Dinuka Senanayake (sien) - Haircut (10:00 AM)
    { customerIndex: 13, serviceIndex: 0, dayOffset: 3, startMin: 900, source: "WHATSAPP" }, // Thivya Tharmalingam (ta) - Facial (03:00 PM)
    { customerIndex: 18, serviceIndex: 2, dayOffset: 3, startMin: 930, source: "MANUAL" },  // Shenelle Rodrigo (en) - Cleanup (03:30 PM)

    // Upcoming (+4 days)
    { customerIndex: 4, serviceIndex: 0, dayOffset: 4, startMin: 540, source: "WHATSAPP" }, // Kaveesha Samaranayake (si) - Facial (09:00 AM)
    { customerIndex: 9, serviceIndex: 1, dayOffset: 4, startMin: 660, source: "WHATSAPP" }, // Hansi Wickramasinghe (sien) - Hair Colouring (11:00 AM)
    { customerIndex: 14, serviceIndex: 2, dayOffset: 4, startMin: 885, source: "MANUAL" },  // Pavithra Selvam (ta) - Cleanup (02:45 PM)
    { customerIndex: 19, serviceIndex: 3, dayOffset: 4, startMin: 930, source: "WHATSAPP" }, // Minoli Ratnayake (en) - Haircut (03:30 PM)
];

// Sample multi-turn conversation histories in authentic Sri Lankan languages
const SAMPLE_CONVERSATIONS = [
    {
        customerIndex: 0, // Sanduni Fernando (si)
        lang: "si",
        history: [
            { role: "user", content: "ආයුබෝවන්, මට Facial එකක් දාගන්න පුළුවන්ද?", timestamp: new Date(Date.now() - 3600000 * 4).toISOString() },
            { role: "assistant", content: "හොඳ තේරීමක්! ඔබට වඩාත්ම පහසු මොන දවසද?\n1. අද\n2. හෙට\n3. අනිද්දා", timestamp: new Date(Date.now() - 3600000 * 3.9).toISOString() },
            { role: "user", content: "අද උදේ 9ට පුළුවන්ද?", timestamp: new Date(Date.now() - 3600000 * 3.8).toISOString() },
            { role: "assistant", content: "නියමයි. Booking එක දාන්න ඔබේ නම කියන්න පුළුවන්ද?", timestamp: new Date(Date.now() - 3600000 * 3.7).toISOString() },
            { role: "user", content: "Sanduni Fernando", timestamp: new Date(Date.now() - 3600000 * 3.6).toISOString() },
            { role: "assistant", content: "ඔන්න අවසන් පියවර! ඔබේ Booking විස්තර මෙන්න:\n\n👤 *නම:* Sanduni Fernando\n💇 *සේවාව:* Facial\n📅 *දිනය:* අද\n⏰ *වේලාව:* 9:00 AM\n\n*Confirm* කියලා එවන්න, මම මේක Book කරලා දෙන්නම්.", timestamp: new Date(Date.now() - 3600000 * 3.5).toISOString() },
            { role: "user", content: "Confirm", timestamp: new Date(Date.now() - 3600000 * 3.4).toISOString() },
            { role: "assistant", content: "🎉 *ඔබේ Appointment එක සාර්ථකව වෙන් කරගත්තා!*\n\n🔖 *Booking No:* SB-000001\n💇 *සේවාව:* Facial\n📅 *දිනය:* අද\n⏰ *වේලාව:* 9:00 AM\n\nනො. 42, ගාලු පාර, කොළඹ 03 වෙතින් ඔබව හමුවනතුරු බලා සිටිමු. ස්තූතියි! ✨", timestamp: new Date(Date.now() - 3600000 * 3.3).toISOString() },
        ],
    },
    {
        customerIndex: 5, // Nimali Perera (sien)
        lang: "sien",
        history: [
            { role: "user", content: "Ayubowan! Cleanup ekak karaganna one ada.", timestamp: new Date(Date.now() - 3600000 * 2).toISOString() },
            { role: "assistant", content: "Hoda choice ekak! Ada ta thiyena open times:\n1. 9:00 AM\n2. 9:45 AM\n3. 10:30 AM\n4. 2:00 PM\n\nMona welawada oyata hari?", timestamp: new Date(Date.now() - 3600000 * 1.9).toISOString() },
            { role: "user", content: "2 (9.45 am)", timestamp: new Date(Date.now() - 3600000 * 1.8).toISOString() },
            { role: "assistant", content: "Niyamai. Booking ekata oyage nama kiyanna puluwanda?", timestamp: new Date(Date.now() - 3600000 * 1.7).toISOString() },
            { role: "user", content: "Nimali Perera", timestamp: new Date(Date.now() - 3600000 * 1.6).toISOString() },
            { role: "assistant", content: "Thawa tikai me details harida balanna:\n\n👤 *Nama:* Nimali Perera\n💇 *Service:* Cleanup\n📅 *Date:* Ada\n⏰ *Time:* 9:45 AM\n\n*Confirm* kiyala reply karanna, mama book karala dennam.", timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString() },
            { role: "user", content: "Confirm", timestamp: new Date(Date.now() - 3600000 * 1.4).toISOString() },
            { role: "assistant", content: "🎉 *Oyage appointment eka confirm una!*\n\n🔖 *Booking No:* SB-000002\n💇 *Service:* Cleanup\n📅 *Date:* Ada\n⏰ *Time:* 9:45 AM\n\nSalon ekata oyawa sadarayen piligannawa. Bohoma sthuthiyi! ✨", timestamp: new Date(Date.now() - 3600000 * 1.3).toISOString() },
        ],
    },
    {
        customerIndex: 10, // Kavitha Raj (ta)
        lang: "ta",
        history: [
            { role: "user", content: "வணக்கம், இன்று எனக்கு ஒரு Haircut பதிவு செய்ய வேண்டும்.", timestamp: new Date(Date.now() - 3600000 * 5).toISOString() },
            { role: "assistant", content: "சிறந்த தேர்வு! இன்று கிடைக்கும் நேரங்கள்:\n1. 9:00 AM\n2. 10:00 AM\n3. 11:00 AM\n4. 2:00 PM\n\nஎந்த நேரம் உங்களுக்கு வசதி?", timestamp: new Date(Date.now() - 3600000 * 4.9).toISOString() },
            { role: "user", content: "11:00 AM", timestamp: new Date(Date.now() - 3600000 * 4.8).toISOString() },
            { role: "assistant", content: "அருமை. முன்பதிவிற்காக உங்கள் பெயரைச் சொல்ல முடியுமா?", timestamp: new Date(Date.now() - 3600000 * 4.7).toISOString() },
            { role: "user", content: "Kavitha Raj", timestamp: new Date(Date.now() - 3600000 * 4.6).toISOString() },
            { role: "assistant", content: "கிட்டத்தட்ட முடிந்தது! உங்கள் முன்பதிவு விபரம்:\n\n👤 *பெயர்:* Kavitha Raj\n💇 *சேவை:* Haircut\n📅 *தேதி:* இன்று\n⏰ *நேரம்:* 11:00 AM\n\nபதிவு செய்ய *Confirm* எனப் பதிலளிக்கவும்.", timestamp: new Date(Date.now() - 3600000 * 4.5).toISOString() },
            { role: "user", content: "Confirm", timestamp: new Date(Date.now() - 3600000 * 4.4).toISOString() },
            { role: "assistant", content: "🎉 *உங்கள் முன்பதிவு உறுதி செய்யப்பட்டது!*\n\n🔖 *Booking No:* SB-000003\n💇 *சேவை:* Haircut\n📅 *தேதி:* இன்று\n⏰ *நேரம்:* 11:00 AM\n\nசலூனில் உங்களைச் சந்திக்க ஆவலுடன் காத்திருக்கிறோம். நன்றி! ✨", timestamp: new Date(Date.now() - 3600000 * 4.3).toISOString() },
        ],
    },
    {
        customerIndex: 15, // Amaya Silva (en)
        lang: "en",
        history: [
            { role: "user", content: "Hello! What are your rates and opening hours?", timestamp: new Date(Date.now() - 3600000 * 6).toISOString() },
            { role: "assistant", content: "Of course! Here are our rates: 💳\n- Facial — 5,500 rupees, 60 min\n- Hair Colouring — from 8,500 rupees, 120 min\n- Cleanup — 3,500 rupees, 45 min\n- Haircut — 2,500 rupees, 30 min\n\n🕒 *Opening Hours:*\nMonday to Friday, 9:00 AM to 6:00 PM\nSaturday, 9:00 AM to 6:00 PM\nClosed on Sundays\n\nWould you like to book an appointment? ✨", timestamp: new Date(Date.now() - 3600000 * 5.9).toISOString() },
            { role: "user", content: "Yes please, I'd like Hair Colouring today at 2 PM.", timestamp: new Date(Date.now() - 3600000 * 5.8).toISOString() },
            { role: "assistant", content: "Perfect. May I have your name for the booking?", timestamp: new Date(Date.now() - 3600000 * 5.7).toISOString() },
            { role: "user", content: "Amaya Silva", timestamp: new Date(Date.now() - 3600000 * 5.6).toISOString() },
            { role: "assistant", content: "Almost done! Here are your appointment details:\n\n👤 *Name:* Amaya Silva\n💇 *Service:* Hair Colouring\n📅 *Date:* Today\n⏰ *Time:* 2:00 PM\n\nReply *Confirm* and I will book it for you.", timestamp: new Date(Date.now() - 3600000 * 5.5).toISOString() },
            { role: "user", content: "Confirm", timestamp: new Date(Date.now() - 3600000 * 5.4).toISOString() },
            { role: "assistant", content: "🎉 *All done, your appointment is confirmed!*\n\n🔖 *Booking No:* SB-000004\n💇 *Service:* Hair Colouring\n📅 *Date:* Today\n⏰ *Time:* 2:00 PM\n\nWe look forward to seeing you at No. 42, Galle Road, Colombo 03. Thank you!", timestamp: new Date(Date.now() - 3600000 * 5.3).toISOString() },
        ],
    },
];

async function wipeDatabase() {
    console.log("[reset] Cleaning entire database...");
    await Booking.destroy({ where: {}, truncate: false });
    await Conversation.destroy({ where: {}, truncate: false });
    await Slot.destroy({ where: {}, truncate: false });
    await Customer.destroy({ where: {}, truncate: false });
    console.log("[reset] Cleared all bookings, conversations, slots, and customers.");
}

async function seedAdminUser() {
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
    if (!isNew) {
        await admin.update({
            name: config.seed.adminName,
            passwordHash: await hashPassword(config.seed.adminPassword),
            isActive: true,
        });
    }
    console.log(`[reset] Admin ready: ${email} (${admin.name})`);
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

    console.log(`[reset] ${created.length} services configured${retired ? `, ${retired} retired` : ""}`);
    return created;
}

async function seedCustomers() {
    const created = [];
    for (const definition of SRI_LANKAN_CUSTOMERS) {
        const customer = await Customer.create(definition);
        created.push(customer);
    }
    console.log(`[reset] ${created.length} Sri Lankan customers created across Sinhala, Singlish, Tamil & English contexts.`);
    return created;
}

async function seedBookings(services, customers) {
    const today = todayISO();
    let made = 0;
    const createdBookings = [];

    for (const entry of DEMO_BOOKINGS) {
        const service = services[entry.serviceIndex];
        const customer = customers[entry.customerIndex];
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
            createdBookings.push(booking);
            console.log(`[reset] Booking #${booking.id} (${booking.source}) ${formatDateShort(date)}  ${minutesToLabel(entry.startMin).padStart(8)}  ${service.name.padEnd(15)} ${customer.name} [${customer.lang}]`);
        }
    }

    // Cancel 2 bookings to have realistic cancelled status demonstration
    if (createdBookings.length >= 8) {
        const toCancel1 = createdBookings[createdBookings.length - 2];
        const toCancel2 = createdBookings[createdBookings.length - 1];

        await toCancel1.update({
            status: "CANCELLED",
            slotId: null,
            cancelledAt: new Date(Date.now() - 3600000 * 2),
        });
        await toCancel2.update({
            status: "CANCELLED",
            slotId: null,
            cancelledAt: new Date(Date.now() - 3600000 * 5),
        });
        console.log(`[reset] Marked Booking #${toCancel1.id} and #${toCancel2.id} as CANCELLED for demo status testing.`);
    }

    console.log(`[reset] ${made} total bookings created.`);
}

async function seedConversations(customers) {
    let convCount = 0;
    for (const item of SAMPLE_CONVERSATIONS) {
        const customer = customers[item.customerIndex];
        if (!customer) continue;

        await Conversation.create({
            customerId: customer.id,
            draft: {},
            history: item.history,
            lang: item.lang,
            lastIntent: null,
        });
        convCount += 1;
    }
    console.log(`[reset] ${convCount} multilingual conversation histories created.`);
}

async function displaySummary(services) {
    const today = todayISO();
    console.log("");
    console.log("[reset] Bookable slots per day:");

    for (let day = 0; day <= 4; day += 1) {
        const date = addDays(today, day);
        const parts = [];
        for (const service of services) {
            const open = await listAvailability(service.id, date);
            parts.push(`${service.name}: ${open.length} slots`);
        }
        console.log(`  ${formatDateShort(date).padEnd(24)} | ${parts.join("  ·  ")}`);
    }
}

async function resetDemoData({ quiet = false } = {}) {
    const originalLog = console.log;
    if (quiet) console.log = () => {};

    await wipeDatabase();
    await seedAdminUser();
    const services = await seedServices();
    const customers = await seedCustomers();
    await seedBookings(services, customers);
    await seedConversations(customers);

    if (quiet) console.log = originalLog;
    return { services, customers };
}

async function run() {
    try {
        await sequelize.authenticate();
        console.log("[reset] Database connected successfully.");
        const { services } = await resetDemoData();
        await displaySummary(services);

        console.log("\n[reset] Complete database wipe and Sri Lankan multilingual seeding completed successfully! ✨");
        process.exit(0);
    } catch (err) {
        console.error("[reset] Failed:", err);
        process.exit(1);
    }
}

if (require.main === module) run();

module.exports = { resetDemoData };
