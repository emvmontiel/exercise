# Express RBAC Quick Reference Card

## 🚀 Quick Setup (5 minutes)

```bash
# 1. Copy files to your Express project
cp -r EXPRESS_IMPLEMENTATION/* your-app/

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit MONGODB_URI in .env

# 4. Start server
npm run dev

# 5. Run demo
npm run demo
```

## 🔐 Authentication Middleware

```javascript
// Import
const { authenticateToken, tokenRefresh } = require('./middleware/authenticateToken');

// Use on protected routes
router.get('/protected', authenticateToken, handler);

// Available in handler as req.user:
// - userId, fullname, email, office, image, ip
```

## ✅ Authorization Middleware

```javascript
// Import
const { requirePermission, requireRole } = require('./middleware/authorizePermission');

// Require specific permission
router.post('/reports',
  authenticateToken,
  requirePermission('Reports', 'add'),
  handler
);

// Require specific role
router.post('/admin',
  authenticateToken,
  requireRole('System Administrator'),
  handler
);

// Multiple permissions
router.post('/complex',
  authenticateToken,
  requirePermissions([
    { module: 'Reports', action: 'add' },
    { module: 'Users', action: 'edit' }
  ]),
  handler
);
```

## 🛣️ Route Pattern

```javascript
const express = require('express');
const { authenticateToken } = require('../middleware/authenticateToken');
const { requirePermission } = require('../middleware/authorizePermission');

const router = express.Router();

// 1. Public route
router.post('/login', async (req, res) => {
  const token = await Token.createToken(user, ipAddress);
  res.json({ token, user });
});

// 2. Authenticated route
router.get('/profile', authenticateToken, async (req, res) => {
  res.json(req.user);
});

// 3. Permission-required route
router.post('/report', 
  authenticateToken,
  requirePermission('Reports', 'add'),
  async (req, res) => {
    // req.user contains user info
    // User definitely has permission
    res.json({ success: true });
  }
);

module.exports = router;
```

## 💾 Model Methods

### Token Model
```javascript
const Token = require('./models/Token');

// Login: Create token
const token = await Token.createToken(user, ipAddress, 'email');

// Validate token
const tokenDoc = await Token.validateToken(tokenString);

// Refresh token (extends expiry)
const refreshed = await Token.refreshToken(tokenString);

// Logout
await Token.logout(tokenString);

// Cleanup expired tokens (run in cron)
await Token.cleanupExpiredTokens();
```

### RoleUser Model
```javascript
const RoleUser = require('./models/RoleUser');

// Get user's all permissions
const privileges = await RoleUser.getUserPrivileges(userId);

// Get user's all roles
const roles = await RoleUser.getUserRoles(userId);

// Check if user has permission
const canAdd = await RoleUser.userHasPermission(userId, 'Reports', 'add');

// Assign role to user
await RoleUser.assignRoleToUser(userId, roleId, assignedById);

// Set all user roles (replaces existing)
await RoleUser.setUserRoles(userId, [roleId1, roleId2], assignedById);
```

### Role Model
```javascript
const Role = require('./models/Role');

// Create role
const role = await Role.createRole({ name: 'Manager', active: 'Y' }, userId);

// Get role's privileges
const privs = await Role.getPrivileges(roleId);

// Set role permissions
await Role.setPermissions(roleId, [
  { access: 'Reports', add: 1, edit: 1, delete: 0 }
], userId);
```

## 📧 Common API Calls

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Response:
# {
#   "success": true,
#   "data": {
#     "token": "abc123...",
#     "user": { "id": "...", "fullname": "...", ... },
#     "expiresAt": "2026-07-10T15:30:00Z"
#   }
# }
```

### Get User Permissions
```bash
curl -X GET http://localhost:3000/auth/permissions \
  -H "Authorization: Bearer abc123..."

# Response:
# {
#   "Reports": { "add": true, "edit": true, "delete": false },
#   "Users": { "add": true, "edit": true, "delete": true }
# }
```

### Create Report (Protected)
```bash
curl -X POST http://localhost:3000/protected/reports \
  -H "Authorization: Bearer abc123..." \
  -H "Content-Type: application/json" \
  -d '{"title": "Q3 Report", "content": "..."}'

# Fails if user lacks "Reports" → "add" permission
```

## 🔄 Permission Actions

Every module can have up to 3 permission types:

| Action | Use Case |
|--------|----------|
| `add` | Create/insert new items |
| `edit` | Modify existing items |
| `delete` | Remove items |

## 📋 Common Modules

Pre-configured modules in the system:

- Reports
- Users
- Roles
- Devices
- Transactions

(Add your own by using them in permission checks)

## ⚙️ Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/rbac-system
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000
TOKEN_EXPIRY_HOURS=3
```

## 🧪 Testing

```bash
# Run full demo (creates roles, users, tests login)
npm run demo

# Start development server
npm run dev

# Quick login test
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

## 🐛 Debug Checklist

- [ ] MongoDB is running
- [ ] .env has correct MONGODB_URI
- [ ] Authorization header: `Bearer <token>` (space required)
- [ ] User exists and is active ('Y')
- [ ] User has role assigned
- [ ] Role has permission for requested action
- [ ] Module/action names match exactly
- [ ] Token not expired (3 hour default)

## 🔑 Key File Locations

```
models/
  Token.js              # Auth token management
  RoleUser.js           # User-to-role mapping + permission checks
  Role.js               # Role definitions
  RoleAccess.js         # Permission definitions

middleware/
  authenticateToken.js  # Extracts & validates tokens
  authorizePermission.js # Checks permissions

routes/
  auth.js               # Login, logout, get permissions
  protected.js          # Example protected endpoints

server.js              # Main Express server setup
```

## 🎯 Common Tasks

### Block Access if No Permission
```javascript
const hasPermission = await RoleUser.userHasPermission(
  userId, 'Reports', 'delete'
);

if (!hasPermission) {
  return res.status(403).json({ error: 'Permission denied' });
}
```

### Get User's Current Permissions
```javascript
const privileges = await RoleUser.getUserPrivileges(userId);
const permissions = {};

privileges.forEach(priv => {
  permissions[priv.name] = {
    add: priv.ladd === 1,
    edit: priv.ledit === 1,
    delete: priv.ldelete === 1
  };
});

res.json(permissions);
```

### Check Multiple Permissions
```javascript
const { requirePermissions } = require('./middleware/authorizePermission');

router.post('/admin',
  requirePermissions([
    { module: 'Users', action: 'edit' },
    { module: 'Roles', action: 'edit' },
    { module: 'Reports', action: 'delete' }
  ]),
  handler
);
```

### Auto-Refresh Tokens
```javascript
const { tokenRefresh } = require('./middleware/authenticateToken');

// Add to protected routes
router.use(authenticateToken, tokenRefresh);

// New token in response header: X-Token-Refreshed
```

## 📞 Support References

- Full Guide: `RBAC_IMPLEMENTATION_GUIDE.md`
- API Reference: `EXPRESS_IMPLEMENTATION/README.md`
- Examples: `EXPRESS_IMPLEMENTATION/example-usage.js`
- Code: `EXPRESS_IMPLEMENTATION/models/` and `middleware/`

---

**Last Updated:** July 10, 2026 | **Version:** 1.0.0
