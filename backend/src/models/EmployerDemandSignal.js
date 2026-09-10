const mongoose = require("mongoose");

const employerDemandSignalSchema = new mongoose.Schema(
  {
    // Reference to User._id (employer)
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    company: {
      type: String,
      trim: true,
      default: "",
    },
    sector: {
      type: String,
      trim: true,
      default: "",
    },
    district: {
      type: String,
      trim: true,
      default: "",
    },
    skills: {
      type: [String],
      default: [],
    },
    targetRoles: {
      type: [String],
      default: [],
    },
    hiringCount: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EmployerDemandSignal", employerDemandSignalSchema);
