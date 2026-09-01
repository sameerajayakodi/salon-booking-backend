const logger = require("../log/logger");
const { Op } = require("sequelize");
const { sequelize, Booking, Customer, Service, Slot } = require("../models");
const { SLOT_STATUS, BOOKING_STATUS, BOOKING_SOURCE } = require("../constants/booking");
const { appError } = require("../middleware/errorHandler");
const { ensureDay } = require("./availabilityService");
const { todayISO, minutesToLabel, formatDateLong } = require("../utils/time");

async function upsertCustomer(phone, patch = {}) {
    const [customer] = await Customer.findOrCreate({
        where: { phone },
        defaults: { phone, name: patch.name || null, lang: patch.lang || "en" },
    });

    const changes = {};
    if (patch.name && patch.name !== customer.name) changes.name = patch.name;
    if (patch.lang && patch.lang !== customer.lang) changes.lang = patch.lang;
    if (Object.keys(changes).length) await customer.update(changes);

    return customer;
}

async function createBooking({ customerId, serviceId, date, startMin, source = BOOKING_SOURCE.WHATSAPP }) {
    const service = await Service.findByPk(serviceId);
    if (!service || !service.isActive) {
        throw appError(400, "service_unavailable", "That service is not available for booking");
    }

    await ensureDay(service, date);

    return sequelize.transaction(async (t) => {
        const [claimed] = await Slot.update(
            { status: SLOT_STATUS.BOOKED },
            {
                where: { serviceId, slotDate: date, startMin, status: SLOT_STATUS.OPEN },
                transaction: t,
            },
        );

        if (claimed === 0) {
            logger.warn("Slot claim lost, offering alternatives", {
                event: "booking.claim.lost",
                serviceId,
                service: service.name,
                date,
                startMin,
                time: minutesToLabel(startMin),
                customerId,
            });
            return null;
        }

        const slot = await Slot.findOne({
            where: { serviceId, slotDate: date, startMin },
            transaction: t,
        });

        const booking = await Booking.create(
            {
                customerId,
                serviceId,
                slotId: slot.id,
                slotDate: date,
                startMin,
                durationMin: service.durationMin,
                status: BOOKING_STATUS.CONFIRMED,
                source,
            },
            { transaction: t },
        );

        logger.info("Booking confirmed", {
            event: "booking.created",
            bookingId: booking.id,
            slotId: slot.id,
            serviceId,
            service: service.name,
            date,
            time: minutesToLabel(startMin),
            durationMin: service.durationMin,
            customerId,
            source,
        });

        return booking;
    });
}

async function cancelBooking(bookingId) {
    const cancelled = await sequelize.transaction(async (t) => {
        const booking = await Booking.findByPk(bookingId, { transaction: t });

        if (!booking) throw appError(404, "booking_not_found", "Booking not found");
        if (booking.status === BOOKING_STATUS.CANCELLED) {
            throw appError(409, "already_cancelled", "This booking is already cancelled");
        }

        const releasedSlotId = booking.slotId;

        await booking.update(
            { status: BOOKING_STATUS.CANCELLED, slotId: null, cancelledAt: new Date() },
            { transaction: t },
        );

        if (releasedSlotId) {
            await Slot.update(
                { status: SLOT_STATUS.OPEN },
                { where: { id: releasedSlotId }, transaction: t },
            );
        }

        logger.info("Booking cancelled, slot released", {
            event: "booking.cancelled",
            bookingId: booking.id,
            releasedSlotId,
            date: booking.slotDate,
            time: minutesToLabel(booking.startMin),
            customerId: booking.customerId,
        });

        return booking;
    });

    return Booking.findByPk(cancelled.id, {
        include: [
            { model: Customer, as: "customer" },
            { model: Service, as: "service" },
        ],
    });
}

function serialize(booking) {
    return {
        id: booking.id,
        status: booking.status,
        source: booking.source,
        date: booking.slotDate,
        dateLabel: formatDateLong(booking.slotDate),
        startMin: booking.startMin,
        timeLabel: minutesToLabel(booking.startMin),
        durationMin: booking.durationMin,
        endLabel: minutesToLabel(booking.startMin + booking.durationMin),
        createdAt: booking.createdAt,
        cancelledAt: booking.cancelledAt,
        service: booking.service ? { id: booking.service.id, name: booking.service.name } : null,
        customer: booking.customer
            ? {
                id: booking.customer.id,
                name: booking.customer.name,
                phone: booking.customer.phone,
                lang: booking.customer.lang,
            }
            : null,
    };
}

function bookingPayload(booking, timezone) {
    const startMin = booking.startMin;
    const endMin = startMin + booking.durationMin;

    return {
        id: booking.id,
        reference: `SB-${String(booking.id).padStart(6, "0")}`,
        status: booking.status,
        source: booking.source,
        customer: booking.customer
            ? {
                id: booking.customer.id,
                name: booking.customer.name,
                phone: booking.customer.phone,
                language: booking.customer.lang,
            }
            : null,
        service: booking.service
            ? {
                id: booking.service.id,
                name: booking.service.name,
                durationMin: booking.durationMin,
            }
            : null,
        appointment: {
            date: booking.slotDate,
            dateLabel: formatDateLong(booking.slotDate),
            startMin,
            startLabel: minutesToLabel(startMin),
            endMin,
            endLabel: minutesToLabel(endMin),
            durationMin: booking.durationMin,
            timezone,
        },
        slotId: booking.slotId,
        createdAt: booking.createdAt,
        cancelledAt: booking.cancelledAt,
    };
}

async function findBooking(bookingId) {
    const booking = await Booking.findByPk(bookingId, {
        include: [
            { model: Customer, as: "customer" },
            { model: Service, as: "service" },
        ],
    });
    if (!booking) throw appError(404, "booking_not_found", "Booking not found");
    return booking;
}

async function listBookings({ scope = "today", page = 1, limit = 25, search }) {
    const today = todayISO();
    const where = {};

    if (scope === "today") where.slotDate = today;
    if (scope === "upcoming") where.slotDate = { [Op.gt]: today };

    const customerInclude = { model: Customer, as: "customer" };
    if (search) {
        customerInclude.where = {
            [Op.or]: [
                { name: { [Op.like]: "%" + search + "%" } },
                { phone: { [Op.like]: "%" + search + "%" } },
            ],
        };
    }

    const { rows, count } = await Booking.findAndCountAll({
        where,
        include: [{ model: Service, as: "service" }, customerInclude],
        order: [["slotDate", "ASC"], ["startMin", "ASC"]],
        offset: (page - 1) * limit,
        limit,
        distinct: true,
    });

    return {
        items: rows.map(serialize),
        total: count,
        page,
        pages: Math.max(1, Math.ceil(count / limit)),
    };
}

async function countsByScope() {
    const today = todayISO();
    const [todayCount, upcomingCount, cancelledCount] = await Promise.all([
        Booking.count({ where: { slotDate: today, status: BOOKING_STATUS.CONFIRMED } }),
        Booking.count({ where: { slotDate: { [Op.gt]: today }, status: BOOKING_STATUS.CONFIRMED } }),
        Booking.count({ where: { status: BOOKING_STATUS.CANCELLED } }),
    ]);
    return { today: todayCount, upcoming: upcomingCount, cancelled: cancelledCount };
}

module.exports = {
    upsertCustomer,
    createBooking,
    bookingPayload,
    cancelBooking,
    findBooking,
    listBookings,
    countsByScope,
    serialize,
};
