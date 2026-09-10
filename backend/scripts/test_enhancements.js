const axios = require("axios");

const BASE = "http://localhost:5000/api";

async function testAll() {
  console.log("--- Testing Health ---");
  const health = await axios.get(`${BASE}/health`);
  console.log("Health:", health.data);

  console.log("\n--- Testing Institute Login ---");
  const instLogin = await axios.post(`${BASE}/auth/login`, {
    email: "institute@kitas.kerala.gov.in",
    password: "Institute@123",
  });
  console.log("Institute Login Success:", instLogin.data.success, "Role:", instLogin.data.data.user.role);
  const instToken = instLogin.data.data.token;

  console.log("\n--- Testing Institute Dashboard ---");
  const instDash = await axios.get(`${BASE}/institutes/my-dashboard`, {
    headers: { Authorization: `Bearer ${instToken}` },
  });
  console.log("Institute Dashboard Name:", instDash.data.data.institute.name);
  console.log("Institute Dashboard Market Comparison items:", instDash.data.data.marketComparison.length);
  console.log("AI Alignment Directive present:", !!instDash.data.data.aiRecommendation);

  console.log("\n--- Testing Trainee Login & Multi-State Pathway ---");
  const traineeLogin = await axios.post(`${BASE}/auth/login`, {
    email: "trainee@domain.in",
    password: "Trainee@123",
  });
  const traineeToken = traineeLogin.data.data.token;

  // Save Preferences
  const prefRes = await axios.put(`${BASE}/trainee/preferences`, {
    targetRole: "Full Stack Developer",
    primaryState: "Kerala",
    preferredStates: ["Karnataka", "Tamil Nadu"],
    preferredDeliveryMode: "All",
  }, {
    headers: { Authorization: `Bearer ${traineeToken}` },
  });
  console.log("Updated Trainee Preferences:", prefRes.data.data);

  // Get pathways with multi-state & delivery mode
  const pathRes = await axios.get(`${BASE}/trainee/pathways?targetRole=Full Stack Developer&primaryState=Kerala&preferredStates=Karnataka,Tamil Nadu&deliveryMode=All`, {
    headers: { Authorization: `Bearer ${traineeToken}` },
  });
  console.log("Pathway match %:", pathRes.data.data.matchPercentage);
  console.log("Regional Trending Skills:", pathRes.data.data.regionalTrendingSkills.length);
  console.log("Recommended Courses:", pathRes.data.data.recommendedCourses.length);

  console.log("\n--- Testing Admin States Summary ---");
  const adminLogin = await axios.post(`${BASE}/auth/login`, {
    email: "admin@jobify.gov.in",
    password: "Admin@123",
  });
  const adminToken = adminLogin.data.data.token;

  const statesSummary = await axios.get(`${BASE}/admin/states-summary`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log("Admin States Summary count:", statesSummary.data.data.length);
  console.log("Top States:", statesSummary.data.data.slice(0, 3));

  console.log("\n🎉 ALL BACKEND ENHANCEMENT TESTS PASSED!");
}

testAll().catch(err => {
  console.error("❌ Test failed:", err.response?.data || err.message);
  process.exit(1);
});
