const router = require("express").Router();
const { logs } = require("../../controllers/logController");
const { requireAuth } = require("../../middleware/auth");

router.get("/", requireAuth, logs.stream);

module.exports = router;
