const { sequelize } = require("../models");
const { resetDemoData } = require("./resetDemo");

async function run() {
    try {
        await sequelize.authenticate();
        console.log("[seed] Connected to database.");
        await resetDemoData();
        console.log("[seed] Seeding completed successfully.");
        process.exit(0);
    } catch (err) {
        console.error("[seed] Failed:", err);
        process.exit(1);
    }
}

run();
