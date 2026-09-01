const router = require("express").Router();

router.use("/read", require("./read"));

module.exports = router;
