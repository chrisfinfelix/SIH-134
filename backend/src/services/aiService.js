const axios = require("axios");

const AI_SERVICE_URL = (process.env.AI_SERVICE_URL || "http://localhost:8000").replace(/\/+$/, "");

// BERTopic trend fitting can take ~30s on the first call, everything else is fast.
const mlClient = axios.create({ baseURL: AI_SERVICE_URL, timeout: 60000 });

class AIServiceUnavailableError extends Error {
  constructor(cause) {
    super("AI/ML service is unavailable. Start ml-service (uvicorn app.main:app --port 8000) and retry.");
    this.statusCode = 503;
    this.cause = cause;
  }
}

/** Forwards a request to the ML service; network failures become a 503 the error middleware understands. */
const callML = async (method, path, { params, data } = {}) => {
  try {
    const response = await mlClient.request({ method, url: path, params, data });
    return response.data;
  } catch (error) {
    if (error.response) {
      const err = new Error(error.response.data?.detail || `ML service error (${error.response.status})`);
      err.statusCode = error.response.status >= 500 ? 502 : error.response.status;
      throw err;
    }
    throw new AIServiceUnavailableError(error);
  }
};

/**
 * Extracts skill names from free-text job description via the ML NER pipeline.
 * Returns [] when the ML service is down so job creation never depends on it.
 */
const analyzeJobDescription = async (description) => {
  if (!description || !description.trim()) return [];
  try {
    const data = await callML("post", "/analyze-job", { data: { description } });
    return Array.isArray(data?.skills) ? data.skills : [];
  } catch (error) {
    console.warn(`AI skill extraction skipped: ${error.message}`);
    return [];
  }
};

/** Fills in `skills` from the description when the caller didn't supply any. */
const withExtractedSkills = async (jobData) => {
  const hasSkills = Array.isArray(jobData.skills) && jobData.skills.length > 0;
  if (hasSkills || !jobData.description) return jobData;
  const skills = await analyzeJobDescription(jobData.description);
  return skills.length > 0 ? { ...jobData, skills } : jobData;
};

/**
 * Maps a free-text role to the closest occupation code, then reads that
 * occupation's skills from the ML skill graph. Returns no skills (rather than
 * guessing) when the ML service is unavailable or confidence is too low.
 */
const getRoleSkillsFromML = async (roleText, minConfidence = 0.3) => {
  try {
    const classified = await callML("post", "/job-title/classify", { data: { title_text: roleText } });
    const top = classified?.predictions?.[0];
    if (!top || top.occupation_code === "UNKNOWN" || top.confidence < minConfidence) {
      return { skills: [], occupation: null };
    }
    const graph = await callML("get", `/career-path/${encodeURIComponent(top.occupation_title)}`);
    const skills = (graph?.next_steps || []).filter((s) => s.node_type === "skill").map((s) => s.node);
    return { skills, occupation: top };
  } catch (error) {
    console.warn(`ML role-skill lookup skipped: ${error.message}`);
    return { skills: [], occupation: null };
  }
};

module.exports = { AI_SERVICE_URL, callML, analyzeJobDescription, withExtractedSkills, getRoleSkillsFromML };
