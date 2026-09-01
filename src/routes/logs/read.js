const router = require("express").Router();
const { logs } = require("../../controllers/logController");
const { requireAuth } = require("../../middleware/auth");

router.get("/files", requireAuth, logs.files);
router.get("/files/:name", requireAuth, logs.download);
router.get("/", requireAuth, logs.recent);

module.exports = router;
