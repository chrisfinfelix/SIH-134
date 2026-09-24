const Job = require("../models/Job");
const Course = require("../models/Course");
const Institute = require("../models/Institute");
const PlacementOutcome = require("../models/PlacementOutcome");

// GET /api/public/stats — aggregate counts only, safe for unauthenticated visitors
const getPublicStats = async (req, res, next) => {
  try {
    const [totalJobs, totalCourses, totalInstitutes, jobDistricts, courseDistricts, placementAgg] =
      await Promise.all([
        Job.countDocuments(),
        Course.countDocuments(),
        Institute.countDocuments(),
        Job.distinct("district"),
        Course.distinct("district"),
        PlacementOutcome.aggregate([{ $group: { _id: null, avg: { $avg: "$placementPercent" } } }]),
      ]);

    const districts = new Set([...jobDistricts, ...courseDistricts].filter(Boolean));
    const avg = placementAgg[0]?.avg;

    res.json({
      success: true,
      data: {
        totalJobs,
        totalCourses,
        totalInstitutes,
        districtsCovered: districts.size,
        averagePlacementRate: avg != null ? Math.round(avg * 10) / 10 : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPublicStats };
