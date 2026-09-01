const logger = require("./src/log/logger");
const app = require("./src/app");
const { config } = require("./src/config/env");
const { sequelize } = require("./src/config/db");

async function start() {
    try {
        await sequelize.authenticate();
        logger.info("Database connected", {
            event: "startup.db",
            database: config.db.name,
            host: config.db.host,
            port: config.db.port,
        });
    } catch (err) {
        logger.error("Database connection failed", { event: "startup.db.error", message: err.message });
        process.exit(1);
    }

    app.listen(config.port, () => {
        logger.info("Server listening", {
            event: "startup.ready",
            env: config.nodeEnv,
            port: config.port,
            logDir: logger.logDir,
            ai: Boolean(config.gemini.apiKey),
            whatsapp: Boolean(config.whatsapp.phoneNumberId && config.whatsapp.accessToken),
        });
    });
}

start();
