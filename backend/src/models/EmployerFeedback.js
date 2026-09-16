const mongoose = require("mongoose");

// Separate from the government-issued Notification model: this channel carries
// employer course-validation feedback through to the owning institute.
const employerFeedbackSchema = new mongoose.Schema(
  {
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

employerFeedbackSchema.index({ instituteId: 1, read: 1 });

module.exports = mongoose.model("EmployerFeedback", employerFeedbackSchema);
