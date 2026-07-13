/**
 * Complete End-to-End RBAC Example
 * Shows the full flow: user creation, role assignment, login, and permission checking
 */

const mongoose = require("mongoose");
const User = require("./models/User");
const Role = require("./models/Role");
const RoleAccess = require("./models/RoleAccess");
const RoleUser = require("./models/RoleUser");
const Token = require("./models/Token");
require("dotenv").config();

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/rbac-demo",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Database connection error:", error.message);
    throw error;
  }
}

// ===========================
// Demo Functions
// ===========================

/**
 * 1. Create roles
 */
async function createRoles() {
  console.log("\n📋 Step 1: Creating Roles...");

  try {
    // Check if roles already exist
    const adminRole = await Role.findOne({ name: "System Administrator" });
    const managerRole = await Role.findOne({ name: "Manager" });
    const guestRole = await Role.findOne({ name: "Guest" });

    if (adminRole && managerRole && guestRole) {
      console.log("✅ Roles already exist");
      return;
    }

    // Create roles
    const admin = await new Role({
      name: "System Administrator",
      active: "Y",
    }).save();

    const manager = await new Role({
      name: "Manager",
      active: "Y",
    }).save();

    const guest = await new Role({
      name: "Guest",
      active: "Y",
    }).save();

    console.log("✅ Roles created successfully");
    console.log("   - System Administrator");
    console.log("   - Manager");
    console.log("   - Guest");

    return { admin, manager, guest };
  } catch (error) {
    console.error("❌ Error creating roles:", error.message);
    throw error;
  }
}

/**
 * 2. Assign permissions to roles
 */
async function assignPermissions() {
  console.log("\n📋 Step 2: Assigning Permissions...");

  try {
    const adminRole = await Role.findOne({ name: "System Administrator" });
    const managerRole = await Role.findOne({ name: "Manager" });

    // Define modules/features in the system
    const modules = ["Reports", "Users", "Roles", "Devices"];

    // Admin has all permissions everywhere
    await RoleAccess.deleteMany({ idroles: adminRole._id });
    const adminPermissions = modules.map((module) => ({
      idroles: adminRole._id,
      access: module,
      add: 1,
      edit: 1,
      delete: 1,
    }));
    await RoleAccess.insertMany(adminPermissions);

    // Manager can add and edit Reports, but not delete
    await RoleAccess.deleteMany({ idroles: managerRole._id });
    const managerPermissions = [
      {
        idroles: managerRole._id,
        access: "Reports",
        add: 1,
        edit: 1,
        delete: 0,
      },
      {
        idroles: managerRole._id,
        access: "Users",
        add: 0,
        edit: 0,
        delete: 0,
      },
      {
        idroles: managerRole._id,
        access: "Roles",
        add: 0,
        edit: 0,
        delete: 0,
      },
      {
        idroles: managerRole._id,
        access: "Devices",
        add: 0,
        edit: 0,
        delete: 0,
      },
    ];
    await RoleAccess.insertMany(managerPermissions);

    console.log("✅ Permissions assigned successfully");
    console.log("   Admin:   All modules (add, edit, delete)");
    console.log("   Manager: Reports (add, edit), Others (view only)");
  } catch (error) {
    console.error("❌ Error assigning permissions:", error.message);
    throw error;
  }
}

/**
 * 3. Create users
 */
async function createUsers() {
  console.log("\n👤 Step 3: Creating Users...");

  try {
    // Delete existing test users
    await User.deleteMany({
      emailaddress: { $in: ["admin@example.com", "manager@example.com"] },
    });

    // Create admin user
    const adminUser = await new User({
      fullname: "System Admin",
      emailaddress: "admin@example.com",
      password: "admin123", // IMPORTANT: Hash this in production!
      office: "Main Office",
      position: "Administrator",
      active: "Y",
    }).save();

    // Create manager user
    const managerUser = await new User({
      fullname: "John Manager",
      emailaddress: "manager@example.com",
      password: "manager123", // IMPORTANT: Hash this in production!
      office: "Reports Office",
      position: "Manager",
      active: "Y",
    }).save();

    console.log("✅ Users created successfully");
    console.log(`   - ${adminUser.fullname} (${adminUser.emailaddress})`);
    console.log(`   - ${managerUser.fullname} (${managerUser.emailaddress})`);

    return { adminUser, managerUser };
  } catch (error) {
    console.error("❌ Error creating users:", error.message);
    throw error;
  }
}

/**
 * 4. Assign roles to users
 */
