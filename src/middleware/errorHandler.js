const logger = require("../log/logger");
const { custom_error } = require("../config/response");

function notFound(req, res) {
    const customError = Object.assign({}, custom_error);
    customError.comment = `Route not found: ${req.method} ${req.originalUrl}`;
    customError.errCode = 404;
    customError.data = { code: "route_not_found" };
    return res.status(404).json(customError);
}

function errorHandler(err, req, res, next) {
    const customError = Object.assign({}, custom_error);

    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        customError.comment = "Bad Request";
        customError.errCode = 400;
        return res.status(400).json(customError);
    }

    if (err.status && err.code) {
        logger.warn("Handled application error", {
            event: "error.handled",
            requestId: req.id,
            code: err.code,
            status: err.status,
            message: err.message,
        });
        customError.comment = err.message;
        customError.errCode = err.status;
        customError.data = { code: err.code, ...(err.details || {}) };
        return res.status(err.status).json(customError);
    }

    logger.error("Unhandled error", {
        event: "error.unhandled",
        requestId: req.id,
        url: req.originalUrl,
        message: err.message,
        stack: err.stack,
    });
    return res.status(customError.errCode).json(customError);
}

function appError(status, code, message, details) {
    const err = new Error(message);
    err.status = status;
    err.code = code;
    err.details = details;
    return err;
}

module.exports = { notFound, errorHandler, appError };
