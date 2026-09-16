const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      default: null,
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["manual", "auto_gap_alert"],
      default: "manual",
    },
    read: {
      type: Boolean,
      default: false,
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ instituteId: 1, read: 1 });
notificationSchema.index({ courseId: 1, type: 1, read: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
