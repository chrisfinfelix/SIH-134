const express = require("express");
const {
  getInstitutes,
  getInstituteById,
  createInstitute,
  updateInstitute,
  deleteInstitute,
  getMyInstituteDashboard,
} = require("../controllers/instituteController");
const authenticate = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const router = express.Router();

// Dashboard for logged-in institute user
router.get("/me/dashboard", authenticate, getMyInstituteDashboard);
router.get("/my-dashboard", authenticate, getMyInstituteDashboard);

// Public listings / filtering by state & district
router.get("/", getInstitutes);
router.get("/:id", getInstituteById);

// Protected mutations
router.post("/", authenticate, createInstitute);
router.put("/:id", authenticate, updateInstitute);
router.delete("/:id", authenticate, requireRole("admin"), deleteInstitute);

module.exports = router;
