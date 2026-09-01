const router = require("express").Router();
const { bookings } = require("../../controllers/bookingController");
const { requireAuth } = require("../../middleware/auth");
const { validate } = require("../../middleware/validate");
const { createBookingSchema } = require("../../validation/schemas");

router.post("/", requireAuth, validate({ body: createBookingSchema }), bookings.create);

module.exports = router;
