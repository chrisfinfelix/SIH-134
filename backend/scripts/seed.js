/**
 * Seed script for SIH26134 backend
 * Run: npm run seed
 *
 * What it does:
 * 1. Connects to MongoDB Atlas
 * 2. Clears all seeded collections
 * 3. Inserts skills, jobs, courses
 * 4. Inserts gap scores + recommendations, linked to correct course _id
 * 5. Inserts district plans and placement outcomes
 * 6. Creates a default admin user if one doesn't exist
 *
 * Field mapping (snake_case JSON → camelCase Mongoose):
 *   skill_id          → skillId
 *   skill_name        → skillName
 *   job_id            → externalJobId
 *   posted_date       → postedDate
 *   salary_range      → salaryRange
 *   proficiency_level → proficiencyLevel
 *   course_id         → externalCourseId
 *   course_name       → courseName
 *   nsqf_level        → nsqfLevel
 *   duration_weeks    → durationWeeks
 *   gap_score         → gapScore
 *   matched_skills    → matchedSkills
 *   missing_skills    → missingSkills
 *   demand_count      → demandCount
 *   recommendation_text       → recommendationText
 *   suggested_skills_to_add   → suggestedSkillsToAdd
 *   flag_type         → flagType
 *   top_demand_skills → topDemandSkills
 *   oversupplied_courses → oversuppliedCourses
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");

// Models
const Skill = require("../src/models/Skill");
const Job = require("../src/models/Job");
const Course = require("../src/models/Course");
const GapScore = require("../src/models/GapScore");
const Recommendation = require("../src/models/Recommendation");
const DistrictPlan = require("../src/models/DistrictPlan");
const PlacementOutcome = require("../src/models/PlacementOutcome");
const User = require("../src/models/User");

const DATA_DIR = path.join(__dirname, "../data");

function loadJSON(filename) {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) {
    console.warn(`  ⚠  ${filename} not found – skipping`);
    return [];
  }
  return JSON.parse(fs.readFileSync(filepath, "utf8"));
}

async function seed() {
  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI not set in .env");
    process.exit(1);
  }

  console.log("🔗 Connecting to MongoDB Atlas...");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected\n");

  // ── 1. Clear collections ────────────────────────────────────
  console.log("🗑  Clearing collections...");
  await Promise.all([
    Skill.deleteMany({}),
    Job.deleteMany({}),
    Course.deleteMany({}),
    GapScore.deleteMany({}),
    Recommendation.deleteMany({}),
    DistrictPlan.deleteMany({}),
    PlacementOutcome.deleteMany({}),
  ]);
  console.log("   Done\n");

  // ── 2. Skills ───────────────────────────────────────────────
  const rawSkills = loadJSON("skills_master.json");
  const skills = await Skill.insertMany(
    rawSkills.map((s) => ({
      skillId: s.skill_id || "",
      skillName: s.skill_name,
      category: s.category || "General",
    }))
  );
  console.log(`✅ Inserted ${skills.length} skills`);

  // ── 3. Jobs ─────────────────────────────────────────────────
  const rawJobs = loadJSON("jobs.json");
  const jobs = await Job.insertMany(
    rawJobs.map((j) => ({
      externalJobId: j.job_id || "",
      title: j.title,
      company: j.company,
      district: j.district || "",
      state: j.state || "",
      skills: j.skills || [],
      proficiencyLevel: j.proficiency_level || "",
      source: j.source || "",
      postedDate: j.posted_date ? new Date(j.posted_date) : new Date(),
      salaryRange: j.salary_range || "",
      description: j.description || "",
    }))
  );
  console.log(`✅ Inserted ${jobs.length} jobs`);

  // ── 4. Courses ──────────────────────────────────────────────
  const rawCourses = loadJSON("courses.json");
  const courses = await Course.insertMany(
    rawCourses.map((c) => ({
      externalCourseId: c.course_id || "",
      courseName: c.course_name,
      nsqfLevel: c.nsqf_level ?? null,
      sector: c.sector || "",
      skills: c.skills || [],
      proficiencyLevel: c.proficiency_level || "",
      district: c.district || "",
      durationWeeks: c.duration_weeks ?? null,
      provider: c.provider || "",
    }))
  );
  console.log(`✅ Inserted ${courses.length} courses`);

  // Build lookup: externalCourseId → MongoDB _id
  const courseIdMap = {};
  courses.forEach((c) => {
    courseIdMap[c.externalCourseId] = c._id;
  });

  // ── 5. Gap Scores ────────────────────────────────────────────
  const rawGaps = loadJSON("gap_scores.json");
  let gapCount = 0;
  for (const g of rawGaps) {
    const courseMongoId = courseIdMap[g.course_id];
    if (!courseMongoId) {
      console.warn(`  ⚠  Gap score: course_id ${g.course_id} not found – skipping`);
      continue;
    }
    await GapScore.create({
      courseId: courseMongoId,
      gapScore: g.gap_score ?? 0,
      matchedSkills: g.matched_skills || [],
      missingSkills: g.missing_skills || [],
      demandCount: g.demand_count ?? 0,
      flag: g.flag || "",
    });
    gapCount++;
  }
  console.log(`✅ Inserted ${gapCount} gap scores`);

  // ── 6. Recommendations ──────────────────────────────────────
  const rawRecs = loadJSON("recommendations.json");
  let recCount = 0;
  for (const r of rawRecs) {
    const courseMongoId = courseIdMap[r.course_id];
    if (!courseMongoId) {
      console.warn(`  ⚠  Recommendation: course_id ${r.course_id} not found – skipping`);
      continue;
    }
    await Recommendation.create({
      courseId: courseMongoId,
      recommendationText: r.recommendation_text || "",
      flagType: r.flag_type || "",
      suggestedSkillsToAdd: r.suggested_skills_to_add || [],
    });
    recCount++;
  }
  console.log(`✅ Inserted ${recCount} recommendations`);

  // ── 7. District Plans ────────────────────────────────────────
  const rawPlans = loadJSON("district_plans.json");
  const plans = await DistrictPlan.insertMany(
    rawPlans.map((p) => ({
      district: p.district,
      summary: p.summary || "",
      topDemandSkills: p.top_demand_skills || [],
      oversuppliedCourses: p.oversupplied_courses || [],
    }))
  );
  console.log(`✅ Inserted ${plans.length} district plans`);

  // ── 8. Placement Outcomes (mock) ─────────────────────────────
  const placementData = [
    { externalId: "COURSE001", percent: 68, year: 2025 },
    { externalId: "COURSE002", percent: 82, year: 2025 },
    { externalId: "COURSE003", percent: 35, year: 2025 },
    { externalId: "COURSE004", percent: 91, year: 2025 },
    { externalId: "COURSE005", percent: 59, year: 2025 },
  ];

  let poCount = 0;
  for (const p of placementData) {
    const courseMongoId = courseIdMap[p.externalId];
    if (!courseMongoId) continue;
    await PlacementOutcome.create({
      courseId: courseMongoId,
      placementPercent: p.percent,
      source: "Mock Data – SIH26134",
      year: p.year,
    });
    poCount++;
  }
  console.log(`✅ Inserted ${poCount} placement outcomes`);

  // ── 9. Default admin user ────────────────────────────────────
  const adminEmail = "admin@sih26134.dev";
  const existing = await User.findOne({ email: adminEmail });
  if (!existing) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash("Admin@1234", salt);
    await User.create({
      name: "Admin",
      email: adminEmail,
      passwordHash,
      role: "admin",
      organization: "SIH26134",
    });
    console.log(`✅ Created default admin: ${adminEmail} / Admin@1234`);
  } else {
    console.log(`ℹ  Admin user already exists – skipping`);
  }

  console.log("\n🎉 Seed complete!");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
