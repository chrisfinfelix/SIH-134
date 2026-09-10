const express = require("express");
const { getPathways, updateSkills, getSkillGap } = require("../controllers/traineeController");
const authenticate = require("../middleware/authMiddleware");

const router = express.Router();

// Pathways is public (trainees don't need to be logged in to explore)
router.get("/pathways", getPathways);

// Protected trainee skills & gap analysis routes
router.put("/skills", authenticate, updateSkills);
router.get("/skill-gap", authenticate, getSkillGap);

module.exports = router;
