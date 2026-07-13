/**
 * Protected Routes Example
 * Demonstrates how to protect routes with permission checks
 * Uses Express Router with RBAC middleware
 */

const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authenticateToken");
const { requirePermission, authAndAuthorize } = require("../middleware/authorizePermission");
const { loadUserPermissions } = require("../middleware/authorizePermission");

/**
 * Apply authentication to all routes in this router
 */
router.use(authenticateToken);
router.use(loadUserPermissions);

/**
 * GET /protected/reports
 * List all reports
 * Any authenticated user can view
 */
router.get("/reports", async (req, res) => {
  try {
    // Simulated report data
    const reports = [
      { id: 1, title: "Report 1", createdBy: "User 1" },
      { id: 2, title: "Report 2", createdBy: "User 2" },
    ];

    res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch reports",
      details: error.message,
    });
  }
});

/**
 * POST /protected/reports
 * Create new report
 * Requires: "Reports" module + "add" permission
 */
router.post("/reports", requirePermission("Reports", "add"), async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        error: "Title and content are required",
      });
    }

    // Simulated report creation
    const newReport = {
      id: Math.random(),
      title,
      content,
      createdBy: req.user.fullname,
      createdAt: new Date(),
    };

    // Log action for audit trail
    console.log(
      `Report created by ${req.user.fullname} (${req.user.userId})`
    );

    res.status(201).json({
      success: true,
      data: newReport,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to create report",
      details: error.message,
    });
  }
});

/**
 * PUT /protected/reports/:id
 * Update report
 * Requires: "Reports" module + "edit" permission
 */
router.put(
  "/reports/:id",
  requirePermission("Reports", "edit"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { title, content } = req.body;

      // Update logic here
      const updatedReport = {
        id,
        title,
        content,
        updatedBy: req.user.fullname,
        updatedAt: new Date(),
      };

      console.log(
        `Report ${id} updated by ${req.user.fullname} (${req.user.userId})`
      );

      res.status(200).json({
        success: true,
        data: updatedReport,
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to update report",
        details: error.message,
      });
    }
  }
);

/**
 * DELETE /protected/reports/:id
 * Delete report
 * Requires: "Reports" module + "delete" permission
 */
router.delete(
  "/reports/:id",
  requirePermission("Reports", "delete"),
  async (req, res) => {
    try {
      const { id } = req.params;

      console.log(
        `Report ${id} deleted by ${req.user.fullname} (${req.user.userId})`
      );

      res.status(200).json({
        success: true,
        message: "Report deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to delete report",
        details: error.message,
      });
    }
  }
);

/**
 * GET /protected/users
 * List users
 * Requires: "Users" module + "add" permission (admin-only typically)
 */
router.get("/users", requirePermission("Users", "add"), async (req, res) => {
  try {
    // Simulated user data
    const users = [
      { id: 1, name: "User 1", email: "user1@example.com" },
      { id: 2, name: "User 2", email: "user2@example.com" },
    ];

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch users",
      details: error.message,
    });
  }
});

/**
 * POST /protected/users
 * Create new user
 * Requires: "Users" module + "add" permission
 */
router.post("/users", requirePermission("Users", "add"), async (req, res) => {
  try {
    const { fullname, email, password } = req.body;

    if (!fullname || !email || !password) {
      return res.status(400).json({
        error: "All fields are required",
      });
    }

    // User creation logic here
    const newUser = {
      id: Math.random(),
      fullname,
      email,
      createdBy: req.user.fullname,
      createdAt: new Date(),
    };

    console.log(
      `User created by ${req.user.fullname} (${req.user.userId})`
    );

    res.status(201).json({
      success: true,
      data: newUser,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to create user",
      details: error.message,
    });
  }
});

/**
 * GET /protected/permissions
 * Get current user's permissions
 * Helper endpoint for frontend to determine UI visibility
 */
router.get("/permissions", (req, res) => {
  try {
    // Format permissions for frontend
    const permissions = {};
    req.permissions.forEach((perm) => {
      permissions[perm.name] = {
        add: perm.ladd === 1,
        edit: perm.ledit === 1,
        delete: perm.ldelete === 1,
      };
    });

    res.status(200).json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to get permissions",
      details: error.message,
    });
  }
});

module.exports = router;
