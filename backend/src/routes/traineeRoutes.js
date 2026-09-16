const express = require("express");
const {
  getPathways,
  updateSkills,
  getSkillGap,
  updatePreferences,
  getPreferences,
  getMatchedJobs,
} = require("../controllers/traineeController");
const authenticate = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticate, requireRole("trainee", "admin"));

router.get("/pathways", getPathways);
router.put("/skills", updateSkills);
router.get("/skill-gap", getSkillGap);
router.get("/jobs", getMatchedJobs);

router.get("/preferences", getPreferences);
router.put("/preferences", updatePreferences);

module.exports = router;
