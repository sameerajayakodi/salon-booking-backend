const crypto = require("crypto");
const { config } = require("../config/env");

function captureRawBody(req, res, buf) {
    if (req.originalUrl.startsWith("/public/whatsapp")) {
        req.rawBody = buf;
    }
}

function isValidSignature(req) {
    if (!config.whatsapp.appSecret) return true;
    const header = req.get("X-Hub-Signature-256");
    if (!header || !req.rawBody) return false;

    const expected = "sha256=" + crypto
        .createHmac("sha256", config.whatsapp.appSecret)
        .update(req.rawBody)
        .digest("hex");

    const a = Buffer.from(header);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { captureRawBody, isValidSignature };
