const Institute = require("../models/Institute");
const Course = require("../models/Course");
const Job = require("../models/Job");
const User = require("../models/User");
const PlacementOutcome = require("../models/PlacementOutcome");
const { escapeRegex } = require("../utils/escapeRegex");
const { withExtractedSkills } = require("../services/aiService");

// Institute users may only act on the institute linked to their own account.
const assertOwnsInstitute = async (req, instituteId) => {
  if (req.user.role !== "institute") return true;
  const own = await Institute.findOne({ userId: req.user.userId }).select("_id");
  return !!own && String(own._id) === String(instituteId);
};

// GET /api/institutes?state=Kerala&district=Kottayam&search=ABC
const getInstitutes = async (req, res, next) => {
  try {
    const { state, district, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (state) {
      filter.state = new RegExp(`^${escapeRegex(state)}$`, "i");
    }
    if (district) {
      filter.district = new RegExp(`^${escapeRegex(district)}$`, "i");
    }
    if (search) {
      filter.$or = [
        { name: new RegExp(escapeRegex(search), "i") },
        { skillsCovered: { $in: [new RegExp(escapeRegex(search), "i")] } },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [institutes, total] = await Promise.all([
      Institute.find(filter)
        .populate("coursesOffered")
        .sort({ name: 1 })
        .skip(skip)
        .limit(limitNum),
      Institute.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: institutes,
      pagination: {
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        limit: limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/institutes/:id
const getInstituteById = async (req, res, next) => {
  try {
    const institute = await Institute.findById(req.params.id).populate("coursesOffered");
    if (!institute) {
      return res.status(404).json({ success: false, message: "Institute not found" });
    }
    res.json({ success: true, data: institute });
  } catch (error) {
    next(error);
  }
};

// POST /api/institutes
const createInstitute = async (req, res, next) => {
  try {
    const {
      name,
      state,
      district,
      address,
      languages,
      totalTrainers,
      numberOfEmployees,
      skillsCovered,
      contactEmail,
      contactPhone,
    } = req.body;

    if (!name || !state || !district) {
      return res.status(400).json({
        success: false,
        message: "Institute name, state, and district are required",
      });
    }

    const institute = await Institute.create({
      name,
      state,
      district,
      address: address || "",
      languages: Array.isArray(languages) ? languages : ["English"],
      totalTrainers: Number(totalTrainers) || 10,
      numberOfEmployees: Number(numberOfEmployees) || 0,
      skillsCovered: Array.isArray(skillsCovered) ? skillsCovered : [],
      contactEmail: contactEmail || req.user?.email || "",
      contactPhone: contactPhone || "",
      userId: req.user?.userId || null,
    });

    // If user is institute role, link instituteId to user
    if (req.user?.userId) {
      await User.findByIdAndUpdate(req.user.userId, { instituteId: institute._id });
    }

    res.status(201).json({ success: true, data: institute });
  } catch (error) {
    next(error);
  }
};

// PUT /api/institutes/:id
const updateInstitute = async (req, res, next) => {
  try {
    const {
      name,
      state,
      district,
      address,
      languages,
      totalTrainers,
      numberOfEmployees,
      skillsCovered,
      contactEmail,
      contactPhone,
    } = req.body;

    if (!(await assertOwnsInstitute(req, req.params.id))) {
      return res.status(403).json({ success: false, message: "Not authorized to edit this institute" });
    }

    const institute = await Institute.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name }),
        ...(state && { state }),
        ...(district && { district }),
        ...(address !== undefined && { address }),
        ...(languages && { languages }),
        ...(totalTrainers !== undefined && { totalTrainers: Number(totalTrainers) }),
        ...(numberOfEmployees !== undefined && { numberOfEmployees: Number(numberOfEmployees) }),
        ...(skillsCovered && { skillsCovered }),
        ...(contactEmail !== undefined && { contactEmail }),
        ...(contactPhone !== undefined && { contactPhone }),
      },
      { new: true, runValidators: true }
    ).populate("coursesOffered");

    if (!institute) {
      return res.status(404).json({ success: false, message: "Institute not found" });
    }

    res.json({ success: true, data: institute });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/institutes/:id
const deleteInstitute = async (req, res, next) => {
  try {
    const institute = await Institute.findByIdAndDelete(req.params.id);
    if (!institute) {
      return res.status(404).json({ success: false, message: "Institute not found" });
    }
    res.json({ success: true, message: "Institute deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// GET /api/institutes/me/dashboard (protected, institute role or admin)
const getMyInstituteDashboard = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let institute = null;
    if (user.instituteId) {
      institute = await Institute.findById(user.instituteId).populate("coursesOffered");
    }
    if (!institute) {
      // Claim by name only if that institute isn't already owned by another account
      institute = await Institute.findOne({
        $or: [
          { userId: user._id },
          { name: user.organization || user.name, userId: null },
        ],
      }).populate("coursesOffered");
      if (institute && !institute.userId) {
        institute.userId = user._id;
        await institute.save();
        await User.findByIdAndUpdate(user._id, { instituteId: institute._id });
      }
    }

    // First visit: create a starter profile the user completes from the Profile tab
    if (!institute) {
      institute = await Institute.create({
        name: user.organization || `${user.name} Skill Centre`,
        state: user.primaryState || "Not specified",
        district: "Not specified",
        languages: ["English"],
        totalTrainers: 0,
        skillsCovered: [],
        contactEmail: user.email,
        userId: user._id,
      });
      await User.findByIdAndUpdate(user._id, { instituteId: institute._id });
    }

    // Fetch courses associated with this institute or provider name
    const courses = await Course.find({
      $or: [
        { instituteId: institute._id },
        { provider: new RegExp(escapeRegex(institute.name), "i") },
        { district: new RegExp(escapeRegex(institute.district), "i") },
      ],
    }).limit(10);

    // Aggregate market demand in the institute's state
    const stateJobs = await Job.find({
      state: new RegExp(`^${escapeRegex(institute.state)}$`, "i"),
    });

    const marketSkillCounts = {};
    stateJobs.forEach((job) => {
      (job.skills || []).forEach((sk) => {
        marketSkillCounts[sk] = (marketSkillCounts[sk] || 0) + 1;
      });
    });

    const trendingInState = Object.entries(marketSkillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, demandCount: count }));

    // Extract all skills covered by institute's trainers + its courses
    const allInstituteSkills = new Set(institute.skillsCovered || []);
    courses.forEach((c) => {
      (c.skills || []).forEach((s) => allInstituteSkills.add(s));
    });
    const instituteSkillsArray = Array.from(allInstituteSkills);
    const instSkillsLower = instituteSkillsArray.map((s) => s.toLowerCase());

    // Compare market demand vs institute capability
    const skillComparison = trendingInState.map((item) => {
      const isCovered = instSkillsLower.includes(item.skill.toLowerCase());
      return {
        skill: item.skill,
        demandCount: item.demandCount,
        status: isCovered ? "Available" : "Not Available",
      };
    });

    const missingHighDemand = skillComparison.filter((s) => s.status === "Not Available");

    let recommendation = "";
    if (missingHighDemand.length > 0) {
      const missingNames = missingHighDemand.slice(0, 3).map((s) => s.skill).join(", ");
      recommendation = `High regional market demand detected in ${institute.state} for ${missingNames}. Consider adding specialized NSQF vocational modules to bridge this curriculum gap.`;
    } else {
      recommendation = `Excellent curriculum alignment. Institute capabilities match top industry demand skills in ${institute.state}.`;
    }

    // Placement outcomes for this institute's own courses, across all recorded years
    const placementRecords = await PlacementOutcome.find({
      courseId: { $in: courses.map((c) => c._id) },
    }).sort({ year: 1 });

    const placementByCourse = {};
    placementRecords.forEach((p) => {
      const key = String(p.courseId);
      if (!placementByCourse[key]) placementByCourse[key] = [];
      placementByCourse[key].push({ year: p.year, placementPercent: p.placementPercent, source: p.source });
    });

    const placementOutcomes = courses
      .map((c) => {
        const history = placementByCourse[String(c._id)] || [];
        if (history.length === 0) return null;
        const avgPlacementPercent = Math.round(
          history.reduce((sum, h) => sum + h.placementPercent, 0) / history.length
        );
        const latest = history[history.length - 1];
        return {
          courseId: c._id,
          courseName: c.courseName,
          history,
          avgPlacementPercent,
          latestPlacementPercent: latest.placementPercent,
          latestYear: latest.year,
        };
      })
      .filter(Boolean);

    res.json({
      success: true,
      data: {
        institute,
        courses,
        marketComparison: skillComparison,
        recommendation,
        totalStateJobs: stateJobs.length,
        placementOutcomes,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/institutes/:id/post-job (institute or admin) — stores posting intent, no external automation yet
const postJob = async (req, res, next) => {
  try {
    const institute = await Institute.findById(req.params.id);
    if (!institute) {
      return res.status(404).json({ success: false, message: "Institute not found" });
    }

    if (!(await assertOwnsInstitute(req, institute._id))) {
      return res.status(403).json({ success: false, message: "Not authorized to post jobs for this institute" });
    }

    const { title, description, skills, salaryRange } = req.body;
    if (!title || !description) {
      return res.status(400).json({ success: false, message: "Job title and description are required" });
    }

    const job = await Job.create(
      await withExtractedSkills({
        title,
        description,
        company: institute.name,
        district: institute.district,
        state: institute.state,
        skills: Array.isArray(skills) ? skills : [],
        salaryRange: salaryRange || "",
        source: "institute-manual",
        postedDate: new Date(),
      })
    );

    res.status(201).json({
      success: true,
      message: "Job posting saved. Automated listing to external job boards is coming soon.",
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInstitutes,
  getInstituteById,
  createInstitute,
  updateInstitute,
  deleteInstitute,
  getMyInstituteDashboard,
  postJob,
};
