const router = require("express").Router();
const { chat } = require("../../controllers/chatController");
const { requireAuth } = require("../../middleware/auth");
const { validate } = require("../../middleware/validate");
const { simulateMessageSchema } = require("../../validation/schemas");

router.post("/", requireAuth, validate({ body: simulateMessageSchema }), chat.simulate);

module.exports = router;
