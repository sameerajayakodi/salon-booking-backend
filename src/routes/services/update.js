const router = require("express").Router();
const { services } = require("../../controllers/serviceController");
const { requireAuth } = require("../../middleware/auth");
const { validate } = require("../../middleware/validate");
const { idParamSchema, updateServiceSchema } = require("../../validation/schemas");

router.patch(
    "/:id",
    requireAuth,
    validate({ params: idParamSchema, body: updateServiceSchema }),
    services.update,
);

module.exports = router;
