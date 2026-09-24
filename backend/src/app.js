require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const jobRoutes = require("./routes/jobRoutes");
const skillRoutes = require("./routes/skillRoutes");
const courseRoutes = require("./routes/courseRoutes");
const districtRoutes = require("./routes/districtRoutes");
const employerRoutes = require("./routes/employerRoutes");
const traineeRoutes = require("./routes/traineeRoutes");
const instituteRoutes = require("./routes/instituteRoutes");
const adminRoutes = require("./routes/adminRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const employerFeedbackRoutes = require("./routes/employerFeedbackRoutes");
const publicRoutes = require("./routes/publicRoutes");
const insightsRoutes = require("./routes/insightsRoutes");

const notFound = require("./middleware/notFoundMiddleware");
const errorHandler = require("./middleware/errorMiddleware");

// Connect to MongoDB Atlas
connectDB();

const app = express();

// Render/Vercel sit behind one proxy hop; needed for correct client IPs in rate limiting
app.set("trust proxy", 1);

// ── Security ───────────────────────────────────────────────
app.use(helmet());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, message: "Too many sign-in attempts. Please try again in 15 minutes." },
});

// ── CORS ───────────────────────────────────────────────────
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (no Origin header), e.g. curl/health checks
      if (!origin) return callback(null, true);
      const clean = origin.replace(/\/+$/, "");
      if (
        allowedOrigins.includes(clean) ||
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(clean)
      ) {
        return callback(null, true);
      }
      callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);

// ── Body parsing ───────────────────────────────────────────
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// ── Logging ────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// ── Health check ───────────────────────────────────────────
app.get("/api/health", async (req, res) => {
  const mongoose = require("mongoose");
  const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  res.json({
    success: true,
    message: "Backend is running",
    database: dbStatus,
    environment: process.env.NODE_ENV || "development",
  });
});

// ── Routes ─────────────────────────────────────────────────
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/insights", insightsRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/districts", districtRoutes);
app.use("/api/employer", employerRoutes);
app.use("/api/trainee", traineeRoutes);
app.use("/api/institutes", instituteRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/employer-feedback", employerFeedbackRoutes);

// ── 404 + error handlers ───────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start server ───────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
});

module.exports = app;
