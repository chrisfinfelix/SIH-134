const express = require("express");
const { getCourses, getCourseById } = require("../controllers/courseController");

const router = express.Router();

router.get("/", getCourses);
router.get("/:id", getCourseById);

module.exports = router;
