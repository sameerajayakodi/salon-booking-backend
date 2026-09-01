const router = require("express").Router();
const { webhook } = require("../../controllers/chatController");
const { isValidSignature } = require("../../utils/webhookSignature");

router.get("/webhook", webhook.verify);

router.post("/webhook", (req, res, next) => {
    if (!isValidSignature(req)) return res.sendStatus(401);
    return webhook.receive(req, res, next);
});

module.exports = router;
