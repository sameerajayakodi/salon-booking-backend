const logger = require("../log/logger");
const { Op } = require("sequelize");
const { Service, Slot } = require("../models");
const { config } = require("../config/env");
const { SLOT_STATUS, PERIOD } = require("../constants/booking");
const { todayISO, nowMinutes, weekdayOf, addDays, daysBetween } = require("../utils/time");

async function ensureDay(service, dateISO) {
    const weekly = service.weekly || {};
    const times = weekly[String(weekdayOf(dateISO))] || [];
    if (!times.length) return;

    const rows = times.map((startMin) => ({
        serviceId: service.id,
        slotDate: dateISO,
        startMin,
        endMin: startMin + service.durationMin,
        status: SLOT_STATUS.OPEN,
    }));

    await Slot.bulkCreate(rows, { ignoreDuplicates: true });

    logger.debug("Slots materialised for the day", {
        event: "slot.generate",
        serviceId: service.id,
        service: service.name,
        date: dateISO,
        candidates: rows.length,
    });
}

function withinHorizon(dateISO) {
    const offset = daysBetween(todayISO(), dateISO);
    return offset >= 0 && offset <= config.salon.bookingHorizonDays;
}

async function listAvailability(serviceId, dateISO, period) {
    const service = await Service.findByPk(serviceId);
    if (!service || !service.isActive || !withinHorizon(dateISO)) return [];

    await ensureDay(service, dateISO);

    const [lo, hi] = PERIOD[period] || [0, 1439];
    const floor = dateISO === todayISO() ? nowMinutes() : -1;

    const slots = await Slot.findAll({
        where: {
            serviceId,
            slotDate: dateISO,
            status: SLOT_STATUS.OPEN,
            startMin: { [Op.gte]: Math.max(lo, floor + 1), [Op.lte]: hi },
        },
        order: [["startMin", "ASC"]],
    });

    logger.info("Availability checked", {
        event: "slot.availability",
        serviceId,
        service: service.name,
        date: dateISO,
        period: period || "ANY",
        window: [Math.max(lo, floor + 1), hi],
        openCount: slots.length,
        openTimes: slots.map((s) => s.startMin),
    });

    return slots;
}

async function suggestAlternatives(serviceId, dateISO, requestedMin) {
    const slots = await listAvailability(serviceId, dateISO);
    if (requestedMin === null || requestedMin === undefined) {
        return slots.slice(0, config.salon.alternativeSlotCount);
    }

    return [...slots]
        .sort((a, b) => Math.abs(a.startMin - requestedMin) - Math.abs(b.startMin - requestedMin))
        .slice(0, config.salon.alternativeSlotCount)
        .sort((a, b) => a.startMin - b.startMin);
}

async function nextOpenDates(serviceId, fromISO, count = 2, scanDays = 14, startOffset = 1) {
    const found = [];
    for (let i = startOffset; i <= scanDays && found.length < count; i += 1) {
        const candidate = addDays(fromISO, i);
        if (!withinHorizon(candidate)) break;
        const slots = await listAvailability(serviceId, candidate);
        if (slots.length) found.push(candidate);
    }
    return found;
}

module.exports = {
    ensureDay,
    withinHorizon,
    listAvailability,
    suggestAlternatives,
    nextOpenDates,
};
