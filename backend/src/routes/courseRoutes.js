const express = require("express");
const {
  getCourses,
  getCourseById,
  getSectors,
  createCourse,
  updateCourse,
  deleteCourse,
} = require("../controllers/courseController");
const authenticate = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/meta/sectors", getSectors);
router.get("/", getCourses);
router.get("/:id", getCourseById);

router.post("/", authenticate, requireRole("institute", "admin"), createCourse);
router.put("/:id", authenticate, requireRole("institute", "admin"), updateCourse);
router.delete("/:id", authenticate, requireRole("institute", "admin"), deleteCourse);

module.exports = router;
