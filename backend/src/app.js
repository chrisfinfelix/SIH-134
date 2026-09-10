require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

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

const notFound = require("./middleware/notFoundMiddleware");
const errorHandler = require("./middleware/errorMiddleware");

// Connect to MongoDB Atlas
connectDB();

const app = express();

// ── Security ───────────────────────────────────────────────
app.use(helmet());

// ── CORS ───────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
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
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/districts", districtRoutes);
app.use("/api/employer", employerRoutes);
app.use("/api/trainee", traineeRoutes);
app.use("/api/institutes", instituteRoutes);
app.use("/api/admin", adminRoutes);

// ── 404 + error handlers ───────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start server ───────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
});

module.exports = app;
