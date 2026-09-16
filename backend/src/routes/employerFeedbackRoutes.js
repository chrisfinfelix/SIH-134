const express = require("express");
const { getInstituteFeedback, markFeedbackRead } = require("../controllers/employerFeedbackController");
const authenticate = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticate, requireRole("institute", "admin"));

router.get("/institute/:instituteId", getInstituteFeedback);
router.patch("/:id/read", markFeedbackRead);

module.exports = router;
