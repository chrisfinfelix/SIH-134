const mongoose = require("mongoose");

const gapScoreSchema = new mongoose.Schema(
  {
    // Reference to Course._id
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    // 0-100, higher = bigger gap
    gapScore: {
      type: Number,
      default: 0,
    },
    matchedSkills: {
      type: [String],
      default: [],
    },
    missingSkills: {
      type: [String],
      default: [],
    },
    demandCount: {
      type: Number,
      default: 0,
    },
    // e.g. "Needs Update", "Good", "Critical"
    flag: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GapScore", gapScoreSchema);
