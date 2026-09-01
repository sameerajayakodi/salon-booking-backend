const { sequelize, Customer, Booking, Slot, Service } = require("../models");
const { createBooking } = require("../services/bookingService");
const { listAvailability } = require("../services/availabilityService");
const { todayISO, addDays, minutesToLabel } = require("../utils/time");

const CONTENDERS = 25;

async function run() {
    const service = await Service.findOne({ where: { name: "Haircut" } });

    let date = null;
    let open = [];
    for (let offset = 1; offset <= 14; offset += 1) {
        const candidate = addDays(todayISO(), offset);
        const slots = await listAvailability(service.id, candidate);
        if (slots.length) {
            date = candidate;
            open = slots;
            break;
        }
    }

    if (!date) {
        console.error("[race] no open slot to contend for within 14 days");
        process.exit(1);
    }

    const startMin = open[0].startMin;

    await Booking.destroy({ where: { serviceId: service.id, slotDate: date, startMin } });
    await Slot.update({ status: "OPEN" }, { where: { serviceId: service.id, slotDate: date, startMin } });

    const customers = [];
    for (let i = 0; i < CONTENDERS; i += 1) {
        const phone = `94779${String(100000 + i).padStart(6, "0")}`;
        const [customer] = await Customer.findOrCreate({
            where: { phone },
            defaults: { phone, name: `Contender ${i}`, lang: "en" },
        });
        customers.push(customer);
    }

    const results = await Promise.allSettled(
        customers.map((c) => createBooking({
            customerId: c.id,
            serviceId: service.id,
            date,
            startMin,
            source: "MANUAL",
        })),
    );

    const won = results.filter((r) => r.status === "fulfilled" && r.value).length;
    const lost = results.filter((r) => r.status === "fulfilled" && !r.value).length;
    const threw = results.filter((r) => r.status === "rejected").length;

    const rows = await Booking.count({ where: { serviceId: service.id, slotDate: date, startMin } });
    const slot = await Slot.findOne({ where: { serviceId: service.id, slotDate: date, startMin } });

    console.log("");
    console.log("=".repeat(88));
    console.log("ATOMIC SLOT CLAIM CHECK (US-05)");
    console.log("=".repeat(88));
    console.log(`  contending on ${service.name} · ${date} · ${minutesToLabel(startMin)}`);
    console.log(`  concurrent attempts : ${CONTENDERS}`);
    console.log(`  claims won          : ${won}`);
    console.log(`  claims lost cleanly : ${lost}`);
    console.log(`  exceptions thrown   : ${threw}`);
    console.log(`  booking rows in DB  : ${rows}`);
    console.log(`  final slot status   : ${slot ? slot.status : "missing"}`);

    const ok = won === 1 && rows === 1 && threw === 0 && slot && slot.status === "BOOKED";
    console.log("=".repeat(88));
    console.log(ok ? "  PASS — exactly one winner, no exceptions, slot locked" : "  FAIL — the lock did not hold");
    console.log("=".repeat(88));
    console.log("");

    await Booking.destroy({ where: { serviceId: service.id, slotDate: date, startMin } });
    await Slot.update({ status: "OPEN" }, { where: { serviceId: service.id, slotDate: date, startMin } });
    await Customer.destroy({ where: { name: { [require("sequelize").Op.like]: "Contender %" } } });

    await sequelize.close();
    process.exit(ok ? 0 : 1);
}

run();
