const Job = require("../models/Job");
const { containsRegex } = require("../utils/escapeRegex");
const { parsePagination, buildPagination } = require("../utils/pagination");
const { withExtractedSkills } = require("../services/aiService");

// GET /api/jobs
const getJobs = async (req, res, next) => {
  try {
    const { district, state, skill, role } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const filter = {};
    if (district) filter.district = containsRegex(district);
    if (state) filter.state = containsRegex(state);
    if (skill) filter.skills = { $in: [containsRegex(skill)] };
    if (role) filter.title = containsRegex(role);

    const [total, jobs] = await Promise.all([
      Job.countDocuments(filter),
      Job.find(filter).skip(skip).limit(limit).sort({ postedDate: -1 }),
    ]);

    res.json({ success: true, data: jobs, pagination: buildPagination(page, limit, total) });
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
    const job = await Job.create(await withExtractedSkills(req.body));
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
      sector: j.sector || "",
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
