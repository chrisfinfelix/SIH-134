const express = require("express");
const { getDistricts, getDistrictPlan } = require("../controllers/districtController");

const router = express.Router();

router.get("/", getDistricts);
router.get("/:name/plan", getDistrictPlan);

module.exports = router;
