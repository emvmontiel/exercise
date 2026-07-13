/**
 * RoleUser Model
 * Junction table linking users to roles (many-to-many relationship)
 * Compatible with Express.js applications
 */

const mongoose = require("mongoose");

const roleUserSchema = new mongoose.Schema({
  idroles: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role",
    required: true,
  },
  idusers: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  assignedAt: {
    type: Date,
    default: Date.now,
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    // Tracks who assigned this role
  },
});

// Create a unique index to prevent duplicate role assignments
roleUserSchema.index({ idroles: 1, idusers: 1 }, { unique: true });

/**
 * Get all privileges for a user
 * Combines permissions from all roles assigned to user
 */
roleUserSchema.statics.getUserPrivileges = async function(userId) {
  try {
    const result = await this.aggregate([
      {
        $match: {
          idusers: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "rolesaccess",
          localField: "idroles",
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
          ledit: {
            $max: "$privileges.edit", // If any role has permission, user has it
          },
          ladd: {
            $max: "$privileges.add",
          },
          ldelete: {
            $max: "$privileges.delete",
          },
          userid: {
            $first: "$idusers",
          },
          name: {
            $first: "$privileges.access",
          },
        },
      },
      {
        $sort: { name: 1 },
      },
    ]);

    return result;
  } catch (error) {
    throw new Error(`Failed to get user privileges: ${error.message}`);
  }
};

/**
 * Get all roles assigned to a user
 */
roleUserSchema.statics.getUserRoles = async function(userId) {
  try {
    const result = await this.aggregate([
      {
        $match: {
          idusers: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "roles",
          localField: "idroles",
          foreignField: "_id",
          as: "roles",
        },
      },
      {
        $unwind: {
          path: "$roles",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$idusers",
          roles: {
            $push: "$roles",
          },
        },
      },
    ]);

    if (result.length > 0 && result[0].roles.some(r => r)) {
      return result[0].roles.filter(r => r);
    } else {
      return [];
    }
  } catch (error) {
    throw new Error(`Failed to get user roles: ${error.message}`);
  }
};

/**
 * Assign a role to a user
 */
roleUserSchema.statics.assignRoleToUser = async function(
  userId,
  roleId,
  assignedBy
) {
  try {
    // Check if already assigned
    const existing = await this.findOne({
      idusers: userId,
      idroles: roleId,
    });

    if (existing) {
      throw new Error("Role already assigned to user");
    }

    const roleUser = new this({
      idusers: userId,
      idroles: roleId,
      assignedBy: assignedBy,
    });

    const result = await roleUser.save();
    return result;
  } catch (error) {
    throw new Error(`Failed to assign role: ${error.message}`);
  }
};

/**
 * Remove a role from a user
 */
roleUserSchema.statics.removeRoleFromUser = async function(userId, roleId) {
  try {
    const result = await this.findOneAndDelete({
      idusers: userId,
      idroles: roleId,
    });

    if (!result) {
      throw new Error("Role assignment not found");
    }

    return result;
  } catch (error) {
    throw new Error(`Failed to remove role: ${error.message}`);
  }
};

/**
 * Replace all roles for a user with new ones
 */
roleUserSchema.statics.setUserRoles = async function(
  userId,
  roleIds,
  assignedBy
) {
  try {
    // Delete existing roles
    await this.deleteMany({ idusers: userId });

    if (!roleIds || roleIds.length === 0) {
      return [];
    }

    // Insert new roles
    const roleUserData = roleIds.map((roleId) => ({
      idusers: userId,
      idroles: roleId,
      assignedBy: assignedBy,
    }));

    const results = await this.insertMany(roleUserData);
    return results;
  } catch (error) {
    throw new Error(`Failed to set user roles: ${error.message}`);
  }
};

/**
 * Check if user has a specific permission
 * Combines all roles and checks if any role has the permission
 */
roleUserSchema.statics.userHasPermission = async function(
  userId,
  module,
  action
) {
  try {
    const RoleAccess = mongoose.model("RoleAccess");

    const result = await this.aggregate([
      {
        $match: {
          idusers: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "rolesaccess",
          localField: "idroles",
          foreignField: "idroles",
          as: "accesses",
        },
      },
      {
        $unwind: "$accesses",
      },
      {
        $match: {
          "accesses.access": module,
          [`accesses.${action}`]: 1,
        },
      },
    ]);

    return result.length > 0;
  } catch (error) {
    throw new Error(`Failed to check user permission: ${error.message}`);
  }
};

/**
 * Get all users with a specific role
 */
roleUserSchema.statics.getUsersByRole = async function(roleId) {
  try {
    const result = await this.aggregate([
      {
        $match: {
          idroles: new mongoose.Types.ObjectId(roleId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "idusers",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          _id: "$user._id",
          fullname: "$user.fullname",
          emailaddress: "$user.emailaddress",
          assignedAt: "$assignedAt",
        },
      },
    ]);

    return result;
  } catch (error) {
    throw new Error(`Failed to get users by role: ${error.message}`);
  }
};

/**
 * Delete all role assignments for a user (e.g., when deactivating user)
 */
roleUserSchema.statics.deleteUserRoles = async function(userId) {
  try {
    const result = await this.deleteMany({ idusers: userId });
    return result;
  } catch (error) {
    throw new Error(`Failed to delete user roles: ${error.message}`);
  }
};

const RoleUser = mongoose.model("RoleUser", roleUserSchema);
module.exports = RoleUser;
