const { Sequelize } = require("sequelize");
const logger = require("../log/logger");
const { config } = require("./env");

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
    host: config.db.host,
    port: config.db.port,
    dialect: "mysql",
    logging: config.logSql ? (msg, ms) => logger.debug(msg.replace(/^Executing \([^)]*\): /, ""), { event: "db.query", durationMs: typeof ms === "number" ? ms : undefined }) : false,
    define: {
        underscored: true,
        freezeTableName: true,
        timestamps: true,
    },
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    timezone: "+05:30",
});

module.exports = { sequelize, Sequelize };
