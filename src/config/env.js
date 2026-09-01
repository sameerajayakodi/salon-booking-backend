require("dotenv").config();

const required = ["DATABASE_URL", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"];

const requiredInProduction = ["CORS_ORIGIN", "GEMINI_API_KEY", "WHATSAPP_ACCESS_TOKEN"];

function validateEnv() {
    const missing = required.filter((k) => !process.env[k]);
    if (missing.length) {
        throw new Error(`Missing required env vars: ${missing.join(", ")}`);
    }

    const isProduction = process.env.NODE_ENV === "production";
    if (isProduction) {
        const missingProd = requiredInProduction.filter((k) => !process.env[k]);
        if (missingProd.length) {
            throw new Error(
                `Missing required env vars in production: ${missingProd.join(", ")}. ` +
                "Refusing to start with insecure defaults.",
            );
        }
        if (process.env.CORS_ORIGIN.trim() === "*") {
            throw new Error(
                'CORS_ORIGIN must not be "*" in production — set it to your dashboard origin.',
            );
        }
    }

    return {
        nodeEnv: process.env.NODE_ENV || "development",
        port: Number(process.env.PORT || 5000),

        db: {
            url: process.env.DATABASE_URL,
            host: process.env.DB_HOST || "localhost",
            port: Number(process.env.DB_PORT || 3306),
            name: process.env.DB_NAME || "salon_booking",
            user: process.env.DB_USER || "root",
            password: process.env.DB_PASSWORD || "",
        },

        jwt: {
            accessSecret: process.env.JWT_ACCESS_SECRET,
            refreshSecret: process.env.JWT_REFRESH_SECRET,
            accessTtl: process.env.JWT_ACCESS_TTL || "15m",
            refreshTtlDays: Number(process.env.JWT_REFRESH_TTL_DAYS || 30),
        },

        corsOrigin: process.env.CORS_ORIGIN || "*",
        logSql: process.env.LOG_SQL === "true",
        appUrl: process.env.APP_URL || "http://localhost:5173",
        trustProxy: process.env.TRUST_PROXY_HOPS ? Number(process.env.TRUST_PROXY_HOPS) : false,

        salon: {
            name: process.env.SALON_NAME || "Salon",
            timezone: process.env.SALON_TIMEZONE || "Asia/Colombo",
            alternativeSlotCount: Number(process.env.ALTERNATIVE_SLOT_COUNT || 3),
            bookingHorizonDays: Number(process.env.BOOKING_HORIZON_DAYS || 60),
        },

        gemini: {
            apiKey: process.env.GEMINI_API_KEY || null,
            model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
            timeoutMs: Number(process.env.GEMINI_TIMEOUT_MS || 8000),
            thinkingLevel: process.env.GEMINI_THINKING_LEVEL || "low",
        },

        chat: {
            engine: process.env.CHAT_ENGINE || "agent",
            agentFallback: process.env.CHAT_AGENT_FALLBACK !== "false",
        },

        whatsapp: {
            apiVersion: process.env.WHATSAPP_API_VERSION || "v21.0",
            phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || null,
            accessToken: process.env.WHATSAPP_ACCESS_TOKEN || null,
            verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || null,
            appSecret: process.env.WHATSAPP_APP_SECRET || null,
        },

        seed: {
            adminEmail: process.env.SEED_ADMIN_EMAIL || "admin@salon.lk",
            adminPassword: process.env.SEED_ADMIN_PASSWORD || "Salon@123",
            adminName: process.env.SEED_ADMIN_NAME || "Salon Administrator",
        },
    };
}

module.exports = { config: validateEnv() };
