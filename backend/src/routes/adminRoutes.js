const express = require("express");
const {
  getStats,
  getSkillDemand,
  getDistrictSummary,
  getRecommendations,
} = require("../controllers/adminController");
const authenticate = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticate, requireRole("admin"));

router.get("/stats", getStats);
router.get("/skill-demand", getSkillDemand);
router.get("/district-summary", getDistrictSummary);
router.get("/recommendations", getRecommendations);

module.exports = router;
