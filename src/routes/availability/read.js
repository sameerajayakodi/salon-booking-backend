const router = require("express").Router();
const { availability } = require("../../controllers/serviceController");
const { requireAuth } = require("../../middleware/auth");
const { validate } = require("../../middleware/validate");
const { availabilityQuerySchema } = require("../../validation/schemas");

router.get("/", requireAuth, validate({ query: availabilityQuerySchema }), availability.read);

module.exports = router;
