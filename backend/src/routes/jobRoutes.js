const express = require("express");
const { getJobs, getJobById, createJob, bulkCreateJobs } = require("../controllers/jobController");
const authenticate = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/", getJobs);
router.get("/:id", getJobById);
router.post("/bulk", authenticate, requireRole("admin"), bulkCreateJobs);
router.post("/", authenticate, requireRole("admin"), createJob);

module.exports = router;
