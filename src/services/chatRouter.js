const logger = require("../log/logger");
const { config } = require("../config/env");
const agentService = require("./agentService");
const conversationService = require("./conversationService");

function normalise(result, engine) {
    return {
        reply: result.reply,
        engine,
        lang: result.lang,
        key: result.key,
        draft: result.draft,
        nlu: result.nlu,
        corrections: result.corrections,
        answered: result.answered,
        toolCalls: result.toolCalls,
        modelCalls: result.modelCalls,
        bookingId: result.bookingId,
        booking: result.booking,
    };
}

async function handle(phone, text) {
    if (config.chat.engine !== "agent") {
        return normalise(await conversationService.handle(phone, text), "rules");
    }

    try {
        return normalise(await agentService.converse(phone, text), "agent");
    } catch (err) {
        if (!config.chat.agentFallback) throw err;

        logger.error("Agent failed, falling back to the deterministic engine", {
            event: "chat.fallback",
            phone,
            status: err.status,
            reason: err.code || err.message,
            detail: err.detail,
        });

        const result = await conversationService.handle(phone, text);
        return normalise(result, "rules-fallback");
    }
}

async function reset(phone) {
    await agentService.resetConversation(phone);
}

module.exports = { handle, reset };
