const router = require("express").Router();
const { services } = require("../../controllers/serviceController");
const { requireAuth } = require("../../middleware/auth");

router.get("/", requireAuth, services.list);

module.exports = router;
