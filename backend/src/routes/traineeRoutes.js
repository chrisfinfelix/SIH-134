const express = require("express");
const { getPathways } = require("../controllers/traineeController");
const authenticate = require("../middleware/authMiddleware");

const router = express.Router();

// Pathways is public (trainees don't need to be logged in to explore)
router.get("/pathways", getPathways);

module.exports = router;
