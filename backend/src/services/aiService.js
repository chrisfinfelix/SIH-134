const axios = require("axios");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

/**
 * Sends a job description to the FastAPI AI service and
 * returns an array of extracted skill names.
 *
 * POST ${AI_SERVICE_URL}/analyze-job
 * Body:   { description: "..." }
 * Expect: { skills: ["React", "Node.js", "AWS"] }
 *
 * If the AI service is unavailable, returns an empty array
 * so the rest of the backend continues working.
 */
const analyzeJobDescription = async (description) => {
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/analyze-job`,
      { description },
      { timeout: 10000 } // 10 second timeout
    );

    const skills = response.data?.skills;
    if (Array.isArray(skills)) {
      return skills;
    }
    return [];
  } catch (error) {
    // AI service is optional for the prototype
    console.warn(`AI service unavailable: ${error.message}`);
    return [];
  }
};

module.exports = { analyzeJobDescription };
