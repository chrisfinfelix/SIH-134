const express = require("express");
const {
  validateCourse,
  getValidations,
  createDemandSignal,
  getDemandSignals,
} = require("../controllers/employerController");
const authenticate = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const router = express.Router();

// All employer routes require authentication + employer role
router.use(authenticate, requireRole("employer", "admin"));

router.post("/validate", validateCourse);
router.get("/validations", getValidations);
router.post("/demand-signal", createDemandSignal);
router.get("/demand-signals", getDemandSignals);

module.exports = router;
