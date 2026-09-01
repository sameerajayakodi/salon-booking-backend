const path = require("path");
const { EventEmitter } = require("events");
const winston = require("winston");
require("winston-daily-rotate-file");
const Transport = require("winston-transport");

const LOG_DIR = path.isAbsolute(process.env.LOG_PATH || "")
    ? process.env.LOG_PATH
    : path.join(process.cwd(), process.env.LOG_PATH || "logs");

const SERVICE_NAME = process.env.SERVICE_NAME || "ADEONA_SALON_SERVICE";
const LOG_LEVEL = process.env.LOG_LEVEL || "info";
const BUFFER_SIZE = Number(process.env.LOG_BUFFER_SIZE || 500);

const bus = new EventEmitter();
bus.setMaxListeners(0);

const buffer = [];
let sequence = 0;

class LiveTransport extends Transport {
    log(info, callback) {
        sequence += 1;

        const entry = {
            seq: sequence,
            timestamp: info.timestamp,
            level: info.level,
            message: info.message,
            ...Object.fromEntries(
                Object.entries(info).filter(
                    ([k]) => !["timestamp", "level", "message", "service", Symbol.for("level"), Symbol.for("message")].includes(k),
                ),
            ),
        };

        buffer.push(entry);
        if (buffer.length > BUFFER_SIZE) buffer.shift();

        bus.emit("log", entry);
        callback();
    }
}

const jsonLogFormat = winston.format.printf(
    ({ level, message, timestamp, ...meta }) => JSON.stringify({
        timestamp,
        level: level.toUpperCase(),
        service: SERVICE_NAME,
        message,
        ...meta,
    }),
);

const logger = winston.createLogger({
    level: LOG_LEVEL,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        jsonLogFormat,
    ),
    defaultMeta: { service: SERVICE_NAME },
    transports: [
        new winston.transports.DailyRotateFile({
            dirname: LOG_DIR,
            filename: "%DATE%.log",
            datePattern: "YYYY-MM-DD",
            zippedArchive: true,
            maxSize: "20m",
            maxFiles: "14d",
        }),
        new winston.transports.DailyRotateFile({
            dirname: LOG_DIR,
            filename: "%DATE%.error.log",
            datePattern: "YYYY-MM-DD",
            level: "error",
            zippedArchive: true,
            maxSize: "20m",
            maxFiles: "30d",
        }),
        new LiveTransport({ level: "debug" }),
    ],
});

if (process.env.NODE_ENV !== "production") {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ level, message, timestamp, event, requestId, statusCode, durationMs, ...meta }) => {
                const head = event ? `${event} ` : "";
                const tail = [
                    statusCode ? `${statusCode}` : null,
                    durationMs !== undefined ? `${durationMs}ms` : null,
                    requestId ? String(requestId).slice(0, 8) : null,
                ].filter(Boolean).join(" ");

                const extras = Object.entries(meta)
                    .filter(([k, v]) => k !== "service" && k !== "stack" && v !== undefined && typeof v !== "object")
                    .map(([k, v]) => `${k}=${v}`)
                    .join(" ");

                return `[${timestamp}] ${level}: ${head}${message}${tail ? ` (${tail})` : ""}${extras ? ` · ${extras}` : ""}`;
            }),
        ),
    }));
}

logger.recent = function recent({ level, event, search, limit = 200 } = {}) {
    let rows = buffer;

    if (level) rows = rows.filter((r) => r.level === level);
    if (event) rows = rows.filter((r) => r.event === event);
    if (search) {
        const needle = String(search).toLowerCase();
        rows = rows.filter((r) => JSON.stringify(r).toLowerCase().includes(needle));
    }

    return rows.slice(-limit);
};

logger.subscribe = function subscribe(handler) {
    bus.on("log", handler);
    return () => bus.off("log", handler);
};

logger.logDir = LOG_DIR;
logger.serviceName = SERVICE_NAME;

module.exports = logger;
