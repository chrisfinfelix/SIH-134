const Course = require("../models/Course");
const GapScore = require("../models/GapScore");
const Recommendation = require("../models/Recommendation");
const PlacementOutcome = require("../models/PlacementOutcome");
const Institute = require("../models/Institute");
const { ensureAutoGapAlert } = require("./notificationController");

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

        ensureAutoGapAlert(course, gap?.flag);

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

    ensureAutoGapAlert(course, gap?.flag);

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

// GET /api/courses/meta/sectors — distinct sector values actually present in the data
const getSectors = async (req, res, next) => {
  try {
    const sectors = await Course.distinct("sector");
    res.json({ success: true, data: sectors.filter(Boolean).sort() });
  } catch (error) {
    next(error);
  }
};

// Resolve the institute a logged-in institute user manages, if any
const resolveOwnInstituteId = async (req) => {
  const institute = await Institute.findOne({ userId: req.user.userId });
  return institute?._id || null;
};

// POST /api/courses (institute or admin)
const createCourse = async (req, res, next) => {
  try {
    const {
      courseName,
      nsqfLevel,
      sector,
      skills,
      proficiencyLevel,
      district,
      state,
      deliveryMode,
      durationWeeks,
      provider,
      instituteId,
    } = req.body;

    if (!courseName) {
      return res.status(400).json({ success: false, message: "Course name is required" });
    }

    let resolvedInstituteId = instituteId || null;
    if (req.user.role === "institute") {
      resolvedInstituteId = await resolveOwnInstituteId(req);
      if (!resolvedInstituteId) {
        return res.status(404).json({ success: false, message: "No institute profile found for this user" });
      }
    }

    const course = await Course.create({
      courseName,
      nsqfLevel: nsqfLevel ?? null,
      sector: sector || "",
      skills: Array.isArray(skills) ? skills : [],
      proficiencyLevel: proficiencyLevel || "",
      district: district || "",
      state: state || "",
      deliveryMode: deliveryMode || "Offline",
      durationWeeks: durationWeeks ?? null,
      provider: provider || "",
      instituteId: resolvedInstituteId,
    });

    if (resolvedInstituteId) {
      await Institute.findByIdAndUpdate(resolvedInstituteId, { $addToSet: { coursesOffered: course._id } });
    }

    res.status(201).json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};

// PUT /api/courses/:id (institute owner or admin)
const updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    if (req.user.role === "institute") {
      const ownInstituteId = await resolveOwnInstituteId(req);
      if (!ownInstituteId || String(course.instituteId) !== String(ownInstituteId)) {
        return res.status(403).json({ success: false, message: "Not authorized to edit this course" });
      }
    }

    const {
      courseName,
      nsqfLevel,
      sector,
      skills,
      proficiencyLevel,
      district,
      state,
      deliveryMode,
      durationWeeks,
      provider,
    } = req.body;

    Object.assign(course, {
      ...(courseName && { courseName }),
      ...(nsqfLevel !== undefined && { nsqfLevel }),
      ...(sector !== undefined && { sector }),
      ...(skills && { skills }),
      ...(proficiencyLevel !== undefined && { proficiencyLevel }),
      ...(district !== undefined && { district }),
      ...(state !== undefined && { state }),
      ...(deliveryMode && { deliveryMode }),
      ...(durationWeeks !== undefined && { durationWeeks }),
      ...(provider !== undefined && { provider }),
    });

    await course.save();

    res.json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/courses/:id (institute owner or admin)
const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    if (req.user.role === "institute") {
      const ownInstituteId = await resolveOwnInstituteId(req);
      if (!ownInstituteId || String(course.instituteId) !== String(ownInstituteId)) {
        return res.status(403).json({ success: false, message: "Not authorized to delete this course" });
      }
    }

    if (course.instituteId) {
      await Institute.findByIdAndUpdate(course.instituteId, { $pull: { coursesOffered: course._id } });
    }
    await course.deleteOne();

    res.json({ success: true, message: "Course deleted successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCourses,
  getCourseById,
  getSectors,
  createCourse,
  updateCourse,
  deleteCourse,
};
