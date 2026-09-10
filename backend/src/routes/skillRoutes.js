const express = require("express");
const { getSkills, getSkillById, getSkillDemand } = require("../controllers/skillController");

const router = express.Router();

// NOTE: /demand must come before /:id to avoid "demand" being treated as an ID
router.get("/demand", getSkillDemand);
router.get("/", getSkills);
router.get("/:id", getSkillById);

module.exports = router;
