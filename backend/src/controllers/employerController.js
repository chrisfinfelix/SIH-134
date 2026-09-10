const CourseValidation = require("../models/CourseValidation");
const EmployerDemandSignal = require("../models/EmployerDemandSignal");
const Course = require("../models/Course");

// POST /api/employer/validate
const validateCourse = async (req, res, next) => {
  try {
    const { courseId, status, comment, validatedSkills } = req.body;

    if (!courseId || !status) {
      return res.status(400).json({ success: false, message: "courseId and status are required" });
    }

    const allowedStatuses = ["approved", "rejected", "needs_update"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${allowedStatuses.join(", ")}`,
      });
    }

    // Verify the course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const validation = await CourseValidation.create({
      employerId: req.user.userId,
      courseId,
      status,
      comment: comment || "",
      validatedSkills: validatedSkills || [],
    });

    res.status(201).json({ success: true, data: validation });
  } catch (error) {
    next(error);
  }
};

// GET /api/employer/validations
const getValidations = async (req, res, next) => {
  try {
    const validations = await CourseValidation.find({ employerId: req.user.userId })
      .populate("courseId", "courseName district sector")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: validations });
  } catch (error) {
    next(error);
  }
};

// POST /api/employer/demand-signal
const createDemandSignal = async (req, res, next) => {
  try {
    const { company, sector, district, skills, targetRoles, hiringCount, notes } = req.body;

    const signal = await EmployerDemandSignal.create({
      employerId: req.user.userId,
      company: company || "",
      sector: sector || "",
      district: district || "",
      skills: skills || [],
      targetRoles: targetRoles || [],
      hiringCount: hiringCount || 0,
      notes: notes || "",
    });

    res.status(201).json({ success: true, data: signal });
  } catch (error) {
    next(error);
  }
};

// GET /api/employer/demand-signals
const getDemandSignals = async (req, res, next) => {
  try {
    const signals = await EmployerDemandSignal.find({ employerId: req.user.userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: signals });
  } catch (error) {
    next(error);
  }
};

module.exports = { validateCourse, getValidations, createDemandSignal, getDemandSignals };
