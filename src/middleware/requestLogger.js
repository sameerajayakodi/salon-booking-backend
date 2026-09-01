const { randomUUID } = require("crypto");
const logger = require("../log/logger");

const SENSITIVE_KEYS = [
    "password", "currentpassword", "newpassword", "passwordhash",
    "token", "accesstoken", "refreshtoken", "verifytoken", "apikey",
    "authorization", "secret", "key", "appsecret",
];

const QUIET_PREFIXES = ["/health", "/api/logs"];

function sanitize(value, depth = 0) {
    if (depth > 6 || !value || typeof value !== "object") return value;
    if (Array.isArray(value)) return value.map((v) => sanitize(v, depth + 1));

    const out = {};
    for (const [key, val] of Object.entries(value)) {
        out[key] = SENSITIVE_KEYS.includes(key.toLowerCase())
            ? "***REDACTED***"
            : sanitize(val, depth + 1);
    }
    return out;
}

function requestLogger(req, res, next) {
    req.id = req.headers["x-request-id"] || randomUUID();
    res.setHeader("X-Request-Id", req.id);

    if (QUIET_PREFIXES.some((prefix) => req.path.startsWith(prefix))) return next();

    const startTime = Date.now();

    logger.debug("Incoming request", {
        event: "http.request",
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        body: sanitize(req.body),
        query: sanitize(req.query),
    });

    const originalJson = res.json;
    res.json = function captureBody(data) {
        res.locals.responseBody = data;
        return originalJson.call(this, data);
    };

    res.on("finish", () => {
        const meta = {
            event: "http.response",
            requestId: req.id,
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            durationMs: Date.now() - startTime,
            userId: req.user ? String(req.user.id) : undefined,
            comment: res.locals.responseBody?.comment,
        };

        if (res.statusCode >= 500) logger.error("Request failed", meta);
        else if (res.statusCode >= 400) logger.warn("Request returned error", meta);
        else logger.info("Request succeeded", meta);
    });

    next();
}

module.exports = { requestLogger, sanitize };
