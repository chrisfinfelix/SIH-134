const Course = require("../models/Course");
const GapScore = require("../models/GapScore");
const Recommendation = require("../models/Recommendation");

/**
 * Returns courses that need curriculum updates (flag = "Needs Update" or high gap score).
 * Used by admin dashboard.
 */
const getCoursesNeedingUpdate = async () => {
  const gapScores = await GapScore.find({
    $or: [{ flag: "Needs Update" }, { flag: "Critical" }, { gapScore: { $gte: 40 } }],
  }).populate("courseId");

  return gapScores.map((g) => ({
    course: g.courseId,
    gapScore: g.gapScore,
    flag: g.flag,
    missingSkills: g.missingSkills,
  }));
};

module.exports = { getCoursesNeedingUpdate };
