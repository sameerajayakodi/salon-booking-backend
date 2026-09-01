const { custom_error } = require("../config/response");

function validate(schemas) {
    return (req, res, next) => {
        const customError = Object.assign({}, custom_error);
        for (const key of ["body", "query", "params"]) {
            if (!schemas[key]) continue;
            const result = schemas[key].safeParse(req[key]);
            if (!result.success) {
                const detail = result.error.issues
                    .map((i) => `${i.path.join(".")}: ${i.message}`)
                    .join("; ");
                customError.comment = detail;
                customError.errCode = 400;
                customError.data = { code: "validation_error" };
                return res.status(400).json(customError);
            }
            req[key] = result.data;
        }
        next();
    };
}

module.exports = { validate };
