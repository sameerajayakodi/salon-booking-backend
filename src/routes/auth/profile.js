const router = require("express").Router();
const { auth } = require("../../controllers/authController");
const { requireAuth } = require("../../middleware/auth");

router.get("/me", requireAuth, auth.me);

module.exports = router;
