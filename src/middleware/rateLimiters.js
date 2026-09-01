const rateLimit = require("express-rate-limit");
const { custom_error } = require("../config/response");

function limitHandler(req, res) {
    const customError = Object.assign({}, custom_error);
    customError.comment = "Too many requests, please slow down";
    customError.errCode = 429;
    customError.data = { code: "rate_limited" };
    return res.status(429).json(customError);
}

const generalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    handler: limitHandler,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    handler: limitHandler,
});

module.exports = { generalLimiter, authLimiter };
