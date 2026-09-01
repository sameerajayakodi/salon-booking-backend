const router = require("express").Router();

router.use("/simulate", require("./simulate"));

module.exports = router;
