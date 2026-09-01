const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { config } = require("./config/env");
const { success } = require("./config/response");
const { generalLimiter } = require("./middleware/rateLimiters");
const { requestLogger } = require("./middleware/requestLogger");
const { captureRawBody } = require("./utils/webhookSignature");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

if (config.trustProxy !== false) app.set("trust proxy", config.trustProxy);

app.use(helmet());
app.use(cors({
    origin: config.corsOrigin,
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
    exposedHeaders: ["X-Request-Id"],
}));
app.use(express.json({ limit: "1mb", verify: captureRawBody }));
app.use(requestLogger);

app.get("/health", (req, res) => success(res, {
    up: true,
    salon: config.salon.name,
    timezone: config.salon.timezone,
    whatsapp: Boolean(config.whatsapp.phoneNumberId && config.whatsapp.accessToken),
    ai: Boolean(config.gemini.apiKey),
}));

app.use("/public", require("./routes/public"));

app.use(generalLimiter);
app.use("/api/auth", require("./routes/auth"));
app.use("/api/services", require("./routes/services"));
app.use("/api/availability", require("./routes/availability"));
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/chat", require("./routes/chat"));
app.use("/api/logs", require("./routes/logs"));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
