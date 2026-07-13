/**
 * RoleAccess Model
 * Defines what permissions (add/edit/delete) each role has for each feature/module
 * Compatible with Express.js applications
 */

const mongoose = require("mongoose");

const roleAccessSchema = new mongoose.Schema({
  idroles: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role",
    required: true,
  },
  access: {
    type: String,
    required: true,
    trim: true,
    // e.g., "Reports", "Users", "Roles", "Devices", etc.
  },
  add: {
    type: Number,
    enum: [0, 1],
    default: 0,
  },
  edit: {
    type: Number,
    enum: [0, 1],
    default: 0,
  },
  delete: {
    type: Number,
    enum: [0, 1],
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  collection: "rolesaccess",
});

// Create a unique index on (idroles, access) to prevent duplicates
roleAccessSchema.index({ idroles: 1, access: 1 }, { unique: true });

/**
 * Static Methods for RoleAccess Management
 */

roleAccessSchema.statics.getAccessByRole = async function(roleId) {
  try {
    const accesses = await this.find({ idroles: roleId }).select(
      "access add edit delete"
    );
    return accesses;
  } catch (error) {
    throw new Error(`Failed to get role access: ${error.message}`);
  }
};

/**
 * Check if a role has a specific permission
 * @param {ObjectId} roleId - Role ID
 * @param {string} module - Module name (e.g., "Reports")
 * @param {string} action - Action type ('add', 'edit', 'delete')
 */
roleAccessSchema.statics.hasPermission = async function(
  roleId,
  module,
  action
) {
  try {
    const access = await this.findOne({
      idroles: roleId,
      access: module,
    });

    if (!access) {
      return false;
    }

    return access[action] === 1;
  } catch (error) {
    throw new Error(`Failed to check permission: ${error.message}`);
  }
};

/**
 * Update a single permission
 */
roleAccessSchema.statics.updatePermission = async function(
  roleId,
  module,
  permissionData
) {
  try {
    const updated = await this.findOneAndUpdate(
      { idroles: roleId, access: module },
      {
        ...permissionData,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updated) {
      throw new Error("Permission not found");
    }

    return updated;
  } catch (error) {
    throw new Error(`Failed to update permission: ${error.message}`);
  }
};

/**
 * Bulk update permissions for a role
 */
roleAccessSchema.statics.updateBulkPermissions = async function(
  roleId,
  permissions
) {
  try {
    const promises = permissions.map((perm) =>
      this.updatePermission(roleId, perm.access, {
        add: perm.add,
        edit: perm.edit,
        delete: perm.delete,
      })
    );

    const results = await Promise.all(promises);
    return results;
  } catch (error) {
    throw new Error(`Failed to update permissions: ${error.message}`);
  }
};

/**
 * Get all available modules (access types) in the system
 */
roleAccessSchema.statics.getAllModules = async function() {
  try {
    const modules = await this.distinct("access");
    return modules.sort();
  } catch (error) {
    throw new Error(`Failed to get modules: ${error.message}`);
  }
};

/**
 * Delete all permissions for a role (used when deleting a role)
 */
roleAccessSchema.statics.deleteByRole = async function(roleId) {
  try {
    const result = await this.deleteMany({ idroles: roleId });
    return result;
  } catch (error) {
    throw new Error(`Failed to delete role access: ${error.message}`);
  }
};

const RoleAccess = mongoose.model("RoleAccess", roleAccessSchema);
module.exports = RoleAccess;
