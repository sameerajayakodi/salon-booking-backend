const router = require("express").Router();
const { bookings } = require("../../controllers/bookingController");
const { requireAuth } = require("../../middleware/auth");
const { validate } = require("../../middleware/validate");
const { idParamSchema } = require("../../validation/schemas");

router.post("/:id", requireAuth, validate({ params: idParamSchema }), bookings.cancel);

module.exports = router;
