const { success } = require("../config/response");
const { asyncHandler } = require("../utils/asyncHandler");
const chatRouter = require("../services/chatRouter");
const whatsappService = require("../services/whatsappService");

const chat = {
    simulate: asyncHandler(async (req, res) => {
        const result = await chatRouter.handle(req.body.phone, req.body.text);
        return success(res, result);
    }),
};

const webhook = {
    verify: (req, res) => {
        const challenge = whatsappService.verifyChallenge(req.query);
        if (challenge) return res.status(200).send(challenge);
        return res.sendStatus(403);
    },

    receive: (req, res) => {
        res.sendStatus(200);

        const messages = whatsappService.extractMessages(req.body);

        for (const message of messages) {
            if (whatsappService.isDuplicate(message.id)) continue;

            chatRouter
                .handle(message.phone, message.text)
                .then((result) => whatsappService.sendText(message.phone, result.reply))
                .catch((err) => console.error("[webhook] handling failed", err));
        }
    },
};

module.exports = { chat, webhook };
