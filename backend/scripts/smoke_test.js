/**
 * API smoke tests covering the security and data-correctness fixes.
 *
 * Run against a LOCAL, seeded database only — it registers throwaway users:
 *   npm run seed && node scripts/seed_institutes_and_states.js
 *   npm run dev            (in another terminal)
 *   npm run test:smoke     (BASE_URL defaults to http://localhost:5000/api)
 *
 * AI-dependent checks are skipped automatically when ml-service isn't running.
 */
const test = require("node:test");
const assert = require("node:assert/strict");

const BASE = (process.env.BASE_URL || "http://localhost:5000/api").replace(/\/+$/, "");

const call = async (method, path, { token, body } = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
};

const login = async (email, password) => {
  const { body } = await call("POST", "/auth/login", { body: { email, password } });
  assert.ok(body.success, `login failed for ${email}: ${body.message}`);
  return body.data.token;
};

test("health check reports a connected database", async () => {
  const { status, body } = await call("GET", "/health");
  assert.equal(status, 200);
  assert.equal(body.database, "connected");
});

test("regex special characters in search do not crash the API", async () => {
  for (const path of ["/jobs?skill=C%2B%2B", "/jobs?role=(", "/courses?skill=C%2B%2B", "/districts/%5B/plan"]) {
    const { status } = await call("GET", path);
    assert.ok(status < 500, `${path} returned ${status}`);
  }
});

test("self-registration can never create an admin", async () => {
  const email = `smoke-${Date.now()}@example.com`;
  const { status, body } = await call("POST", "/auth/register", {
    body: { name: "Smoke", email, password: "secret123", role: "admin" },
  });
  assert.equal(status, 201);
  assert.equal(body.data.user.role, "trainee");
});

test("login is case-insensitive on email", async () => {
  await login("Trainee@Domain.IN", "Trainee@123");
});

test("public stats are available without signing in", async () => {
  const { status, body } = await call("GET", "/public/stats");
  assert.equal(status, 200);
  for (const key of ["totalJobs", "totalCourses", "totalInstitutes", "districtsCovered"]) {
    assert.equal(typeof body.data[key], "number", key);
  }
});

test("course pagination reports totalPages and filters by flag before paging", async () => {
  const all = await call("GET", "/courses?limit=2");
  assert.equal(all.body.pagination.totalPages, Math.ceil(all.body.pagination.total / 2));
  assert.ok(all.body.data.length <= 2);

  const good = await call("GET", "/courses?flag=Good&limit=100");
  assert.ok(good.body.data.every((c) => c.flag === "Good"));
  assert.equal(good.body.data.length, good.body.pagination.total);

  const unassessed = await call("GET", "/courses?flag=unassessed&limit=100");
  assert.ok(unassessed.body.data.every((c) => c.flag === null));
});

test("institute users cannot modify another institute", async () => {
  const token = await login("institute@ksdc.kar.gov.in", "Institute@123");
  const kerala = await call("GET", "/institutes?state=Kerala");
  const otherId = kerala.body.data[0]._id;

  const edit = await call("PUT", `/institutes/${otherId}`, { token, body: { name: "hijacked" } });
  assert.equal(edit.status, 403);

  const post = await call("POST", `/institutes/${otherId}/post-job`, {
    token,
    body: { title: "x", description: "y" },
  });
  assert.equal(post.status, 403);
});

test("AI insights enforce roles and validate input", async (t) => {
  const traineeToken = await login("trainee@domain.in", "Trainee@123");
  const status = await call("GET", "/insights/status", { token: traineeToken });
  if (!status.body.data.available) {
    t.skip("ml-service is not running");
    return;
  }

  const forbidden = await call("GET", "/insights/forecast", { token: traineeToken });
  assert.equal(forbidden.status, 403);

  const adminToken = await login("admin@jobify.gov.in", "Admin@123");
  const invalid = await call("POST", "/insights/district-plan", {
    token: adminToken,
    body: { district: "Pune", budget: -1 },
  });
  assert.equal(invalid.status, 400);

  const extracted = await call("POST", "/insights/extract-skills", {
    token: traineeToken,
    body: { text: "Need a welder familiar with AutoCAD and six sigma" },
  });
  assert.ok(extracted.body.data.skills.includes("AutoCAD"));
});
