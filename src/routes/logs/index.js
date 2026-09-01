const router = require("express").Router();

router.use("/read", require("./read"));
router.use("/stream", require("./stream"));

module.exports = router;
