const router = require("express").Router();
const { auth } = require("../../controllers/authController");
const { authLimiter } = require("../../middleware/rateLimiters");
const { validate } = require("../../middleware/validate");
const { loginSchema, refreshSchema } = require("../../validation/schemas");

router.post("/login", authLimiter, validate({ body: loginSchema }), auth.login);
router.post("/refresh", validate({ body: refreshSchema }), auth.refresh);

module.exports = router;
