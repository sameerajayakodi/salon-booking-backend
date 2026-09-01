const router = require("express").Router();

router.use("/", require("./session"));
router.use("/", require("./profile"));

module.exports = router;
