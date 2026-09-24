const DistrictPlan = require("../models/DistrictPlan");
const Job = require("../models/Job");
const { exactRegex } = require("../utils/escapeRegex");

// GET /api/districts
const getDistricts = async (req, res, next) => {
  try {
    // Get all distinct districts from jobs
    const jobDistricts = await Job.distinct("district");

    // Get plans for districts that have them
    const plans = await DistrictPlan.find();
    const planMap = {};
    plans.forEach((p) => {
      planMap[p.district] = p;
    });

    const districts = jobDistricts.filter(Boolean).map((d) => ({
      district: d,
      hasPlan: !!planMap[d],
      topDemandSkills: planMap[d]?.topDemandSkills ?? [],
    }));

    res.json({ success: true, data: districts });
  } catch (error) {
    next(error);
  }
};

// GET /api/districts/:name/plan
const getDistrictPlan = async (req, res, next) => {
  try {
    const name = req.params.name;
    const plan = await DistrictPlan.findOne({ district: exactRegex(name) });

    if (!plan) {
      return res.status(404).json({ success: false, message: `No plan found for district: ${name}` });
    }

    res.json({
      success: true,
      data: {
        district: plan.district,
        summary: plan.summary,
        topDemandSkills: plan.topDemandSkills,
        oversuppliedCourses: plan.oversuppliedCourses,
        updatedAt: plan.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDistricts, getDistrictPlan };
