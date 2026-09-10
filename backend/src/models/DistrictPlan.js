const mongoose = require("mongoose");

const districtPlanSchema = new mongoose.Schema(
  {
    district: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    summary: {
      type: String,
      trim: true,
      default: "",
    },
    topDemandSkills: {
      type: [String],
      default: [],
    },
    oversuppliedCourses: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DistrictPlan", districtPlanSchema);
