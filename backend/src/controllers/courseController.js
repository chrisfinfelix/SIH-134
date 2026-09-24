const Course = require("../models/Course");
const GapScore = require("../models/GapScore");
const Recommendation = require("../models/Recommendation");
const PlacementOutcome = require("../models/PlacementOutcome");
const Institute = require("../models/Institute");
const { ensureAutoGapAlert } = require("./notificationController");
const { containsRegex, exactRegex } = require("../utils/escapeRegex");
const { parsePagination, buildPagination } = require("../utils/pagination");

// "unassessed" selects courses that have no gap score yet
const UNASSESSED_FLAG = "unassessed";

// GET /api/courses
const getCourses = async (req, res, next) => {
  try {
    const { district, sector, skill, state, deliveryMode, flag } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const filter = {};
    if (district) filter.district = containsRegex(district);
    if (sector) filter.sector = containsRegex(sector);
    if (skill) filter.skills = { $in: [containsRegex(skill)] };
    if (state) filter.state = exactRegex(state);
    if (deliveryMode && deliveryMode !== "All") filter.deliveryMode = deliveryMode;

    // Resolve the flag filter against GapScore up front so pagination counts are correct
    if (flag) {
      if (flag.toLowerCase() === UNASSESSED_FLAG) {
        filter._id = { $nin: await GapScore.distinct("courseId") };
      } else {
        filter._id = { $in: await GapScore.distinct("courseId", { flag: containsRegex(flag) }) };
      }
    }

    const [total, courses] = await Promise.all([
      Course.countDocuments(filter),
      Course.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
    ]);

    const courseIds = courses.map((c) => c._id);
    const [gaps, recs] = await Promise.all([
      GapScore.find({ courseId: { $in: courseIds } }),
      Recommendation.find({ courseId: { $in: courseIds } }),
    ]);
    const gapByCourse = new Map(gaps.map((g) => [String(g.courseId), g]));
    const recByCourse = new Map(recs.map((r) => [String(r.courseId), r]));

    const data = courses.map((course) => {
      const gap = gapByCourse.get(String(course._id));
      ensureAutoGapAlert(course, gap?.flag);
      return serializeCourse(course, gap, recByCourse.get(String(course._id)));
    });

    res.json({ success: true, data, pagination: buildPagination(page, limit, total) });
  } catch (error) {
    next(error);
  }
};

const serializeCourse = (course, gap, rec) => ({
  id: course._id,
  courseName: course.courseName,
  externalCourseId: course.externalCourseId,
  district: course.district,
  state: course.state,
  deliveryMode: course.deliveryMode,
  sector: course.sector,
  nsqfLevel: course.nsqfLevel,
  durationWeeks: course.durationWeeks,
  provider: course.provider,
  proficiencyLevel: course.proficiencyLevel,
  skills: course.skills,
  createdAt: course.createdAt,
  gapScore: gap?.gapScore ?? null,
  flag: gap?.flag || null,
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
});

// GET /api/courses/:id
const getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const [gap, rec, placement] = await Promise.all([
      GapScore.findOne({ courseId: course._id }),
      Recommendation.findOne({ courseId: course._id }),
      PlacementOutcome.findOne({ courseId: course._id }).sort({ year: -1 }),
    ]);

    ensureAutoGapAlert(course, gap?.flag);

    res.json({
      success: true,
      data: {
        ...serializeCourse(course, gap, rec),
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