async function assignRolesToUsers() {
  console.log("\n🔐 Step 4: Assigning Roles to Users...");

  try {
    const adminUser = await User.findOne({ emailaddress: "admin@example.com" });
    const managerUser = await User.findOne({
      emailaddress: "manager@example.com",
    });
    const adminRole = await Role.findOne({ name: "System Administrator" });
    const managerRole = await Role.findOne({ name: "Manager" });

    // Assign roles
    await RoleUser.setUserRoles(adminUser._id, [adminRole._id], adminUser._id);
    await RoleUser.setUserRoles(managerUser._id, [managerRole._id], adminUser._id);

    console.log("✅ Roles assigned successfully");
    console.log(`   - Admin user: System Administrator`);
    console.log(`   - Manager user: Manager`);
  } catch (error) {
    console.error("❌ Error assigning roles:", error.message);
    throw error;
  }
}

/**
 * 5. User login - create token
 */
async function userLogin(email, password) {
  console.log(`\n🔑 Step 5: User Login (${email})...`);

  try {
    const user = await User.findByEmail(email);

    if (user.password !== password) {
      throw new Error("Invalid password");
    }

    const token = await Token.createToken(user, "192.168.1.1", "email");

    console.log("✅ Login successful");
    console.log(`   Token: ${token.token.substring(0, 20)}...`);
    console.log(`   Expires: ${token.tkexp}`);

    return token;
  } catch (error) {
    console.error("❌ Error during login:", error.message);
    throw error;
  }
}

/**
 * 6. Check user permissions
 */
async function checkUserPermissions(userId, email) {
  console.log(`\n✔️  Step 6: Checking User Permissions (${email})...`);

  try {
    // Get user's roles
    const roles = await RoleUser.getUserRoles(userId);
    console.log("   Roles:", roles.map((r) => r.name).join(", "));

    // Get user's privileges
    const privileges = await RoleUser.getUserPrivileges(userId);

    // Check specific permissions
    console.log("\n   Permissions by Module:");
    const modules = ["Reports", "Users", "Roles", "Devices"];

    for (const module of modules) {
      const priv = privileges.find((p) => p._id === module);
      if (priv) {
        console.log(`     ${module}:`);
        console.log(`       - Add:    ${priv.ladd === 1 ? "✓" : "✗"}`);
        console.log(`       - Edit:   ${priv.ledit === 1 ? "✓" : "✗"}`);
        console.log(`       - Delete: ${priv.ldelete === 1 ? "✓" : "✗"}`);
      }
    }

    // Check specific permission
    const canCreateReport = await RoleUser.userHasPermission(
      userId,
      "Reports",
      "add"
    );
    console.log(`\n   Can create Reports? ${canCreateReport ? "✓ YES" : "✗ NO"}`);

    const canDeleteReport = await RoleUser.userHasPermission(
      userId,
      "Reports",
      "delete"
    );
    console.log(`   Can delete Reports? ${canDeleteReport ? "✓ YES" : "✗ NO"}`);

    return privileges;
  } catch (error) {
    console.error("❌ Error checking permissions:", error.message);
    throw error;
  }
}

/**
 * 7. Validate token
 */
async function validateToken(token) {
  console.log(`\n🔍 Step 7: Validating Token...`);

  try {
    const validated = await Token.validateToken(token);
    console.log("✅ Token is valid");
    console.log(`   User: ${validated.fullname}`);
    console.log(`   Email: ${validated.email}`);
    return true;
  } catch (error) {
    console.error("❌ Token validation failed:", error.message);
    return false;
  }
}

/**
 * Run the demo
 */
async function runDemo() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║              RBAC System End-to-End Example                ║
╚════════════════════════════════════════════════════════════╝
  `);

  try {
    // Connect to database
    await connectDB();

    // Run steps
    await createRoles();
    await assignPermissions();
    const { adminUser, managerUser } = await createUsers();
    await assignRolesToUsers();

    // Simulate admin login
    const adminToken = await userLogin("admin@example.com", "admin123");
    await checkUserPermissions(adminUser._id, "admin@example.com");
    await validateToken(adminToken.token);

    // Simulate manager login
    const managerToken = await userLogin("manager@example.com", "manager123");
    await checkUserPermissions(managerUser._id, "manager@example.com");
    await validateToken(managerToken.token);

    console.log(`
╔════════════════════════════════════════════════════════════╗
║                   Demo Completed ✓                        ║
╠════════════════════════════════════════════════════════════╣
║  This example demonstrates:                                ║
║  1. Creating roles (Admin, Manager, Guest)                 ║
║  2. Assigning module permissions to roles                  ║
║  3. Creating users                                         ║
║  4. Linking users to roles                                 ║
║  5. User login and token creation                          ║
║  6. Permission checking and validation                     ║
║  7. Token validation                                       ║
║                                                            ║
║  Use this as a template for your Express app!             ║
╚════════════════════════════════════════════════════════════╝
    `);
  } catch (error) {
    console.error("Demo failed:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\nDatabase disconnected");
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  runDemo();
}

module.exports = {
  createRoles,
  assignPermissions,
  createUsers,
  assignRolesToUsers,
  userLogin,
  checkUserPermissions,
  validateToken,
};
