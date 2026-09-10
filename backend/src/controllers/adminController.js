const User = require("../models/User");
const Job = require("../models/Job");
const Skill = require("../models/Skill");
const Course = require("../models/Course");
const GapScore = require("../models/GapScore");
const Recommendation = require("../models/Recommendation");
const PlacementOutcome = require("../models/PlacementOutcome");
const DistrictPlan = require("../models/DistrictPlan");

// GET /api/admin/stats
const getStats = async (req, res, next) => {
  try {
    const [
      totalJobs,
      totalCourses,
      totalSkills,
      totalEmployers,
      totalTrainees,
      placements,
      highGapCourses,
    ] = await Promise.all([
      Job.countDocuments(),
      Course.countDocuments(),
      Skill.countDocuments(),
      User.countDocuments({ role: "employer" }),
      User.countDocuments({ role: "trainee" }),
      PlacementOutcome.find(),
      GapScore.countDocuments({ gapScore: { $gte: 40 } }),
    ]);

    const averagePlacementRate =
      placements.length > 0
        ? parseFloat(
            (placements.reduce((sum, p) => sum + p.placementPercent, 0) / placements.length).toFixed(1)
          )
        : 0;

    res.json({
      success: true,
      data: {
        totalJobs,
        totalCourses,
        totalSkills,
        totalEmployers,
        totalTrainees,
        averagePlacementRate,
        highGapCourses,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/skill-demand
const getSkillDemand = async (req, res, next) => {
  try {
    const pipeline = [
      { $unwind: "$skills" },
      { $group: { _id: "$skills", jobCount: { $sum: 1 } } },
      { $sort: { jobCount: -1 } },
      { $limit: 20 },
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

// GET /api/admin/district-summary
const getDistrictSummary = async (req, res, next) => {
  try {
    // Jobs per district
    const jobsByDistrict = await Job.aggregate([
      { $group: { _id: "$district", jobCount: { $sum: 1 } } },
      { $sort: { jobCount: -1 } },
    ]);

    // Courses per district
    const coursesByDistrict = await Course.aggregate([
      { $group: { _id: "$district", courseCount: { $sum: 1 } } },
    ]);

    const courseMap = {};
    coursesByDistrict.forEach((c) => {
      courseMap[c._id] = c.courseCount;
    });

    const summary = jobsByDistrict.filter(d => d._id).map((d) => ({
      district: d._id,
      jobCount: d.jobCount,
      courseCount: courseMap[d._id] || 0,
    }));

    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/recommendations
const getRecommendations = async (req, res, next) => {
  try {
    const recommendations = await Recommendation.find()
      .populate("courseId", "courseName district sector")
      .sort({ createdAt: -1 });

    const data = recommendations.map((r) => ({
      id: r._id,
      course: r.courseId,
      recommendationText: r.recommendationText,
      flagType: r.flagType,
      suggestedSkillsToAdd: r.suggestedSkillsToAdd,
      createdAt: r.createdAt,
    }));

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

module.exports = { getStats, getSkillDemand, getDistrictSummary, getRecommendations };
