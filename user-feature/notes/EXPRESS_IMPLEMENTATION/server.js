/**
 * Express.js Server Setup
 * Complete RBAC system integration example
 * This is your main server file
 */

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

// Import models
const User = require("./models/User");
const Role = require("./models/Role");
const RoleAccess = require("./models/RoleAccess");
const RoleUser = require("./models/RoleUser");
const Token = require("./models/Token");

// Import middleware
const { authenticateToken, tokenRefresh } = require("./middleware/authenticateToken");
const { loadUserPermissions } = require("./middleware/authorizePermission");

// Import routes
const authRoutes = require("./routes/auth");
const protectedRoutes = require("./routes/protected");

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/rbac-system";

// ===========================
// Middleware Setup
// ===========================

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));

// Body parsing
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ===========================
// Database Connection
// ===========================

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });

// ===========================
// Routes Setup
// ===========================

/**
 * Health check endpoint
 */
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Authentication routes (public)
 * POST /auth/login - Login
 * POST /auth/logout - Logout
 * POST /auth/refresh-token - Refresh token
 * GET /auth/me - Get current user
 * GET /auth/permissions - Get user permissions
 */
app.use("/auth", authRoutes);

/**
 * Protected routes (require authentication)
 * Apply token refresh middleware to all protected routes
 */
app.use("/protected", tokenRefresh, protectedRoutes);

/**
 * Admin routes (example)
 * These would require additional role/permission checks
 */
app.post("/admin/roles", authenticateToken, async (req, res) => {
  try {
    const { name, active } = req.body;

    // Verify user has permission to manage roles
    const hasPermission = await RoleUser.userHasPermission(
      req.user.userId,
      "Roles",
      "add"
    );

    if (!hasPermission) {
      return res.status(403).json({
        error: "Permission denied",
        details: "You don't have permission to create roles",
      });
    }

    // Create role
    const role = await Role.createRole({ name, active }, req.user.userId);

    res.status(201).json({
      success: true,
      data: role,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to create role",
      details: error.message,
    });
  }
});

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path,
  });
});

/**
 * Global error handler
 */
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);

  res.status(error.status || 500).json({
    error: error.message || "Internal server error",
    details: process.env.NODE_ENV === "development" ? error.stack : undefined,
  });
});

// ===========================
// Scheduled Tasks
// ===========================

/**
 * Cleanup expired tokens every hour
 */
setInterval(async () => {
  try {
    await Token.cleanupExpiredTokens();
  } catch (error) {
    console.error("Token cleanup error:", error.message);
  }
}, 60 * 60 * 1000); // 1 hour

// ===========================
// Server Startup
// ===========================

const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                   RBAC Express Server                      ║
║                  Server Running Successfully               ║
╠════════════════════════════════════════════════════════════╣
║  Port:        ${PORT}
║  Environment: ${process.env.NODE_ENV || 'development'}
║  Database:    ${MONGODB_URI}
╠════════════════════════════════════════════════════════════╣
║  Endpoints:                                                ║
║  - GET  /health                                            ║
║  - POST /auth/login                                        ║
║  - GET  /auth/me                                           ║
║  - GET  /auth/permissions                                  ║
║  - POST /protected/reports                                 ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    mongoose.connection.close(false, () => {
      console.log("MongoDB connection closed");
      process.exit(0);
    });
  });
});

module.exports = app;
