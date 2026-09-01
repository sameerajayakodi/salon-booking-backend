const logger = require("../log/logger");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { config } = require("../config/env");
const { AdminUser } = require("../models");
const { appError } = require("../middleware/errorHandler");

function issueTokens(user) {
    const accessToken = jwt.sign({ sub: user.id, email: user.email }, config.jwt.accessSecret, {
        expiresIn: config.jwt.accessTtl,
    });

    const refreshToken = jwt.sign({ sub: user.id, type: "refresh" }, config.jwt.refreshSecret, {
        expiresIn: `${config.jwt.refreshTtlDays}d`,
    });

    return { accessToken, refreshToken };
}

async function hashPassword(plain) {
    return bcrypt.hash(plain, 10);
}

async function login(email, password) {
    const user = await AdminUser.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user || !user.isActive) {
        logger.warn("Sign in rejected", { event: "auth.failed", email, reason: "unknown-or-inactive" });
        throw appError(401, "invalid_credentials", "Email or password is incorrect");
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
        logger.warn("Sign in rejected", { event: "auth.failed", email, reason: "bad-password" });
        throw appError(401, "invalid_credentials", "Email or password is incorrect");
    }

    await user.update({ lastLoginAt: new Date() });
    logger.info("Administrator signed in", { event: "auth.login", userId: user.id, email: user.email });

    return { user: user.toSafeJSON(), ...issueTokens(user) };
}

async function refresh(refreshToken) {
    let payload;
    try {
        payload = jwt.verify(refreshToken, config.jwt.refreshSecret);
    } catch {
        throw appError(401, "invalid_refresh_token", "Session expired, please sign in again");
    }

    const user = await AdminUser.findByPk(payload.sub);
    if (!user || !user.isActive) {
        throw appError(401, "invalid_refresh_token", "Session expired, please sign in again");
    }

    return { user: user.toSafeJSON(), ...issueTokens(user) };
}

module.exports = { login, refresh, hashPassword, issueTokens };
