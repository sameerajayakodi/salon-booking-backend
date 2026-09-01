const { success } = require("../config/response");
const { asyncHandler } = require("../utils/asyncHandler");
const authService = require("../services/authService");

const auth = {
    login: asyncHandler(async (req, res) => {
        const result = await authService.login(req.body.email, req.body.password);
        return success(res, result, "Signed in");
    }),

    refresh: asyncHandler(async (req, res) => {
        const result = await authService.refresh(req.body.refreshToken);
        return success(res, result, "Session refreshed");
    }),

    me: asyncHandler(async (req, res) => {
        return success(res, { user: req.user.toSafeJSON() });
    }),
};

module.exports = { auth };
