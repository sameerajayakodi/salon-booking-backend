const custom_error = Object.freeze({
    status: "failed",
    comment: "error occurred",
    data: null,
    errCode: 500,
});

const custom_success = Object.freeze({
    status: "success",
    comment: "success",
    data: null,
    sucCode: 200,
});

function success(res, data = null, comment = "success", code = 200) {
    const customSuccess = Object.assign({}, custom_success);
    customSuccess.comment = comment;
    customSuccess.data = data;
    customSuccess.sucCode = code;
    return res.status(code).json(customSuccess);
}

module.exports = { custom_error, custom_success, success };
