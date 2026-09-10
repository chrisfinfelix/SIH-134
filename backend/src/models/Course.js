const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    // Maps to course_id from JSON files
    externalCourseId: {
      type: String,
      trim: true,
      default: "",
    },
    courseName: {
      type: String,
      required: [true, "Course name is required"],
      trim: true,
    },
    nsqfLevel: {
      type: Number,
      default: null,
    },
    sector: {
      type: String,
      trim: true,
      default: "",
    },
    // Array of skill name strings e.g. ["React", "Node.js"]
    skills: {
      type: [String],
      default: [],
    },
    proficiencyLevel: {
      type: String,
      trim: true,
      default: "",
    },
    district: {
      type: String,
      trim: true,
      default: "",
    },
    state: {
      type: String,
      trim: true,
      default: "",
    },
    deliveryMode: {
      type: String,
      enum: ["Online", "Offline", "Hybrid"],
      default: "Offline",
    },
    durationWeeks: {
      type: Number,
      default: null,
    },
    provider: {
      type: String,
      trim: true,
      default: "",
    },
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      default: null,
    },
  },
  { timestamps: true }
);

courseSchema.index({ district: 1 });
courseSchema.index({ state: 1 });
courseSchema.index({ deliveryMode: 1 });
courseSchema.index({ sector: 1 });
courseSchema.index({ skills: 1 });

module.exports = mongoose.model("Course", courseSchema);
