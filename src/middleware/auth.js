const jwt = require("jsonwebtoken");
const { config } = require("../config/env");
const { custom_error } = require("../config/response");
const { AdminUser } = require("../models");

function deny(res, comment) {
    const customError = Object.assign({}, custom_error);
    customError.comment = comment;
    customError.errCode = 401;
    customError.data = { code: "unauthorized" };
    return res.status(401).json(customError);
}

async function requireAuth(req, res, next) {
    const header = req.get("Authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return deny(res, "Authentication required");

    try {
        const payload = jwt.verify(token, config.jwt.accessSecret);
        const user = await AdminUser.findByPk(payload.sub);
        if (!user || !user.isActive) return deny(res, "Account is no longer active");
        req.user = user;
        next();
    } catch {
        return deny(res, "Session expired, please sign in again");
    }
}

module.exports = { requireAuth };
