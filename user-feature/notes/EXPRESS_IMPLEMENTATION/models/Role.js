/**
 * Role Model
 * Defines roles in the system (e.g., Admin, Manager, Guest)
 * Compatible with Express.js applications
 */

const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  active: {
    type: String,
    enum: ['Y', 'N'],
    default: 'Y',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

/**
 * Static Methods for Role Management
 */

roleSchema.statics.createRole = async function(roleData, userId) {
  try {
    // Check if role already exists
    const existingRole = await this.findOne({ name: roleData.name });
    if (existingRole) {
      throw new Error("Role already exists");
    }

    const newRole = new this(roleData);
    const savedRole = await newRole.save();
    
    // Log this action in Translog (if available)
    console.log(`Role created: ${savedRole.name} by user ${userId}`);
    
    return savedRole;
  } catch (error) {
    throw new Error(`Failed to create role: ${error.message}`);
  }
};

roleSchema.statics.updateRole = async function(roleId, roleData, userId) {
  try {
    const role = await this.findById(roleId);
    if (!role) {
      throw new Error("Role not found");
    }

    Object.assign(role, { ...roleData, updatedAt: new Date() });
    const updatedRole = await role.save();
    
    console.log(`Role updated: ${updatedRole.name} by user ${userId}`);
    return updatedRole;
  } catch (error) {
    throw new Error(`Failed to update role: ${error.message}`);
  }
};

roleSchema.statics.deleteRole = async function(roleId, userId) {
  try {
    const role = await this.findByIdAndDelete(roleId);
    if (!role) {
      throw new Error("Role not found");
    }
    
    console.log(`Role deleted: ${role.name} by user ${userId}`);
    return role;
  } catch (error) {
    throw new Error(`Failed to delete role: ${error.message}`);
  }
};

/**
 * Get all privileges for a specific role
 * Uses MongoDB aggregation pipeline for efficiency
 */
roleSchema.statics.getPrivileges = async function(roleId) {
  try {
    const result = await this.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(roleId),
        },
      },
      {
        $lookup: {
          from: "rolesaccess",
          localField: "_id",
          foreignField: "idroles",
          as: "privileges",
        },
      },
      {
        $unwind: "$privileges",
      },
      {
        $group: {
          _id: "$privileges.access",
          edit: { $sum: "$privileges.edit" },
          add: { $sum: "$privileges.add" },
          delete: { $sum: "$privileges.delete" },
          access: { $first: "$privileges.access" },
          idroles: { $first: "$privileges.idroles" },
        },
      },
    ]);

    return result;
  } catch (error) {
    throw new Error(`Failed to get privileges: ${error.message}`);
  }
};

/**
 * Assign permissions to a role
 * Replaces existing permissions with new ones
 */
roleSchema.statics.setPermissions = async function(
  roleId,
  permissions,
  userId
) {
  const RoleAccess = mongoose.model("RoleAccess");
  
  try {
    // Delete existing permissions for this role
    await RoleAccess.deleteMany({ idroles: roleId });

    // Insert new permissions
    const permissionData = permissions.map((perm) => ({
      idroles: roleId,
      access: perm.access,
      add: perm.add || 0,
      edit: perm.edit || 0,
      delete: perm.delete || 0,
    }));

    const result = await RoleAccess.insertMany(permissionData);
    
    console.log(`Permissions set for role ${roleId} by user ${userId}`);
    return result;
  } catch (error) {
    throw new Error(`Failed to set permissions: ${error.message}`);
  }
};

roleSchema.statics.getAllRoles = async function(activeOnly = true) {
  try {
    const query = activeOnly ? { active: 'Y' } : {};
    const roles = await this.find(query).sort({ name: 1 });
    return roles;
  } catch (error) {
    throw new Error(`Failed to fetch roles: ${error.message}`);
  }
};

const Role = mongoose.model("Role", roleSchema);
module.exports = Role;
