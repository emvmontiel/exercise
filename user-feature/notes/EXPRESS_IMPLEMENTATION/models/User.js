/**
 * User Model - Simplified for Express.js
 * Contains core user data
 * Compatible with Express.js applications
 */

const mongoose = require("mongoose");
const crypto = require("crypto");

const OTPSchema = new mongoose.Schema({
  code: {
    type: String,
    default: null,
  },
  otpGenerated: {
    type: Date,
    default: Date.now,
  },
  otpExpiry: {
    type: Date,
    default: function () {
      return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    },
  },
  attempts: {
    type: Number,
    default: 3,
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
});

const userSchema = new mongoose.Schema({
  password: {
    type: String,
    required: true,
    // IMPORTANT: Hash passwords before saving!
  },
  fullname: {
    type: String,
    required: true,
  },
  position: {
    type: String,
    default: "",
  },
  accesslevel: {
    type: Number,
    default: 1,
    // 1 = User, 2 = Admin, etc.
  },
  office: {
    type: String,
    default: "",
  },
  login: {
    type: Date,
    default: Date.now,
  },
  ip: {
    type: String,
    default: "",
  },
  cellno: {
    type: String,
    default: "",
  },
  emailaddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  active: {
    type: String,
    enum: ['Y', 'N'],
    default: "Y",
  },
  remarks: {
    type: String,
    default: "",
  },
  image: {
    type: String,
    default: "",
  },
  signature: {
    type: String,
    default: null,
  },
  address: {
    type: String,
    default: null,
  },
  psid: {
    type: String,
    default: null,
  },
  mlocation: {
    type: String,
    enum: ['Y', 'N'],
    default: "N",
  },
  otp: {
    type: OTPSchema,
    default: () => ({}),
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerifiedDate: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  // Optional: External authentication IDs
  idFb: String,
  googleId: String,
});

/**
 * Static Methods for User Management
 */

/**
 * Create a new user
 */
userSchema.statics.createUser = async function(userData) {
  try {
    // Check if user already exists
    const existing = await this.findOne({
      emailaddress: userData.emailaddress,
    });

    if (existing) {
      throw new Error("Email already registered");
    }

    const newUser = new this(userData);
    // IMPORTANT: Hash password before saving!
    // Use bcrypt: newUser.password = await bcrypt.hash(userData.password, 10);
    const savedUser = await newUser.save();

    return savedUser;
  } catch (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }
};

/**
 * Find user by email
 */
userSchema.statics.findByEmail = async function(email) {
  try {
    const user = await this.findOne({
      emailaddress: email.toLowerCase(),
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  } catch (error) {
    throw error;
  }
};

/**
 * Update user information
 */
userSchema.statics.updateUser = async function(userId, updateData) {
  try {
    const updated = await this.findByIdAndUpdate(
      userId,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );

    if (!updated) {
      throw new Error("User not found");
    }

    return updated;
  } catch (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }
};

/**
 * Deactivate a user
 */
userSchema.statics.deactivateUser = async function(userId) {
  try {
    const updated = await this.findByIdAndUpdate(
      userId,
      { active: 'N', updatedAt: new Date() },
      { new: true }
    );

    if (!updated) {
      throw new Error("User not found");
    }

    return updated;
  } catch (error) {
    throw new Error(`Failed to deactivate user: ${error.message}`);
  }
};

/**
 * Generate and save OTP for user
 */
userSchema.methods.generateOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = {
    code: otp,
    otpGenerated: new Date(),
    otpExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    attempts: 3,
    isUsed: false,
  };
  return otp;
};

/**
 * Verify OTP entered by user
 */
userSchema.methods.verifyOTP = function(otpCode) {
  if (!this.otp || !this.otp.code) {
    throw new Error("No OTP generated");
  }

  if (this.otp.isUsed) {
    throw new Error("OTP already used");
  }

  const now = new Date();
  if (now > this.otp.otpExpiry) {
    throw new Error("OTP expired");
  }

  if (this.otp.attempts <= 0) {
    throw new Error("Too many failed attempts");
  }

  if (this.otp.code !== otpCode) {
    this.otp.attempts--;
    throw new Error("Invalid OTP");
  }

  this.otp.isUsed = true;
  return true;
};

/**
 * Verify email
 */
userSchema.methods.verifyEmail = function() {
  this.emailVerified = true;
  this.emailVerifiedDate = new Date();
};

/**
 * Get user's roles (requires RoleUser model)
 */
userSchema.methods.getRoles = async function() {
  try {
    const RoleUser = mongoose.model("RoleUser");
    const roles = await RoleUser.getUserRoles(this._id);
    return roles;
  } catch (error) {
    throw new Error(`Failed to get user roles: ${error.message}`);
  }
};

/**
 * Get user's privileges (requires RoleUser model)
 */
userSchema.methods.getPrivileges = async function() {
  try {
    const RoleUser = mongoose.model("RoleUser");
    const privileges = await RoleUser.getUserPrivileges(this._id);
    return privileges;
  } catch (error) {
    throw new Error(`Failed to get user privileges: ${error.message}`);
  }
};

/**
 * Check if user has a specific permission
 */
userSchema.methods.hasPermission = async function(module, action) {
  try {
    const RoleUser = mongoose.model("RoleUser");
    const hasPermission = await RoleUser.userHasPermission(
      this._id,
      module,
      action
    );
    return hasPermission;
  } catch (error) {
    throw new Error(`Failed to check permission: ${error.message}`);
  }
};

/**
 * Get all active users
 */
userSchema.statics.getActiveUsers = async function() {
  try {
    const users = await this.find({ active: 'Y' }).select(
      "fullname emailaddress office position image"
    );
    return users;
  } catch (error) {
    throw new Error(`Failed to get active users: ${error.message}`);
  }
};

const User = mongoose.model("User", userSchema);
module.exports = User;
