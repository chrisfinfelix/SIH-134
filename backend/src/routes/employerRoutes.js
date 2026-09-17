const express = require("express");
const {
  validateCourse,
  getValidations,
  createDemandSignal,
  getDemandSignals,
  createJobPosting,
  getJobPostings,
  deleteJobPosting,
} = require("../controllers/employerController");
const authenticate = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const router = express.Router();

// All employer routes require authentication + employer role
router.use(authenticate, requireRole("employer"));

router.post("/validate", validateCourse);
router.get("/validations", getValidations);
router.post("/demand-signal", createDemandSignal);
router.get("/demand-signals", getDemandSignals);
router.post("/jobs", createJobPosting);
router.get("/jobs", getJobPostings);
router.delete("/jobs/:id", deleteJobPosting);

module.exports = router;
