const Job = require("../models/Job");

// GET /api/jobs
const getJobs = async (req, res, next) => {
  try {
    const { district, state, skill, role, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (district) filter.district = new RegExp(district, "i");
    if (state) filter.state = new RegExp(state, "i");
    if (skill) filter.skills = { $in: [new RegExp(skill, "i")] };
    if (role) filter.title = new RegExp(role, "i");

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Job.countDocuments(filter);
    const jobs = await Job.find(filter).skip(skip).limit(Number(limit)).sort({ postedDate: -1 });

    res.json({
      success: true,
      data: jobs,
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

// GET /api/jobs/:id
const getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }
    res.json({ success: true, data: job });
  } catch (error) {
    next(error);
  }
};

// POST /api/jobs  (admin only)
const createJob = async (req, res, next) => {
  try {
    const job = await Job.create(req.body);
    res.status(201).json({ success: true, data: job });
  } catch (error) {
    next(error);
  }
};

// POST /api/jobs/bulk  (admin only)
const bulkCreateJobs = async (req, res, next) => {
  try {
    const jobs = req.body;
    if (!Array.isArray(jobs) || jobs.length === 0) {
      return res.status(400).json({ success: false, message: "Expected a non-empty array of jobs" });
    }

    // Map from snake_case JSON fields to camelCase model fields
    const mapped = jobs.map((j) => ({
      externalJobId: j.job_id || j.externalJobId || "",
      title: j.title || "",
      company: j.company || "",
      district: j.district || "",
      state: j.state || "",
      skills: j.skills || [],
      proficiencyLevel: j.proficiency_level || j.proficiencyLevel || "",
      source: j.source || "",
      postedDate: j.posted_date || j.postedDate || new Date(),
      salaryRange: j.salary_range || j.salaryRange || "",
      description: j.description || "",
    }));

    const inserted = await Job.insertMany(mapped, { ordered: false });
    res.status(201).json({ success: true, data: { inserted: inserted.length } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getJobs, getJobById, createJob, bulkCreateJobs };
