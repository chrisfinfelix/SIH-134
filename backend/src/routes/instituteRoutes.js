const express = require("express");
const {
  getInstitutes,
  getInstituteById,
  createInstitute,
  updateInstitute,
  deleteInstitute,
  getMyInstituteDashboard,
  postJob,
} = require("../controllers/instituteController");
const authenticate = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const router = express.Router();

// Dashboard for logged-in institute user
router.get("/me/dashboard", authenticate, requireRole("institute"), getMyInstituteDashboard);
router.get("/my-dashboard", authenticate, requireRole("institute"), getMyInstituteDashboard);

// Public listings / filtering by state & district
router.get("/", getInstitutes);
router.get("/:id", getInstituteById);

// Protected mutations
router.post("/", authenticate, requireRole("institute"), createInstitute);
router.put("/:id", authenticate, requireRole("institute"), updateInstitute);
router.delete("/:id", authenticate, requireRole("admin"), deleteInstitute);
router.post("/:id/post-job", authenticate, requireRole("institute"), postJob);

module.exports = router;
