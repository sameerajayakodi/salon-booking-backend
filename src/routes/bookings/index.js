const router = require("express").Router();

router.use("/read", require("./read"));
router.use("/create", require("./create"));
router.use("/cancel", require("./cancel"));

module.exports = router;
