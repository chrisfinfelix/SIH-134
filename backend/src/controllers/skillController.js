const Skill = require("../models/Skill");
const Job = require("../models/Job");

// GET /api/skills
const getSkills = async (req, res, next) => {
  try {
    const skills = await Skill.find().sort({ skillName: 1 });
    res.json({ success: true, data: skills });
  } catch (error) {
    next(error);
  }
};

// GET /api/skills/:id
const getSkillById = async (req, res, next) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) {
      return res.status(404).json({ success: false, message: "Skill not found" });
    }
    res.json({ success: true, data: skill });
  } catch (error) {
    next(error);
  }
};

// GET /api/skills/demand
// Returns aggregated demand from the Jobs collection
const getSkillDemand = async (req, res, next) => {
  try {
    const pipeline = [
      { $unwind: "$skills" },
      { $group: { _id: "$skills", jobCount: { $sum: 1 } } },
      { $sort: { jobCount: -1 } },
      { $limit: 30 },
    ];

    const results = await Job.aggregate(pipeline);
    const totalJobs = await Job.countDocuments();

    const skills = results.map((r) => ({
      skill: r._id,
      jobCount: r.jobCount,
      percentage: totalJobs > 0 ? parseFloat(((r.jobCount / totalJobs) * 100).toFixed(1)) : 0,
    }));

    res.json({ success: true, data: { skills, totalJobs } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSkills, getSkillById, getSkillDemand };
