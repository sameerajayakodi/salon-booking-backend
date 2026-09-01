const logger = require("../log/logger");
const { Service } = require("../models");
const { config } = require("../config/env");
const { knowledgeLines } = require("../config/salonKnowledge");
const { listAvailability, suggestAlternatives, nextOpenDates } = require("./availabilityService");
const { upsertCustomer, createBooking, findBooking, bookingPayload } = require("./bookingService");
const {
    todayISO,
    isValidISODate,
    minutesToLabel,
    labelToMinutes,
    formatDateLong,
    formatDateShort,
    daysBetween,
} = require("../utils/time");

const DECLARATIONS = [
    {
        name: "list_services",
        description:
            "List every service the salon currently offers, with how many minutes each one takes. "
            + "Call this when the customer asks what is available or you need the exact service names.",
        parameters: { type: "OBJECT", properties: {}, required: [] },
    },
    {
        name: "check_availability",
        description:
            "Return the real open appointment times for one service on one date. "
            + "You MUST call this before mentioning any time to the customer. Never guess or invent times.",
        parameters: {
            type: "OBJECT",
            properties: {
                service: { type: "STRING", description: "Exact service name, for example Facial" },
                date: { type: "STRING", description: "Date in YYYY-MM-DD format" },
            },
            required: ["service", "date"],
        },
    },
    {
        name: "suggest_dates",
        description:
            "Return the next few dates that have any open slots for a service. "
            + "Use this when the customer has not chosen a date, or the date they asked for is full.",
        parameters: {
            type: "OBJECT",
            properties: {
                service: { type: "STRING", description: "Exact service name" },
                from: { type: "STRING", description: "Optional YYYY-MM-DD date to start searching from" },
            },
            required: ["service"],
        },
    },
    {
        name: "create_booking",
        description:
            "Create the appointment. Only call this after the customer has explicitly confirmed the "
            + "service, date, time and their name. The time must be one you received from check_availability.",
        parameters: {
            type: "OBJECT",
            properties: {
                service: { type: "STRING", description: "Exact service name" },
                date: { type: "STRING", description: "Date in YYYY-MM-DD format" },
                time: { type: "STRING", description: "Time in 12 hour format, for example 3:00 PM" },
                customerName: { type: "STRING", description: "The customer's name" },
            },
            required: ["service", "date", "time", "customerName"],
        },
    },
    {
        name: "get_salon_info",
        description:
            "Look up salon facts: address, parking, opening hours, payment methods, what each service "
            + "involves, aftercare, and policies on cancellation, guests, children and lateness. "
            + "Use this for any general question. Never answer such questions from your own knowledge.",
        parameters: { type: "OBJECT", properties: {}, required: [] },
    },
];

async function activeServices() {
    return Service.findAll({ where: { isActive: true }, order: [["name", "ASC"]] });
}

function resolveService(services, name) {
    if (!name) return null;
    const needle = String(name).trim().toLowerCase();

    const exact = services.find((s) => s.name.toLowerCase() === needle);
    if (exact) return exact;

    const alias = services.find((s) => (s.aliases || []).some((a) => String(a).toLowerCase() === needle));
    if (alias) return alias;

    return services.find((s) => s.name.toLowerCase().includes(needle) || needle.includes(s.name.toLowerCase())) || null;
}

function guardDate(date) {
    if (!isValidISODate(date)) return "That date is not in YYYY-MM-DD format.";
    const offset = daysBetween(todayISO(), date);
    if (offset < 0) return "That date is in the past.";
    if (offset > config.salon.bookingHorizonDays) {
        return "That date is more than " + config.salon.bookingHorizonDays + " days ahead, which is beyond our booking window.";
    }
    return null;
}

const handlers = {
    async list_services() {
        const services = await activeServices();
        return {
            services: services.map((s) => ({ name: s.name, durationMinutes: s.durationMin })),
            today: todayISO(),
            timezone: config.salon.timezone,
        };
    },

    async check_availability({ service, date }) {
        const services = await activeServices();
        const found = resolveService(services, service);
        if (!found) return { error: "No service called " + service + ". Call list_services first." };

        const problem = guardDate(date);
        if (problem) return { error: problem };

        const slots = await listAvailability(found.id, date);
        return {
            service: found.name,
            date,
            dateLabel: formatDateLong(date),
            openTimes: slots.map((s) => minutesToLabel(s.startMin)),
            isFullyBooked: slots.length === 0,
        };
    },

    async suggest_dates({ service, from }) {
        const services = await activeServices();
        const found = resolveService(services, service);
        if (!found) return { error: "No service called " + service + ". Call list_services first." };

        const start = isValidISODate(from) ? from : todayISO();
        const dates = await nextOpenDates(found.id, start, 3, 45, 0);

        return {
            service: found.name,
            dates: dates.map((d) => ({ date: d, label: formatDateShort(d) })),
            noneAvailable: dates.length === 0,
        };
    },

    async create_booking({ service, date, time, customerName }, context) {
        const services = await activeServices();
        const found = resolveService(services, service);
        if (!found) return { error: "No service called " + service + "." };

        const problem = guardDate(date);
        if (problem) return { error: problem };

        const startMin = labelToMinutes(time);
        if (startMin === null) return { error: "Could not read the time " + time + ". Use a format like 3:00 PM." };

        if (!customerName || !String(customerName).trim()) {
            return { error: "A customer name is required before booking." };
        }

        const customer = await upsertCustomer(context.phone, {
            name: String(customerName).trim(),
            lang: context.lang,
        });

        const booking = await createBooking({
            customerId: customer.id,
            serviceId: found.id,
            date,
            startMin,
            source: "WHATSAPP",
        });

        if (!booking) {
            const alternatives = await suggestAlternatives(found.id, date, startMin);
            return {
                booked: false,
                reason: "That time was taken a moment ago.",
                alternatives: alternatives.map((s) => minutesToLabel(s.startMin)),
            };
        }

        const full = await findBooking(booking.id);
        const payload = bookingPayload(full, config.salon.timezone);
        context.booking = payload;

        return {
            booked: true,
            reference: payload.reference,
            service: payload.service.name,
            date: payload.appointment.date,
            dateLabel: payload.appointment.dateLabel,
            time: payload.appointment.startLabel,
            customerName: payload.customer.name,
        };
    },

    async get_salon_info() {
        const services = await activeServices();
        return { facts: knowledgeLines(services) };
    },
};

async function execute(name, args, context) {
    const handler = handlers[name];
    if (!handler) return { error: "Unknown tool " + name };

    const startedAt = Date.now();
    try {
        const result = await handler(args || {}, context);
        logger.info("Agent tool executed", {
            event: "agent.tool",
            tool: name,
            args,
            durationMs: Date.now() - startedAt,
            ok: !result.error,
        });
        return result;
    } catch (err) {
        logger.error("Agent tool failed", {
            event: "agent.tool.error",
            tool: name,
            args,
            message: err.message,
        });
        return { error: "That lookup failed. Apologise briefly and ask the customer to try again." };
    }
}

module.exports = { DECLARATIONS, execute, resolveService, activeServices };
