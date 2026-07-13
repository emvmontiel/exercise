/**
 * Authorization Middleware
 * Checks if user has required permissions for the requested action
 * Use this after authenticateToken middleware
 */

const RoleUser = require("../models/RoleUser");
const Role = require("../models/Role");
const RoleAccess = require("../models/RoleAccess");

/**
 * Require specific permission
 * @param {string} module - Module/feature name (e.g., "Reports", "Users")
 * @param {string} action - Action type: 'add', 'edit', or 'delete'
 */
const requirePermission = (module, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: "Authentication required",
          details: "Please login first",
        });
      }

      // Validate action parameter
      if (!['add', 'edit', 'delete'].includes(action)) {
        return res.status(400).json({
          error: "Invalid action",
          details: "Action must be 'add', 'edit', or 'delete'",
        });
      }

      // Check if user has the required permission
      const hasPermission = await RoleUser.userHasPermission(
        req.user.userId,
        module,
        action
      );

      if (!hasPermission) {
        return res.status(403).json({
          error: "Permission denied",
          details: `You don't have permission to ${action} ${module}`,
        });
      }

      // Store permission info on request for logging
      req.permission = {
        module,
        action,
        granted: true,
      };

      next();
    } catch (error) {
      console.error("Permission check error:", error.message);
      return res.status(500).json({
        error: "Permission verification failed",
        details: error.message,
      });
    }
  };
};

/**
 * Require any of the specified roles
 * @param {array} roleNames - Array of role names (e.g., ["Admin", "Manager"])
 */
const requireRole = (roleNames) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: "Authentication required",
        });
      }

      // Ensure roleNames is an array
      const roles = Array.isArray(roleNames) ? roleNames : [roleNames];

      // Get user's roles
      const userRoles = await RoleUser.getUserRoles(req.user.userId);
      const userRoleNames = userRoles.map((r) => r.name);

      // Check if user has any of the required roles
      const hasRole = roles.some((roleName) =>
        userRoleNames.includes(roleName)
      );

      if (!hasRole) {
        return res.status(403).json({
          error: "Insufficient privileges",
          details: `Required role(s): ${roles.join(", ")}`,
        });
      }

      req.userRoles = userRoles;
      next();
    } catch (error) {
      console.error("Role check error:", error.message);
      return res.status(500).json({
        error: "Role verification failed",
        details: error.message,
      });
    }
  };
};

/**
 * Require multiple permissions (all must be granted)
 * @param {array} permissions - Array of {module, action} objects
 */
const requirePermissions = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: "Authentication required",
        });
      }

      const results = [];

      for (const perm of permissions) {
        const hasPermission = await RoleUser.userHasPermission(
          req.user.userId,
          perm.module,
          perm.action
        );

        results.push({
          ...perm,
          granted: hasPermission,
        });
      }

      // Check if all permissions are granted
      const allGranted = results.every((r) => r.granted);

      if (!allGranted) {
        const denied = results.filter((r) => !r.granted);
        return res.status(403).json({
          error: "Permission denied",
          details: `Missing permissions: ${denied
            .map((d) => `${d.action} ${d.module}`)
            .join(", ")}`,
        });
      }

      req.permissions = results;
      next();
    } catch (error) {
      console.error("Permissions check error:", error.message);
      return res.status(500).json({
        error: "Permission verification failed",
        details: error.message,
      });
    }
  };
};

/**
 * Get user's all permissions and attach to request
 * Doesn't block request, just provides permission data
 */
const loadUserPermissions = async (req, res, next) => {
  try {
    if (!req.user) {
      req.permissions = [];
      return next();
    }

    const permissions = await RoleUser.getUserPrivileges(req.user.userId);
    req.permissions = permissions;

    next();
  } catch (error) {
    console.error("Load permissions error:", error.message);
    req.permissions = [];
    next();
  }
};

/**
 * Check if user can perform action on a specific resource
 * Useful for checking ownership or resource-level permissions
 */
const requireResourcePermission = (module, action, resourceField = "resourceId") => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: "Authentication required",
        });
      }

      // Check if user has the required permission
      const hasPermission = await RoleUser.userHasPermission(
        req.user.userId,
        module,
        action
      );

      if (!hasPermission) {
        return res.status(403).json({
          error: "Permission denied",
          details: `You don't have permission to ${action} this ${module}`,
        });
      }

      // Optional: Add additional resource ownership check here
      // For example, verify user owns the resource if needed

      next();
    } catch (error) {
      console.error("Resource permission check error:", error.message);
      return res.status(500).json({
        error: "Resource permission verification failed",
        details: error.message,
      });
    }
  };
};

/**
 * Middleware chain helper
 * Combines authentication + permission check in one call
 */
const authAndAuthorize = (module, action) => {
  const { authenticateToken } = require("./authenticateToken");
  return [authenticateToken, requirePermission(module, action)];
};

module.exports = {
  requirePermission,
  requireRole,
  requirePermissions,
  loadUserPermissions,
  requireResourcePermission,
  authAndAuthorize,
};
