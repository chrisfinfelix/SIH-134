const Course = require("../models/Course");
const GapScore = require("../models/GapScore");
const Recommendation = require("../models/Recommendation");
const PlacementOutcome = require("../models/PlacementOutcome");

// GET /api/courses
const getCourses = async (req, res, next) => {
  try {
    const { district, sector, skill, flag, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (district) filter.district = new RegExp(district, "i");
    if (sector) filter.sector = new RegExp(sector, "i");
    if (skill) filter.skills = { $in: [new RegExp(skill, "i")] };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Course.countDocuments(filter);
    let courses = await Course.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 });

    // Enrich each course with gap score and recommendation
    const enriched = await Promise.all(
      courses.map(async (course) => {
        const gap = await GapScore.findOne({ courseId: course._id });
        const rec = await Recommendation.findOne({ courseId: course._id });

        // If filtering by flag, skip courses that don't match
        if (flag && gap?.flag && !gap.flag.toLowerCase().includes(flag.toLowerCase())) {
          return null;
        }

        return {
          id: course._id,
          courseName: course.courseName,
          externalCourseId: course.externalCourseId,
          district: course.district,
          sector: course.sector,
          nsqfLevel: course.nsqfLevel,
          durationWeeks: course.durationWeeks,
          provider: course.provider,
          skills: course.skills,
          gapScore: gap?.gapScore ?? null,
          flag: gap?.flag ?? null,
          matchedSkills: gap?.matchedSkills ?? [],
          missingSkills: gap?.missingSkills ?? [],
          demandCount: gap?.demandCount ?? null,
          recommendation: rec
            ? {
                text: rec.recommendationText,
                flagType: rec.flagType,
                suggestedSkills: rec.suggestedSkillsToAdd,
              }
            : null,
        };
      })
    );

    const filtered = enriched.filter(Boolean);

    res.json({
      success: true,
      data: filtered,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/courses/:id
const getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const gap = await GapScore.findOne({ courseId: course._id });
    const rec = await Recommendation.findOne({ courseId: course._id });
    const placement = await PlacementOutcome.findOne({ courseId: course._id }).sort({ year: -1 });

    res.json({
      success: true,
      data: {
        id: course._id,
        courseName: course.courseName,
        externalCourseId: course.externalCourseId,
        district: course.district,
        sector: course.sector,
        nsqfLevel: course.nsqfLevel,
        durationWeeks: course.durationWeeks,
        provider: course.provider,
        proficiencyLevel: course.proficiencyLevel,
        skills: course.skills,
        createdAt: course.createdAt,
        gapScore: gap?.gapScore ?? null,
        flag: gap?.flag ?? null,
        matchedSkills: gap?.matchedSkills ?? [],
        missingSkills: gap?.missingSkills ?? [],
        demandCount: gap?.demandCount ?? null,
        recommendation: rec
          ? {
              text: rec.recommendationText,
              flagType: rec.flagType,
              suggestedSkills: rec.suggestedSkillsToAdd,
            }
          : null,
        placement: placement
          ? {
              placementPercent: placement.placementPercent,
              year: placement.year,
              source: placement.source,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCourses, getCourseById };
