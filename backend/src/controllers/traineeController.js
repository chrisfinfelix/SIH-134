const Course = require("../models/Course");
const Job = require("../models/Job");
const GapScore = require("../models/GapScore");

// GET /api/trainee/pathways?targetRole=Full Stack Developer
const getPathways = async (req, res, next) => {
  try {
    const { targetRole } = req.query;

    if (!targetRole) {
      return res.status(400).json({ success: false, message: "targetRole query parameter is required" });
    }

    // Find jobs matching the target role to collect required skills
    const matchingJobs = await Job.find({ title: new RegExp(targetRole, "i") });

    // Aggregate all skills required for this role
    const skillFrequency = {};
    matchingJobs.forEach((job) => {
      job.skills.forEach((skill) => {
        skillFrequency[skill] = (skillFrequency[skill] || 0) + 1;
      });
    });

    // Sort by frequency, take top skills
    const requiredSkills = Object.entries(skillFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill]) => skill);

    // If no jobs found for the role, use role name as keyword to find courses
    const courses = await Course.find();

    // Rank each course by skill overlap with required skills
    const ranked = courses.map((course) => {
      const courseSkillsLower = course.skills.map((s) => s.toLowerCase());
      const requiredLower = requiredSkills.map((s) => s.toLowerCase());

      const matchedSkills = requiredSkills.filter((s) => courseSkillsLower.includes(s.toLowerCase()));
      const missingSkills = requiredSkills.filter((s) => !courseSkillsLower.includes(s.toLowerCase()));

      const matchPercentage =
        requiredSkills.length > 0
          ? parseFloat(((matchedSkills.length / requiredSkills.length) * 100).toFixed(1))
          : 0;

      return {
        courseId: course._id,
        courseName: course.courseName,
        district: course.district,
        provider: course.provider,
        durationWeeks: course.durationWeeks,
        matchPercentage,
        matchedSkills,
        missingSkills,
      };
    });

    // Sort descending by match percentage, only include courses with at least 1 match
    const sorted = ranked
      .filter((c) => c.matchPercentage > 0)
      .sort((a, b) => b.matchPercentage - a.matchPercentage);

    res.json({
      success: true,
      data: {
        targetRole,
        requiredSkills,
        totalJobsFound: matchingJobs.length,
        courses: sorted,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPathways };
