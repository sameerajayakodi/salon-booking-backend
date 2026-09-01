const router = require("express").Router();
const { services } = require("../../controllers/serviceController");
const { requireAuth } = require("../../middleware/auth");
const { validate } = require("../../middleware/validate");
const { createServiceSchema } = require("../../validation/schemas");

router.post("/", requireAuth, validate({ body: createServiceSchema }), services.create);

module.exports = router;
