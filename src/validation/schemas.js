const { z } = require("zod");
const { LANGUAGES, BOOKING_SOURCE } = require("../constants/booking");

const idParamSchema = z.object({
    id: z.coerce.number().int().positive(),
});

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "must be YYYY-MM-DD");

const minuteOfDay = z.coerce.number().int().min(0).max(1439);

const weeklySchema = z.record(
    z.enum(["0", "1", "2", "3", "4", "5", "6"]),
    z.array(minuteOfDay),
);

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

const refreshSchema = z.object({
    refreshToken: z.string().min(10),
});

const createServiceSchema = z.object({
    name: z.string().trim().min(1).max(120),
    durationMin: z.coerce.number().int().min(5).max(600),
    isActive: z.boolean().optional(),
    aliases: z.array(z.string().trim().min(1)).optional(),
    weekly: weeklySchema.optional(),
});

const updateServiceSchema = z.object({
    name: z.string().trim().min(1).max(120).optional(),
    durationMin: z.coerce.number().int().min(5).max(600).optional(),
    isActive: z.boolean().optional(),
    aliases: z.array(z.string().trim().min(1)).optional(),
    weekly: weeklySchema.optional(),
}).refine((v) => Object.keys(v).length > 0, { message: "no fields to update" });

const availabilityQuerySchema = z.object({
    serviceId: z.coerce.number().int().positive(),
    date: isoDate,
    period: z.enum(["MORNING", "AFTERNOON", "EVENING", "LATE"]).optional(),
});

const listBookingsSchema = z.object({
    scope: z.enum(["today", "upcoming", "all"]).default("today"),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25),
    search: z.string().trim().optional(),
});

const createBookingSchema = z.object({
    name: z.string().trim().min(1).max(120),
    phone: z.string().trim().min(7).max(32),
    serviceId: z.coerce.number().int().positive(),
    date: isoDate,
    startMin: minuteOfDay,
    lang: z.enum(LANGUAGES).optional(),
    source: z.enum([BOOKING_SOURCE.MANUAL, BOOKING_SOURCE.WHATSAPP]).optional(),
});

const simulateMessageSchema = z.object({
    phone: z.string().trim().min(7).max(32),
    text: z.string().trim().min(1).max(1000),
});

module.exports = {
    idParamSchema,
    loginSchema,
    refreshSchema,
    createServiceSchema,
    updateServiceSchema,
    availabilityQuerySchema,
    listBookingsSchema,
    createBookingSchema,
    simulateMessageSchema,
};
