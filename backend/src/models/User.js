const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "employer", "trainee", "institute"],
      default: "trainee",
    },
    organization: {
      type: String,
      trim: true,
      default: "",
    },
    skills: {
      type: [String],
      default: [],
    },
    targetRole: {
      type: String,
      trim: true,
      default: "",
    },
    primaryState: {
      type: String,
      trim: true,
      default: "",
    },
    preferredStates: {
      type: [String],
      default: [],
    },
    preferredDeliveryMode: {
      type: String,
      enum: ["All", "Online", "Offline", "Hybrid"],
      default: "All",
    },
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      default: null,
    },
  },
  { timestamps: true }
);

// Never return passwordHash in queries by default
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
