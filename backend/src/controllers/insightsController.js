const { callML } = require("../services/aiService");

// Thin, validated proxy over ml-service. Keeping the ML service private behind
// the backend means it needs no auth/CORS of its own and the browser only ever
// talks to one origin.

const proxy = (buildRequest) => async (req, res, next) => {
  try {
    const request = buildRequest(req);
    if (request.error) {
      return res.status(400).json({ success: false, message: request.error });
    }
    const data = await callML(request.method || "get", request.path, request);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const nonEmptyString = (value, maxLen = 200) =>
  typeof value === "string" && value.trim().length > 0 && value.length <= maxLen;

// GET /api/insights/status
const getStatus = async (req, res) => {
  try {
    await callML("get", "/health");
    res.json({ success: true, data: { available: true } });
  } catch (error) {
    res.json({ success: true, data: { available: false, message: error.message } });
  }
};

const getOptions = proxy(() => ({ path: "/meta/options" }));

const getForecast = proxy((req) => ({
  path: "/forecast/demand",
  params: { role: req.query.role || undefined, skill: req.query.skill || undefined, location: req.query.location || undefined },
}));

const getTrends = proxy(() => ({ path: "/trend/emerging" }));

const getOversupply = proxy((req) => ({ path: "/oversupply/check", params: { course_id: req.params.courseId } }));

const getCurriculum = proxy((req) =>
  nonEmptyString(req.query.role)
    ? { path: "/curriculum/recommend", params: { role: req.query.role, location: req.query.location || undefined } }
    : { error: "role query parameter is required" }
);

const optimizeDistrictPlan = proxy((req) => {
  const { district, budget, maxCourses } = req.body || {};
  const budgetNum = Number(budget);
  const maxCoursesNum = Number(maxCourses ?? 10);
  if (!nonEmptyString(district)) return { error: "district is required" };
  if (!Number.isFinite(budgetNum) || budgetNum <= 0) return { error: "budget must be a positive number" };
  if (!Number.isInteger(maxCoursesNum) || maxCoursesNum < 1 || maxCoursesNum > 50) {
    return { error: "maxCourses must be an integer between 1 and 50" };
  }
  return {
    method: "post",
    path: "/district-plan/optimize",
    data: { district, budget: budgetNum, max_courses: maxCoursesNum },
  };
});

const getCareerPath = proxy((req) =>
  nonEmptyString(req.params.node) ? { path: `/career-path/${encodeURIComponent(req.params.node)}` } : { error: "node is required" }
);

const analyzeSkillGap = proxy((req) => {
  const { candidateSkills, targetRole } = req.body || {};
  if (!nonEmptyString(targetRole)) return { error: "targetRole is required" };
  if (!Array.isArray(candidateSkills) || candidateSkills.length > 100) {
    return { error: "candidateSkills must be an array of up to 100 skills" };
  }
  return {
    method: "post",
    path: "/skill-gap/analyze",
    data: { candidate_skills: candidateSkills.map(String), target_role: targetRole },
  };
});

const extractSkills = proxy((req) => {
  const { text } = req.body || {};
  if (!nonEmptyString(text, 10000)) return { error: "text is required (max 10,000 characters)" };
  return { method: "post", path: "/analyze-job", data: { description: text } };
});

const classifyJobTitle = proxy((req) => {
  const { title } = req.body || {};
  if (!nonEmptyString(title)) return { error: "title is required" };
  return { method: "post", path: "/job-title/classify", data: { title_text: title } };
});

const standardizeSkill = proxy((req) => {
  const { skill } = req.body || {};
  if (!nonEmptyString(skill)) return { error: "skill is required" };
  return { method: "post", path: "/skill/standardize", data: { raw_skill: skill } };
});

module.exports = {
  getStatus,
  getOptions,
  getForecast,
  getTrends,
  getOversupply,
  getCurriculum,
  optimizeDistrictPlan,
  getCareerPath,
  analyzeSkillGap,
  extractSkills,
  classifyJobTitle,
  standardizeSkill,
};
