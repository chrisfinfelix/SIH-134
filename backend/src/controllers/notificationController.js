const Notification = require("../models/Notification");
const Institute = require("../models/Institute");
const Course = require("../models/Course");

const AUTO_ALERT_FLAGS = ["needs update", "critical"];

// Called from courseController whenever a course's gap flag is read, so an
// institute is alerted the first time (and only once per unresolved flag).
const ensureAutoGapAlert = async (course, flag) => {
  try {
    if (!course?.instituteId || !flag) return;
    if (!AUTO_ALERT_FLAGS.includes(flag.toLowerCase())) return;

    const existing = await Notification.findOne({
      courseId: course._id,
      type: "auto_gap_alert",
      read: false,
    });
    if (existing) return;

    await Notification.create({
      instituteId: course.instituteId,
      courseId: course._id,
      type: "auto_gap_alert",
      message: `Course "${course.courseName}" is flagged "${flag}" based on current market demand. Please review and update its curriculum.`,
    });
  } catch (error) {
    // Non-critical: never block course reads because of a notification hiccup
    console.warn(`Failed to create auto gap alert: ${error.message}`);
  }
};

// POST /api/notifications (admin only) — manual curriculum-update message
const sendNotification = async (req, res, next) => {
  try {
    const { instituteId, message, courseId } = req.body;

    if (!instituteId || !message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "instituteId and a non-empty message are required",
      });
    }

    const institute = await Institute.findById(instituteId);
    if (!institute) {
      return res.status(404).json({ success: false, message: "Institute not found" });
    }

    if (courseId) {
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ success: false, message: "Course not found" });
      }
    }

    const notification = await Notification.create({
      instituteId,
      courseId: courseId || null,
      message: message.trim(),
      type: "manual",
      sentBy: req.user.userId,
    });

    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

// GET /api/notifications/institute/:instituteId
const getInstituteNotifications = async (req, res, next) => {
  try {
    const { instituteId } = req.params;

    if (req.user.role === "institute") {
      const institute = await Institute.findOne({ userId: req.user.userId });
      if (!institute || String(institute._id) !== String(instituteId)) {
        return res.status(403).json({ success: false, message: "Not authorized to view these notifications" });
      }
    }

    const notifications = await Notification.find({ instituteId })
      .populate("courseId", "courseName")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/notifications/:id/read
const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    if (req.user.role === "institute") {
      const institute = await Institute.findOne({ userId: req.user.userId });
      if (!institute || String(institute._id) !== String(notification.instituteId)) {
        return res.status(403).json({ success: false, message: "Not authorized to update this notification" });
      }
    }

    notification.read = true;
    await notification.save();

    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  ensureAutoGapAlert,
  sendNotification,
  getInstituteNotifications,
  markNotificationRead,
};
