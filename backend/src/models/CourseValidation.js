const mongoose = require("mongoose");

const courseValidationSchema = new mongoose.Schema(
  {
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    status: {
      type: String,
      enum: ["approved", "rejected", "needs_update"],
      required: true,
    },
    comment: {
      type: String,
      trim: true,
      default: "",
    },
    validatedSkills: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CourseValidation", courseValidationSchema);
