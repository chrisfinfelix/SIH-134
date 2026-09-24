const CourseValidation = require("../models/CourseValidation");
const EmployerDemandSignal = require("../models/EmployerDemandSignal");
const Course = require("../models/Course");
const EmployerFeedback = require("../models/EmployerFeedback");
const Job = require("../models/Job");
const { withExtractedSkills } = require("../services/aiService");

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

    // Route this validation to the owning institute through its own feedback channel
    if (course.instituteId) {
      await EmployerFeedback.create({
        instituteId: course.instituteId,
        courseId: course._id,
        employerId: req.user.userId,
        status,
        comment: comment || "",
        validatedSkills: validatedSkills || [],
      });
    }

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
    const { company, sector, district, state, skills, targetRoles, hiringCount, notes } = req.body;

    const signal = await EmployerDemandSignal.create({
      employerId: req.user.userId,
      company: company || "",
      sector: sector || "",
      district: district || "",
      state: state || "",
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

// POST /api/employer/jobs
const createJobPosting = async (req, res, next) => {
  try {
    const { title, company, district, state, skills, proficiencyLevel, salaryRange, description } = req.body;

    if (!title || !company) {
      return res.status(400).json({ success: false, message: "title and company are required" });
    }

    const job = await Job.create(
      await withExtractedSkills({
        employerId: req.user.userId,
        title,
        company,
        district: district || "",
        state: state || "",
        skills: Array.isArray(skills) ? skills : [],
        proficiencyLevel: proficiencyLevel || "",
        salaryRange: salaryRange || "",
        description: description || "",
        source: "employer_portal",
        postedDate: new Date(),
      })
    );

    res.status(201).json({ success: true, data: job });
  } catch (error) {
    next(error);
  }
};

// GET /api/employer/jobs
const getJobPostings = async (req, res, next) => {
  try {
    const jobs = await Job.find({ employerId: req.user.userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: jobs });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/employer/jobs/:id
const deleteJobPosting = async (req, res, next) => {
  try {
    const job = await Job.findOneAndDelete({ _id: req.params.id, employerId: req.user.userId });
    if (!job) {
      return res.status(404).json({ success: false, message: "Job posting not found" });
    }
    res.json({ success: true, data: job });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateCourse,
  getValidations,
  createDemandSignal,
  getDemandSignals,
  createJobPosting,
  getJobPostings,
  deleteJobPosting,
};
