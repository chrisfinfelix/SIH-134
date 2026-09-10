const Institute = require("../models/Institute");
const Course = require("../models/Course");
const Job = require("../models/Job");
const User = require("../models/User");

const escapeRegex = (str = "") => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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
      skillsCovered,
      contactEmail,
      contactPhone,
    } = req.body;

    const institute = await Institute.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name }),
        ...(state && { state }),
        ...(district && { district }),
        ...(address !== undefined && { address }),
        ...(languages && { languages }),
        ...(totalTrainers !== undefined && { totalTrainers: Number(totalTrainers) }),
        ...(skillsCovered && { skillsCovered }),
        ...(contactEmail !== undefined && { contactEmail }),
        ...(contactPhone !== undefined && { contactPhone }),
      },
      { new: true }
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
      // Look up by userId or organization name
      institute = await Institute.findOne({
        $or: [{ userId: user._id }, { name: user.organization || user.name }],
      }).populate("coursesOffered");
    }

    // If still no institute, create a default profile so the dashboard renders seamlessly
    if (!institute) {
      institute = await Institute.create({
        name: user.organization || `${user.name} Skill Centre`,
        state: user.primaryState || "Kerala",
        district: "Kottayam",
        languages: ["English", "Malayalam"],
        totalTrainers: 25,
        skillsCovered: ["JavaScript", "React", "Python", "Data Analytics", "Cloud"],
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

    let aiRecommendation = "";
    if (missingHighDemand.length > 0) {
      const missingNames = missingHighDemand.slice(0, 3).map((s) => s.skill).join(", ");
      aiRecommendation = `High regional market demand detected in ${institute.state} for ${missingNames}. Consider adding specialized NSQF vocational modules to bridge this curriculum gap.`;
    } else {
      aiRecommendation = `Excellent curriculum alignment. Institute capabilities match top industry demand skills in ${institute.state}.`;
    }

    res.json({
      success: true,
      data: {
        institute,
        courses,
        marketComparison: skillComparison,
        aiRecommendation,
        totalStateJobs: stateJobs.length,
      },
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
};
