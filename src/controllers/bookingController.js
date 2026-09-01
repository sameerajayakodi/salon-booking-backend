const { success } = require("../config/response");
const { asyncHandler } = require("../utils/asyncHandler");
const { appError } = require("../middleware/errorHandler");
const { BOOKING_SOURCE } = require("../constants/booking");
const bookingService = require("../services/bookingService");
const whatsappService = require("../services/whatsappService");
const { t } = require("../services/messageService");
const { suggestAlternatives } = require("../services/availabilityService");
const { formatDateLong, minutesToLabel, formatTimeList } = require("../utils/time");

const bookings = {
    list: asyncHandler(async (req, res) => {
        const result = await bookingService.listBookings(req.query);
        return success(res, result);
    }),

    counts: asyncHandler(async (req, res) => {
        const counts = await bookingService.countsByScope();
        return success(res, counts);
    }),

    detail: asyncHandler(async (req, res) => {
        const booking = await bookingService.findBooking(req.params.id);
        return success(res, bookingService.serialize(booking));
    }),

    create: asyncHandler(async (req, res) => {
        const customer = await bookingService.upsertCustomer(req.body.phone, {
            name: req.body.name,
            lang: req.body.lang,
        });

        const booking = await bookingService.createBooking({
            customerId: customer.id,
            serviceId: req.body.serviceId,
            date: req.body.date,
            startMin: req.body.startMin,
            source: req.body.source || BOOKING_SOURCE.MANUAL,
        });

        if (!booking) {
            const alternatives = await suggestAlternatives(
                req.body.serviceId,
                req.body.date,
                req.body.startMin,
            );

            throw appError(409, "slot_taken", "That time is no longer available", {
                alternatives: alternatives.map((s) => ({
                    startMin: s.startMin,
                    label: minutesToLabel(s.startMin),
                })),
            });
        }

        const full = await bookingService.findBooking(booking.id);
        return success(res, bookingService.serialize(full), "Booking created", 201);
    }),

    cancel: asyncHandler(async (req, res) => {
        const booking = await bookingService.cancelBooking(req.params.id);

        const notice = t("cancelled", booking.customer.lang, {
            service: booking.service.name,
            date: formatDateLong(booking.slotDate),
            time: minutesToLabel(booking.startMin),
        });

        const delivery = await whatsappService.sendText(booking.customer.phone, notice);

        return success(
            res,
            { booking: bookingService.serialize(booking), notice, delivery },
            "Booking cancelled",
        );
    }),
};

module.exports = { bookings, formatTimeList };
