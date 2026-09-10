const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    externalJobId: {
      type: String,
      trim: true,
      default: "",
    },
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
    },
    company: {
      type: String,
      required: [true, "Company is required"],
      trim: true,
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
    source: {
      type: String,
      trim: true,
      default: "",
    },
    postedDate: {
      type: Date,
      default: Date.now,
    },
    salaryRange: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

// Indexes for common filters
jobSchema.index({ district: 1 });
jobSchema.index({ state: 1 });
jobSchema.index({ skills: 1 });

module.exports = mongoose.model("Job", jobSchema);
