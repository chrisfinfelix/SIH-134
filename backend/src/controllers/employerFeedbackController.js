const EmployerFeedback = require("../models/EmployerFeedback");
const Institute = require("../models/Institute");

// GET /api/employer-feedback/institute/:instituteId
const getInstituteFeedback = async (req, res, next) => {
  try {
    const { instituteId } = req.params;

    if (req.user.role === "institute") {
      const institute = await Institute.findOne({ userId: req.user.userId });
      if (!institute || String(institute._id) !== String(instituteId)) {
        return res.status(403).json({ success: false, message: "Not authorized to view this feedback" });
      }
    }

    const feedback = await EmployerFeedback.find({ instituteId })
      .populate("courseId", "courseName")
      .populate("employerId", "name organization")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: feedback,
      unreadCount: feedback.filter((f) => !f.read).length,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/employer-feedback/:id/read
const markFeedbackRead = async (req, res, next) => {
  try {
    const feedback = await EmployerFeedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ success: false, message: "Feedback not found" });
    }

    if (req.user.role === "institute") {
      const institute = await Institute.findOne({ userId: req.user.userId });
      if (!institute || String(institute._id) !== String(feedback.instituteId)) {
        return res.status(403).json({ success: false, message: "Not authorized to update this feedback" });
      }
    }

    feedback.read = true;
    await feedback.save();

    res.json({ success: true, data: feedback });
  } catch (error) {
    next(error);
  }
};

module.exports = { getInstituteFeedback, markFeedbackRead };
