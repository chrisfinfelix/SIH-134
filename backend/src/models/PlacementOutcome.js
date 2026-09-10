const mongoose = require("mongoose");

const placementOutcomeSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    placementPercent: {
      type: Number,
      default: 0,
    },
    source: {
      type: String,
      trim: true,
      default: "",
    },
    year: {
      type: Number,
      default: new Date().getFullYear(),
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PlacementOutcome", placementOutcomeSchema);
