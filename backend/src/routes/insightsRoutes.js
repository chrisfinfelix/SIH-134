const express = require("express");
const insights = require("../controllers/insightsController");
const authenticate = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticate);

const analysts = requireRole("admin", "institute", "employer");

// Available to every signed-in role
router.get("/status", insights.getStatus);
router.get("/options", insights.getOptions);
router.get("/career-path/:node", insights.getCareerPath);
router.post("/skill-gap", insights.analyzeSkillGap);
router.post("/extract-skills", insights.extractSkills);
router.post("/classify-title", insights.classifyJobTitle);
router.post("/standardize-skill", insights.standardizeSkill);

// Market intelligence for policy/industry/training stakeholders
router.get("/forecast", analysts, insights.getForecast);
router.get("/trends", analysts, insights.getTrends);
router.get("/curriculum", requireRole("admin", "institute"), insights.getCurriculum);
router.get("/oversupply/:courseId", requireRole("admin", "institute"), insights.getOversupply);
router.post("/district-plan", requireRole("admin"), insights.optimizeDistrictPlan);

module.exports = router;
