/**
 * Authentication Routes
 * Handles login, logout, token refresh
 * Uses Express Router
 */

const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Token = require("../models/Token");
const RoleUser = require("../models/RoleUser");
const { authenticateToken } = require("../middleware/authenticateToken");
const { tokenRefresh } = require("../middleware/authenticateToken");

/**
 * POST /auth/login
 * Login with email and password
 * Returns: token, user info, roles
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password, ipAddress } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password required",
      });
    }

    // Find user by email
    const user = await User.findByEmail(email);

    if (!user || user.active !== 'Y') {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    // IMPORTANT: Verify password using bcrypt
    // const isPasswordValid = await bcrypt.compare(password, user.password);
    // For now, assuming plaintext (NOT RECOMMENDED FOR PRODUCTION)
    if (user.password !== password) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    // Get client IP
    const clientIP = ipAddress || req.ip || req.connection.remoteAddress;

    // Create token
    const token = await Token.createToken(user, clientIP, "email");

    // Get user's roles
    const userRoles = await RoleUser.getUserRoles(user._id);

    return res.status(200).json({
      success: true,
      data: {
        token: token.token,
        user: {
          id: user._id,
          fullname: user.fullname,
          email: user.emailaddress,
          office: user.office,
          image: user.image,
        },
        roles: userRoles.map((r) => ({
          id: r._id,
          name: r.name,
        })),
        expiresAt: token.tkexp,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({
      error: "Login failed",
      details: error.message,
    });
  }
});

/**
 * POST /auth/logout
 * Logout user
 * Requires: authentication
 */
router.post("/logout", authenticateToken, async (req, res) => {
  try {
    // Mark token as logged out
    await Token.logout(req.token);

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error.message);
    return res.status(500).json({
      error: "Logout failed",
      details: error.message,
    });
  }
});

/**
 * POST /auth/refresh-token
 * Refresh authentication token
 * Requires: authentication
 */
router.post("/refresh-token", authenticateToken, async (req, res) => {
  try {
    const refreshedToken = await Token.refreshToken(req.token);

    return res.status(200).json({
      success: true,
      data: {
        token: refreshedToken.token,
        expiresAt: refreshedToken.tkexp,
      },
    });
  } catch (error) {
    console.error("Token refresh error:", error.message);
    return res.status(500).json({
      error: "Token refresh failed",
      details: error.message,
    });
  }
});

/**
 * GET /auth/me
 * Get current user information
 * Requires: authentication
 */
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    const roles = await RoleUser.getUserRoles(user._id);
    const privileges = await RoleUser.getUserPrivileges(user._id);

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          fullname: user.fullname,
          email: user.emailaddress,
          office: user.office,
          position: user.position,
          image: user.image,
        },
        roles: roles.map((r) => ({
          id: r._id,
          name: r.name,
        })),
        permissions: privileges,
      },
    });
  } catch (error) {
    console.error("Get user error:", error.message);
    return res.status(500).json({
      error: "Failed to get user information",
      details: error.message,
    });
  }
});

/**
 * GET /auth/permissions
 * Get current user's permissions
 * Requires: authentication
 */
router.get("/permissions", authenticateToken, async (req, res) => {
  try {
    const privileges = await RoleUser.getUserPrivileges(req.user.userId);

    // Format privileges for frontend
    const permissions = {};
    privileges.forEach((priv) => {
      permissions[priv.name] = {
        add: priv.ladd === 1,
        edit: priv.ledit === 1,
        delete: priv.ldelete === 1,
      };
    });

    return res.status(200).json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    console.error("Get permissions error:", error.message);
    return res.status(500).json({
      error: "Failed to get permissions",
      details: error.message,
    });
  }
});

/**
 * POST /auth/logout-all
 * Logout from all devices/sessions
 * Requires: authentication
 */
router.post("/logout-all", authenticateToken, async (req, res) => {
  try {
    await Token.logoutAll(req.user.userId);

    return res.status(200).json({
      success: true,
      message: "Logged out from all devices",
    });
  } catch (error) {
    console.error("Logout all error:", error.message);
    return res.status(500).json({
      error: "Logout failed",
      details: error.message,
    });
  }
});

module.exports = router;
