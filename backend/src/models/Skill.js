const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema(
  {
    skillId: {
      type: String,
      trim: true,
      default: "",
    },
    skillName: {
      type: String,
      required: [true, "Skill name is required"],
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: "General",
    },
    // Alternative names for this skill
    aliases: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Skill", skillSchema);
