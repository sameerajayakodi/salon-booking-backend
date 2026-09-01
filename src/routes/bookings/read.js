const router = require("express").Router();
const { bookings } = require("../../controllers/bookingController");
const { requireAuth } = require("../../middleware/auth");
const { validate } = require("../../middleware/validate");
const { idParamSchema, listBookingsSchema } = require("../../validation/schemas");

router.get("/counts", requireAuth, bookings.counts);
router.get("/:id", requireAuth, validate({ params: idParamSchema }), bookings.detail);
router.get("/", requireAuth, validate({ query: listBookingsSchema }), bookings.list);

module.exports = router;
