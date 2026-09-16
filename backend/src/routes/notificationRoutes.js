const express = require("express");
const {
  sendNotification,
  getInstituteNotifications,
  markNotificationRead,
} = require("../controllers/notificationController");
const authenticate = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticate);

router.post("/", requireRole("admin"), sendNotification);
router.get("/institute/:instituteId", requireRole("institute", "admin"), getInstituteNotifications);
router.patch("/:id/read", requireRole("institute", "admin"), markNotificationRead);

module.exports = router;
