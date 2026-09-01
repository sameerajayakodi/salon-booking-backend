const logger = require("../log/logger");
const { config } = require("../config/env");

const recentMessageIds = [];
const RECENT_LIMIT = 500;

function isDuplicate(messageId) {
    if (!messageId) return false;
    if (recentMessageIds.includes(messageId)) {
        logger.warn("Duplicate WhatsApp delivery ignored", { event: "whatsapp.duplicate", messageId });
        return true;
    }
    recentMessageIds.push(messageId);
    if (recentMessageIds.length > RECENT_LIMIT) recentMessageIds.shift();
    return false;
}

function isConfigured() {
    return Boolean(config.whatsapp.phoneNumberId && config.whatsapp.accessToken);
}

function extractMessages(payload) {
    const messages = [];
    const entries = payload?.entry || [];

    for (const entry of entries) {
        for (const change of entry.changes || []) {
            for (const message of change.value?.messages || []) {
                if (message.type !== "text") continue;
                messages.push({
                    id: message.id,
                    phone: message.from,
                    text: message.text?.body || "",
                    profileName: change.value?.contacts?.[0]?.profile?.name || null,
                });
            }
        }
    }

    return messages;
}

async function sendText(phone, body) {
    if (!isConfigured()) {
        console.log(`[whatsapp] not configured, would send to ${phone}:\n${body}`);
        return { skipped: true };
    }

    const url = `https://graph.facebook.com/${config.whatsapp.apiVersion}/${config.whatsapp.phoneNumberId}/messages`;
    const startedAt = Date.now();

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${config.whatsapp.accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: phone,
                type: "text",
                text: { preview_url: false, body },
            }),
        });

        const payload = await response.json();

        if (!response.ok) {
            logger.error("WhatsApp send failed", {
                event: "whatsapp.error",
                phone,
                status: response.status,
                detail: JSON.stringify(payload).slice(0, 400),
            });
            return { sent: false, error: payload };
        }

        logger.info("WhatsApp message sent", {
            event: "whatsapp.send",
            phone,
            messageId: payload?.messages?.[0]?.id || null,
            durationMs: Date.now() - startedAt,
        });

        return { sent: true, id: payload?.messages?.[0]?.id || null };
    } catch (err) {
        logger.error("WhatsApp send error", { event: "whatsapp.error", phone, reason: err.message });
        return { sent: false, error: err.message };
    }
}

function verifyChallenge(query) {
    const mode = query["hub.mode"];
    const token = query["hub.verify_token"];
    const challenge = query["hub.challenge"];

    if (mode === "subscribe" && token && token === config.whatsapp.verifyToken) {
        return challenge;
    }

    return null;
}

module.exports = {
    isConfigured,
    isDuplicate,
    extractMessages,
    sendText,
    verifyChallenge,
};
