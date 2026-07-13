/**
 * Authentication Middleware
 * Verifies token and validates user session
 * Use this middleware on all protected routes
 */

const Token = require("../models/Token");
const User = require("../models/User");

/**
 * Authenticate Token Middleware
 * Validates the JWT/token in the request and attaches user info
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Extract token from header
    // Expected format: "Bearer <token>"
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        error: "Access token missing",
        details: "Authorization header with token is required",
      });
    }

    // Validate token
    const tokenDoc = await Token.validateToken(token);

    // Attach user info to request object for use in controllers
    req.user = {
      userId: tokenDoc.userId,
      fullname: tokenDoc.fullname,
      email: tokenDoc.email,
      office: tokenDoc.office,
      image: tokenDoc.image,
      ip: tokenDoc.ip,
    };

    req.token = token;
    req.tokenDoc = tokenDoc;

    next();
  } catch (error) {
    console.error("Authentication error:", error.message);

    if (error.message === "Token has expired") {
      return res.status(401).json({
        error: "Token expired",
        details: "Please login again",
      });
    }

    return res.status(401).json({
      error: "Authentication failed",
      details: error.message,
    });
  }
};

/**
 * Optional Authentication Middleware
 * Same as above but doesn't fail if token is missing
 * Useful for routes that can work with or without authentication
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      // No token provided, continue without user
      req.user = null;
      req.token = null;
      return next();
    }

    // Validate token if provided
    const tokenDoc = await Token.validateToken(token);

    req.user = {
      userId: tokenDoc.userId,
      fullname: tokenDoc.fullname,
      email: tokenDoc.email,
      office: tokenDoc.office,
      image: tokenDoc.image,
      ip: tokenDoc.ip,
    };

    req.token = token;
    req.tokenDoc = tokenDoc;

    next();
  } catch (error) {
    console.error("Optional auth error:", error.message);
    // Even if token validation fails, continue without authentication
    req.user = null;
    req.token = null;
    next();
  }
};

/**
 * Token Refresh Middleware
 * Automatically refreshes token if close to expiration
 * Attach the new token to response headers
 */
const tokenRefresh = async (req, res, next) => {
  try {
    if (!req.tokenDoc) {
      return next();
    }

    const now = new Date();
    const timeUntilExpiry = req.tokenDoc.tkexp - now;
    const oneHour = 60 * 60 * 1000;

    // If less than 1 hour until expiry, refresh it
    if (timeUntilExpiry < oneHour) {
      const refreshedToken = await Token.refreshToken(req.token);

      // Attach new token to response header
      res.set("X-Token-Refreshed", refreshedToken.token);
      req.token = refreshedToken.token;
      req.tokenDoc = refreshedToken;
    }

    next();
  } catch (error) {
    console.error("Token refresh error:", error.message);
    // Don't fail the request if refresh fails
    next();
  }
};

/**
 * Check if user is authenticated before allowing access
 */
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required",
    });
  }
  next();
};

/**
 * Verify token IP address matches current request IP
 * Optional but adds security layer
 */
const verifyTokenIP = (req, res, next) => {
  if (!req.tokenDoc) {
    return next();
  }

  const clientIP = req.ip || req.connection.remoteAddress;

  if (req.tokenDoc.ip && req.tokenDoc.ip !== clientIP) {
    return res.status(403).json({
      error: "IP mismatch",
      details: "Your IP address has changed. Please login again.",
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  tokenRefresh,
  requireAuth,
  verifyTokenIP,
};
