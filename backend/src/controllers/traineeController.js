const Course = require("../models/Course");
const Job = require("../models/Job");
const GapScore = require("../models/GapScore");
const User = require("../models/User");
const Institute = require("../models/Institute");

const escapeRegex = (str = "") => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/trainee/pathways?targetRole=Full Stack Developer&primaryState=Kerala&preferredStates=Karnataka,Tamil Nadu&skills=HTML,CSS,React&deliveryMode=All
const getPathways = async (req, res, next) => {
  try {
    const { targetRole, primaryState, preferredStates, skills, deliveryMode } = req.query;

    if (!targetRole) {
      return res.status(400).json({ success: false, message: "targetRole query parameter is required" });
    }

    // Parse user current skills (from query or logged-in user if available)
    let userSkills = [];
    if (skills) {
      userSkills = Array.isArray(skills)
        ? skills
        : skills.split(",").map((s) => s.trim()).filter(Boolean);
    } else if (req.user?.userId) {
      const user = await User.findById(req.user.userId);
      userSkills = user?.skills || [];
    }
    const userSkillsLower = userSkills.map((s) => s.toLowerCase());

    // Parse state preferences
    const pState = (primaryState || "").trim();
    let addStates = [];
    if (preferredStates) {
      addStates = Array.isArray(preferredStates)
        ? preferredStates
        : preferredStates.split(",").map((s) => s.trim()).filter(Boolean);
    }
    const allSearchStates = [pState, ...addStates].filter(Boolean);
    const searchStatesLower = allSearchStates.map((s) => s.toLowerCase());

    // 1. Find jobs matching target role
    let jobQuery = { title: new RegExp(escapeRegex(targetRole), "i") };
    let matchingJobs = await Job.find(jobQuery);

    // If no jobs found with specific keyword, search broader or fallback to all jobs for skill extraction
    if (matchingJobs.length === 0) {
      matchingJobs = await Job.find({
        $or: [
          { title: new RegExp(escapeRegex(targetRole.split(" ")[0]), "i") },
          { sector: new RegExp(escapeRegex(targetRole), "i") },
        ],
      });
    }

    // Aggregate required skills for this target role
    const skillFrequency = {};
    matchingJobs.forEach((job) => {
      (job.skills || []).forEach((skill) => {
        skillFrequency[skill] = (skillFrequency[skill] || 0) + 1;
      });
    });

    // Top 8-10 required skills for role
    let requiredSkills = Object.entries(skillFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill]) => skill);

    if (requiredSkills.length === 0) {
      // Fallback default skills if no jobs tagged
      requiredSkills = ["JavaScript", "React", "Node.js", "MongoDB", "Git", "HTML/CSS", "Cloud"];
    }

    // 2. Identify Already Learned vs Skills to Develop
    const alreadyLearned = requiredSkills.filter((s) => userSkillsLower.includes(s.toLowerCase()));
    const skillsToDevelop = requiredSkills.filter((s) => !userSkillsLower.includes(s.toLowerCase()));

    const matchPercentage =
      requiredSkills.length > 0
        ? Math.round((alreadyLearned.length / requiredSkills.length) * 100)
        : 0;

    // 3. State-Specific Trending Skills (from primaryState & preferredStates)
    let stateJobMatch = {};
    if (allSearchStates.length > 0) {
      stateJobMatch = {
        state: { $in: allSearchStates.map((s) => new RegExp(`^${escapeRegex(s)}$`, "i")) },
      };
    }
    const regionalJobs = await Job.find(stateJobMatch);

    const regionalSkillCounts = {};
    regionalJobs.forEach((job) => {
      (job.skills || []).forEach((sk) => {
        regionalSkillCounts[sk] = (regionalSkillCounts[sk] || 0) + 1;
      });
    });

    let regionalTrendingSkills = Object.entries(regionalSkillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([skill]) => skill);

    if (regionalTrendingSkills.length === 0) {
      regionalTrendingSkills = ["React", "Python", "Cloud", "Data Analytics", "Cybersecurity"];
    }

    // 4. Find & Rank Recommended Courses
    let allCourses = await Course.find();

    // Delivery mode filtering: "Online", "Offline", "Hybrid" or "All"
    const targetMode = (deliveryMode || "All").trim();

    const filteredCourses = allCourses.filter((course) => {
      const cMode = course.deliveryMode || "Offline";
      const cState = (course.state || "").trim().toLowerCase();

      // Delivery mode filter
      if (targetMode !== "All" && cMode.toLowerCase() !== targetMode.toLowerCase()) {
        return false;
      }

      // State location filter:
      // Online courses can be taken from any state
      if (cMode.toLowerCase() === "online") {
        return true;
      }

      // If user specified state preferences, Offline/Hybrid courses should match selected states
      if (searchStatesLower.length > 0) {
        if (!cState) return true; // Include if state is unset/flexible
        return searchStatesLower.includes(cState);
      }

      return true;
    });

    // Rank courses by overlap with missing skills and required skills
    const rankedCourses = filteredCourses.map((course) => {
      const courseSkillsLower = (course.skills || []).map((s) => s.toLowerCase());

      const matchedWithMissing = skillsToDevelop.filter((s) =>
        courseSkillsLower.includes(s.toLowerCase())
      );
      const matchedWithRequired = requiredSkills.filter((s) =>
        courseSkillsLower.includes(s.toLowerCase())
      );

      const courseMatchPercent =
        requiredSkills.length > 0
          ? Math.round((matchedWithRequired.length / requiredSkills.length) * 100)
          : 0;

      return {
        courseId: course._id,
        courseName: course.courseName,
        provider: course.provider || "National Skill Center",
        state: course.state || pState || "Kerala",
        district: course.district || "Regional Center",
        deliveryMode: course.deliveryMode || "Offline",
        durationWeeks: course.durationWeeks || 8,
        matchPercentage: courseMatchPercent,
        gapSkillsCovered: matchedWithMissing,
        allMatchedSkills: matchedWithRequired,
        coverCount: matchedWithMissing.length,
      };
    });

    // Sort descending by gap skills covered, then total match percentage
    const sortedCourses = rankedCourses.sort((a, b) => {
      if (b.coverCount !== a.coverCount) {
        return b.coverCount - a.coverCount;
      }
      return b.matchPercentage - a.matchPercentage;
    });

    res.json({
      success: true,
      data: {
        targetRole,
        primaryState: pState || "All States",
        preferredStates: addStates,
        deliveryMode: targetMode,
        matchPercentage,
        currentSkills: userSkills,
        alreadyLearned,
        skillsToDevelop,
        regionalTrendingSkills,
        totalJobsFound: matchingJobs.length,
        recommendedCourses: sortedCourses,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/trainee/skills (protected)
const updateSkills = async (req, res, next) => {
  try {
    const { skills } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { skills: skills || [] },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// GET /api/trainee/skill-gap (protected)
const getSkillGap = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const userSkills = (user.skills || []).map((s) => s.toLowerCase());

    // Get top 20 trending skills from job market
    const pipeline = [
      { $unwind: "$skills" },
      { $group: { _id: "$skills", jobCount: { $sum: 1 } } },
      { $sort: { jobCount: -1 } },
      { $limit: 20 },
    ];
    const trendingRaw = await Job.aggregate(pipeline);
    const trendingSkills = trendingRaw.map((r) => r._id);

    const missingSkills = trendingSkills.filter((s) => !userSkills.includes(s.toLowerCase()));

    // Find courses
    const courses = await Course.find();

    const ranked = courses
      .map((course) => {
        const courseSkills = (course.skills || []).map((s) => s.toLowerCase());
        const covered = missingSkills.filter((s) =>
          courseSkills.includes(s.toLowerCase())
        );
        return {
          courseId: course._id,
          courseName: course.courseName,
          provider: course.provider,
          state: course.state || "Kerala",
          district: course.district,
          deliveryMode: course.deliveryMode || "Offline",
          durationWeeks: course.durationWeeks,
          gapSkillsCovered: covered,
          coverCount: covered.length,
        };
      })
      .filter((c) => c.coverCount > 0)
      .sort((a, b) => b.coverCount - a.coverCount);

    res.json({
      success: true,
      data: {
        userSkills: user.skills || [],
        trendingSkills,
        missingSkills,
        recommendedCourses: ranked,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/trainee/preferences (protected)
const updatePreferences = async (req, res, next) => {
  try {
    const { skills, targetRole, primaryState, preferredStates, preferredDeliveryMode } = req.body;
    const updateData = {};
    if (skills !== undefined) updateData.skills = skills;
    if (targetRole !== undefined) updateData.targetRole = targetRole;
    if (primaryState !== undefined) updateData.primaryState = primaryState;
    if (preferredStates !== undefined) updateData.preferredStates = preferredStates;
    if (preferredDeliveryMode !== undefined) updateData.preferredDeliveryMode = preferredDeliveryMode;

    const user = await User.findByIdAndUpdate(req.user.userId, updateData, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// GET /api/trainee/preferences (protected)
const getPreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({
      success: true,
      data: {
        skills: user.skills || [],
        targetRole: user.targetRole || "",
        primaryState: user.primaryState || "",
        preferredStates: user.preferredStates || [],
        preferredDeliveryMode: user.preferredDeliveryMode || "All",
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPathways, updateSkills, getSkillGap, updatePreferences, getPreferences };

