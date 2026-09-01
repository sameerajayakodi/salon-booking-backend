const router = require("express").Router();

router.use("/whatsapp", require("./whatsapp"));

module.exports = router;
