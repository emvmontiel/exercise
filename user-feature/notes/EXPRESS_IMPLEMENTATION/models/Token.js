/**
 * Token Model
 * Manages user authentication tokens and sessions
 * Compatible with Express.js applications
 */

const mongoose = require("mongoose");
const crypto = require("crypto");

const tokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  fullname: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    default: "",
  },
  office: {
    type: String,
    default: "",
  },
  role: {
    type: String,
    default: null,
  },
  email: {
    type: String,
    default: "",
  },
  ldate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  // Token expiration: 3 hours from login
  tkexp: {
    type: Date,
    required: true,
    default: function () {
      return new Date(this.ldate.getTime() + 3 * 60 * 60 * 1000);
    },
  },
  ip: {
    type: String,
    default: null,
  },
  token: {
    type: String,
    required: true,
    unique: true,
    default: generateToken,
  },
  location: {
    type: String,
    default: null,
  },
  tkform: {
    type: String,
    default: null,
    // e.g., "email", "webauthn", "oauth"
  },
  signature: {
    type: String,
    default: "",
  },
  // odate = logout date
  odate: {
    type: Date,
    default: null,
  },
  mlocation: {
    type: String,
    enum: ['Y', 'N'],
    default: "N",
  },
  devices: [
    {
      type: String,
      // Device tokens for push notifications
    }
  ],
  isValid: {
    type: Boolean,
    default: true,
  },
});

/**
 * Generate a unique token using SHA256
 * Format: day-timestamp hashed
 */
function generateToken() {
  const currentDate = new Date();
  const dayOfMonth = currentDate.getDate().toString().padStart(2, "0");
  const timestamp = currentDate.getTime();
  const concatenatedString = `${dayOfMonth}-${timestamp}`;
  const sha256Hash = crypto.createHash("sha256");
  sha256Hash.update(concatenatedString);
  return sha256Hash.digest("hex");
}

/**
 * Static Methods for Token Management
 */

/**
 * Create a new token for a user (on login)
 */
tokenSchema.statics.createToken = async function(userData, ipAddress, tokenForm = "email") {
  try {
    const tokenData = {
      userId: userData._id,
      fullname: userData.fullname,
      email: userData.emailaddress,
      office: userData.office || "",
      image: userData.image || "",
      ip: ipAddress,
      ldate: new Date(),
      tkform: tokenForm,
    };

    const newToken = new this(tokenData);
    const savedToken = await newToken.save();

    return savedToken;
  } catch (error) {
    throw new Error(`Failed to create token: ${error.message}`);
  }
};

/**
 * Validate a token
 * Checks: token exists, not expired, user is valid, token is valid
 */
tokenSchema.statics.validateToken = async function(token) {
  try {
    const tokenDoc = await this.findOne({ token: token }).populate("userId");

    if (!tokenDoc) {
      throw new Error("Token not found");
    }

    if (!tokenDoc.isValid) {
      throw new Error("Token is invalid");
    }

    if (tokenDoc.odate) {
      throw new Error("Token has been logged out");
    }

    const now = new Date();
    if (now > tokenDoc.tkexp) {
      throw new Error("Token has expired");
    }

    if (!tokenDoc.userId || tokenDoc.userId.active !== 'Y') {
      throw new Error("User is not active");
    }

    return tokenDoc;
  } catch (error) {
    throw error;
  }
};

/**
 * Refresh a token (extend expiration)
 */
tokenSchema.statics.refreshToken = async function(token) {
  try {
    const tokenDoc = await this.findOne({ token: token });

    if (!tokenDoc) {
      throw new Error("Token not found");
    }

    // Extend expiration by 3 hours
    tokenDoc.tkexp = new Date(Date.now() + 3 * 60 * 60 * 1000);
    const updated = await tokenDoc.save();

    return updated;
  } catch (error) {
    throw new Error(`Failed to refresh token: ${error.message}`);
  }
};

/**
 * Logout a user by marking token with logout date
 */
tokenSchema.statics.logout = async function(token) {
  try {
    const tokenDoc = await this.findOne({ token: token });

    if (!tokenDoc) {
      throw new Error("Token not found");
    }

    tokenDoc.odate = new Date();
    tokenDoc.isValid = false;
    const updated = await tokenDoc.save();

    return updated;
  } catch (error) {
    throw new Error(`Failed to logout: ${error.message}`);
  }
};

/**
 * Logout all sessions for a user (when password changes)
 */
tokenSchema.statics.logoutAll = async function(userId) {
  try {
    const result = await this.updateMany(
      { userId: userId, odate: null },
      {
        odate: new Date(),
        isValid: false,
      }
    );

    return result;
  } catch (error) {
    throw new Error(`Failed to logout all: ${error.message}`);
  }
};

/**
 * Get active tokens for a user
 */
tokenSchema.statics.getActiveTokens = async function(userId) {
  try {
    const now = new Date();
    const tokens = await this.find({
      userId: userId,
      isValid: true,
      odate: null,
      tkexp: { $gt: now },
    });

    return tokens;
  } catch (error) {
    throw new Error(`Failed to get active tokens: ${error.message}`);
  }
};

/**
 * Clean up expired tokens
 * Run this periodically (e.g., via cron job)
 */
tokenSchema.statics.cleanupExpiredTokens = async function() {
  try {
    const now = new Date();
    const result = await this.deleteMany({
      tkexp: { $lt: now },
    });

    console.log(`Cleaned up ${result.deletedCount} expired tokens`);
    return result;
  } catch (error) {
    throw new Error(`Failed to cleanup tokens: ${error.message}`);
  }
};

/**
 * Add a device token for push notifications
 */
tokenSchema.statics.addDevice = async function(token, deviceToken) {
  try {
    const tokenDoc = await this.findOne({ token: token });

    if (!tokenDoc) {
      throw new Error("Token not found");
    }

    if (!tokenDoc.devices.includes(deviceToken)) {
      tokenDoc.devices.push(deviceToken);
      await tokenDoc.save();
    }

    return tokenDoc;
  } catch (error) {
    throw new Error(`Failed to add device: ${error.message}`);
  }
};

/**
 * Verify token validity and get token document with user info
 */
tokenSchema.statics.getTokenInfo = async function(token) {
  try {
    return await this.validateToken(token);
  } catch (error) {
    throw error;
  }
};

const Token = mongoose.model("Token", tokenSchema);
module.exports = Token;
