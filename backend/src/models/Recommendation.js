const mongoose = require("mongoose");

const recommendationSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    recommendationText: {
      type: String,
      trim: true,
      default: "",
    },
    // e.g. "curriculum_update", "new_course", "merge"
    flagType: {
      type: String,
      trim: true,
      default: "",
    },
    suggestedSkillsToAdd: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Recommendation", recommendationSchema);
