const User = require("../models/User");
const Job = require("../models/Job");
const Skill = require("../models/Skill");
const Course = require("../models/Course");
const Institute = require("../models/Institute");
const GapScore = require("../models/GapScore");
const Recommendation = require("../models/Recommendation");
const PlacementOutcome = require("../models/PlacementOutcome");
const DistrictPlan = require("../models/DistrictPlan");

// GET /api/admin/stats?state=Kerala&district=Ernakulam
const getStats = async (req, res, next) => {
  try {
    const { state, district } = req.query;

    const jobFilter = {};
    const courseFilter = {};
    const instituteFilter = {};
    const traineeFilter = { role: "trainee" };
    const employerFilter = { role: "employer" };

    if (state && state !== "All") {
      jobFilter.state = state;
      courseFilter.state = state;
      instituteFilter.state = state;
      traineeFilter.primaryState = state;
    }

    if (district && district !== "All") {
      jobFilter.district = district;
      courseFilter.district = district;
      instituteFilter.district = district;
    }

    const [
      totalJobs,
      totalCourses,
      totalSkills,
      totalInstitutes,
      totalEmployers,
      totalTrainees,
      placements,
      highGapCourses,
    ] = await Promise.all([
      Job.countDocuments(jobFilter),
      Course.countDocuments(courseFilter),
      Skill.countDocuments(),
      Institute.countDocuments(instituteFilter),
      User.countDocuments(employerFilter),
      User.countDocuments(traineeFilter),
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
        totalInstitutes,
        totalEmployers,
        totalTrainees,
        averagePlacementRate,
        highGapCourses,
        selectedState: state || "All",
        selectedDistrict: district || "All",
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/skill-demand?state=Kerala&district=Ernakulam
const getSkillDemand = async (req, res, next) => {
  try {
    const { state, district } = req.query;
    const match = {};

    if (state && state !== "All") {
      match.state = state;
    }
    if (district && district !== "All") {
      match.district = district;
    }

    const pipeline = [];
    if (Object.keys(match).length > 0) {
      pipeline.push({ $match: match });
    }

    pipeline.push(
      { $unwind: "$skills" },
      { $group: { _id: "$skills", jobCount: { $sum: 1 } } },
      { $sort: { jobCount: -1 } },
      { $limit: 20 }
    );

    const results = await Job.aggregate(pipeline);
    const totalJobs = await Job.countDocuments(match);

    const skills = results.map((r) => ({
      skill: r._id,
      jobCount: r.jobCount,
      percentage: totalJobs > 0 ? parseFloat(((r.jobCount / totalJobs) * 100).toFixed(1)) : 0,
    }));

    res.json({ success: true, data: { skills, totalJobs, state: state || "All", district: district || "All" } });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/states-summary
const getStatesSummary = async (req, res, next) => {
  try {
    const knownStates = ["Kerala", "Karnataka", "Tamil Nadu", "Maharashtra", "Delhi", "Telangana", "Gujarat"];

    const [jobsByState, coursesByState, institutesByState] = await Promise.all([
      Job.aggregate([
        { $match: { state: { $exists: true, $ne: "" } } },
        { $group: { _id: "$state", count: { $sum: 1 } } },
      ]),
      Course.aggregate([
        { $match: { state: { $exists: true, $ne: "" } } },
        { $group: { _id: "$state", count: { $sum: 1 } } },
      ]),
      Institute.aggregate([
        { $match: { state: { $exists: true, $ne: "" } } },
        { $group: { _id: "$state", count: { $sum: 1 } } },
      ]),
    ]);

    const jobMap = {};
    jobsByState.forEach((s) => { jobMap[s._id] = s.count; });
    const courseMap = {};
    coursesByState.forEach((s) => { courseMap[s._id] = s.count; });
    const instituteMap = {};
    institutesByState.forEach((s) => { instituteMap[s._id] = s.count; });

    // Combine distinct states
    const allStateNames = Array.from(new Set([
      ...knownStates,
      ...Object.keys(jobMap),
      ...Object.keys(courseMap),
      ...Object.keys(instituteMap),
    ])).filter(Boolean);

    const summary = allStateNames.map((state) => ({
      state,
      jobCount: jobMap[state] || 0,
      courseCount: courseMap[state] || 0,
      instituteCount: instituteMap[state] || 0,
    })).sort((a, b) => b.jobCount - a.jobCount);

    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/district-summary?state=Kerala
const getDistrictSummary = async (req, res, next) => {
  try {
    const { state } = req.query;
    const match = {};
    if (state && state !== "All") {
      match.state = state;
    }

    // Jobs per district
    const jobsPipeline = [];
    if (Object.keys(match).length > 0) jobsPipeline.push({ $match: match });
    jobsPipeline.push(
      { $group: { _id: "$district", jobCount: { $sum: 1 } } },
      { $sort: { jobCount: -1 } }
    );

    // Courses per district
    const coursesPipeline = [];
    if (Object.keys(match).length > 0) coursesPipeline.push({ $match: match });
    coursesPipeline.push(
      { $group: { _id: "$district", courseCount: { $sum: 1 } } }
    );

    const [jobsByDistrict, coursesByDistrict] = await Promise.all([
      Job.aggregate(jobsPipeline),
      Course.aggregate(coursesPipeline),
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
      .populate("courseId", "courseName district sector state")
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

module.exports = {
  getStats,
  getSkillDemand,
  getStatesSummary,
  getDistrictSummary,
  getRecommendations,
};
