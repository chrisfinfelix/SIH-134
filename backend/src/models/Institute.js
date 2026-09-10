const mongoose = require("mongoose");

const instituteSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Institute name is required"],
      trim: true,
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },
    district: {
      type: String,
      required: [true, "District is required"],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    languages: {
      type: [String],
      default: ["English"],
    },
    totalTrainers: {
      type: Number,
      default: 10,
      min: 0,
    },
    coursesOffered: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    skillsCovered: {
      type: [String],
      default: [],
    },
    contactEmail: {
      type: String,
      trim: true,
      default: "",
    },
    contactPhone: {
      type: String,
      trim: true,
      default: "",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

instituteSchema.index({ state: 1 });
instituteSchema.index({ district: 1 });
instituteSchema.index({ name: 1 });

module.exports = mongoose.model("Institute", instituteSchema);
