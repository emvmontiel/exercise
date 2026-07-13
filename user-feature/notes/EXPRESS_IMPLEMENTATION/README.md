# RBAC System for Express.js

Complete role-based access control (RBAC) implementation for Express.js applications using MongoDB and Mongoose.

## 📋 Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [Migration from Azure Functions](#migration-from-azure-functions)

## 🎯 Overview

This RBAC system provides:

- **Token-based Authentication**: Secure user sessions with automatic 3-hour expiry
- **Fine-grained Permissions**: Control add/edit/delete operations per module
- **Role Management**: Create custom roles with specific permission sets
- **Multi-role Support**: Users can have multiple roles with combined permissions
- **Audit Trail**: Optional transaction logging for compliance
- **Express Router Integration**: Seamless middleware integration

## 🏗️ System Architecture

### Core Models

```
User
  ├── RoleUser (many roles per user)
  │    └── Role
  │         └── RoleAccess (permissions: add/edit/delete)
  └── Token (authentication sessions)
```

### Authentication Flow

```
Login → Create Token → Attach to Request
  ↓
Check Permissions → Execute Action → Log Transaction
  ↓
Response
```

## 📦 Installation

### 1. Prerequisites

- Node.js ≥ 14.0.0
- MongoDB 4.0+
- npm or yarn

### 2. Setup

```bash
# Clone your project
cd your-express-app

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your settings
```

### 3. Install Required Packages

```bash
npm install express mongoose cors body-parser jsonwebtoken bcryptjs dotenv
npm install --save-dev nodemon
```

## ⚙️ Configuration

### Environment Variables (.env)

```env
# Database
MONGODB_URI=mongodb://localhost:27017/rbac-system

# Server
PORT=3000
NODE_ENV=development

# CORS
ALLOWED_ORIGINS=http://localhost:3000

# Token
TOKEN_EXPIRY_HOURS=3
TOKEN_REFRESH_THRESHOLD_HOURS=1
```

### Directory Structure

```
your-app/
├── models/
│   ├── User.js
│   ├── Role.js
│   ├── RoleAccess.js
│   ├── RoleUser.js
│   └── Token.js
├── middleware/
│   ├── authenticateToken.js
│   └── authorizePermission.js
├── routes/
│   ├── auth.js
│   └── protected.js
├── server.js
├── package.json
├── .env
└── .env.example
```

## 🚀 Quick Start

### 1. Start MongoDB

```bash
# Using local MongoDB
mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your MongoDB connection string
```

### 3. Run the Server

```bash
npm run dev
```

### 4. Run the Demo

In another terminal:

```bash
npm run demo
```

This will:
- Create test roles (Admin, Manager, Guest)
- Create test users
- Assign roles to users
- Demonstrate login and permission checking

## 🔌 API Reference

### Authentication Endpoints

#### Login
```
POST /auth/login
Body: { email: string, password: string, ipAddress?: string }
Response: { token, user, roles, expiresAt }
```

#### Get Current User
```
GET /auth/me
Headers: Authorization: Bearer <token>
Response: { user, roles, permissions }
```

#### Get User Permissions
```
GET /auth/permissions
Headers: Authorization: Bearer <token>
Response: { Reports: { add: true, edit: true, delete: false }, ... }
```

#### Refresh Token
```
POST /auth/refresh-token
Headers: Authorization: Bearer <token>
Response: { token, expiresAt }
```

#### Logout
```
POST /auth/logout
Headers: Authorization: Bearer <token>
Response: { success: true }
```

#### Logout All Sessions
```
POST /auth/logout-all
Headers: Authorization: Bearer <token>
Response: { success: true }
```

### Protected Resource Endpoints (Examples)

#### List Reports
```
GET /protected/reports
Headers: Authorization: Bearer <token>
Response: [ { id, title, ... } ]
```

#### Create Report
```
POST /protected/reports
Headers: Authorization: Bearer <token>
Body: { title: string, content: string }
Response: { id, title, content, ... }
Required Permission: Reports → add
```

#### Update Report
```
PUT /protected/reports/:id
Headers: Authorization: Bearer <token>
Body: { title?: string, content?: string }
Required Permission: Reports → edit
```

#### Delete Report
```
DELETE /protected/reports/:id
Headers: Authorization: Bearer <token>
Required Permission: Reports → delete
```

## 💡 Usage Examples

### Basic Express Setup

```javascript
const express = require('express');
const { authenticateToken } = require('./middleware/authenticateToken');
const { requirePermission } = require('./middleware/authorizePermission');

const app = express();

// Public route
app.post('/auth/login', (req, res) => {
  // Login logic
});

// Protected route - requires authentication only
app.get('/profile', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Protected route - requires specific permission
app.post('/reports', 
  authenticateToken,
  requirePermission('Reports', 'add'),
  (req, res) => {
    // Create report logic
  }
);

app.listen(3000);
```

### Middleware Usage

```javascript
// Import middleware
const { authenticateToken, tokenRefresh } = require('./middleware/authenticateToken');
const { requirePermission, requireRole } = require('./middleware/authorizePermission');

const router = express.Router();

// Authentication only
router.get('/profile', authenticateToken, (req, res) => {
  res.json(req.user);
});

// Specific permission required
router.post('/reports',
  authenticateToken,
  requirePermission('Reports', 'add'),
  (req, res) => { /* ... */ }
);

// Specific role required
router.post('/users',
  authenticateToken,
  requireRole('System Administrator'),
  (req, res) => { /* ... */ }
);

// Multiple permissions required
router.post('/admin/config',
  authenticateToken,
  requirePermissions([
    { module: 'Users', action: 'edit' },
    { module: 'Roles', action: 'edit' }
  ]),
  (req, res) => { /* ... */ }
);

// With automatic token refresh
router.use(authenticateToken, tokenRefresh);
```

### Checking Permissions Programmatically

```javascript
const RoleUser = require('./models/RoleUser');

// Check if user has permission
const hasPermission = await RoleUser.userHasPermission(
  userId,
  'Reports',
  'add'
);

if (!hasPermission) {
  return res.status(403).json({ error: 'Permission denied' });
}

// Get user's privileges
const privileges = await RoleUser.getUserPrivileges(userId);

// Get user's roles
const roles = await RoleUser.getUserRoles(userId);
```

### Creating and Managing Roles

```javascript
const Role = require('./models/Role');
const RoleAccess = require('./models/RoleAccess');

// Create a new role
const managerRole = await Role.createRole(
  { name: 'Manager', active: 'Y' },
  adminUserId
);

// Assign permissions to role
await Role.setPermissions(
  managerRole._id,
  [
    { access: 'Reports', add: 1, edit: 1, delete: 0 },
    { access: 'Users', add: 0, edit: 0, delete: 0 }
  ],
  adminUserId
);

// Get role's privileges
const privileges = await Role.getPrivileges(managerRole._id);
```

## 🎓 Best Practices

### Security

1. **Hash Passwords**: Always use bcryptjs for password hashing
   ```javascript
   const bcrypt = require('bcryptjs');
   const hashedPassword = await bcrypt.hash(password, 10);
   ```

2. **Use HTTPS**: Enable HTTPS in production
3. **Validate Inputs**: Always validate user inputs
4. **Rate Limiting**: Implement rate limiting on auth endpoints
5. **CORS**: Configure appropriate CORS policies

### Performance

1. **Cache Permissions**: Consider caching user permissions in Redis
2. **Batch Operations**: Use MongoDB aggregation for complex queries
3. **Index Optimization**: Index frequently queried fields
4. **Connection Pooling**: Configure Mongoose connection pool

### Code Organization

```javascript
// Good: Separate concerns
const router = express.Router();

router.post('/reports',
  authenticateToken,
  requirePermission('Reports', 'add'),
  async (req, res, next) => {
    try {
      // Business logic
    } catch (error) {
      next(error); // Pass to error handler
    }
  }
);

// Bad: Mixed concerns
router.post('/reports', async (req, res) => {
  // Auth check + business logic mixed
});
```

### Error Handling

```javascript
// Create error handler middleware
app.use((error, req, res, next) => {
  console.error(error);
  
  if (error.message.includes('Permission')) {
    return res.status(403).json({ error: error.message });
  }
  
  res.status(500).json({ error: 'Internal server error' });
});
```

## 🔄 Migration from Azure Functions

If migrating from Azure Functions (like your DCR project), use these mappings:

### Function Handlers → Routes

```javascript
// Before (Azure Functions)
app.http('userController', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => { /* ... */ }
});

// After (Express Router)
const router = express.Router();
router.get('/users', authenticateToken, async (req, res) => { /* ... */ });
router.post('/users', authenticateToken, async (req, res) => { /* ... */ });
app.use('/api', router);
```

### Token Validation

```javascript
// Both systems use similar Token model
const token = await Token.validateToken(tokenString);
// Works the same in Express
```

### Permission Checking

```javascript
// Same RoleUser methods work in both
const hasPermission = await RoleUser.userHasPermission(
  userId,
  'Reports',
  'add'
);
```

### Key Differences

| Aspect | Azure Functions | Express |
|--------|---|---|
| Authentication | In handler | Middleware |
| Route Definition | @azure/functions | express.Router() |
| Error Handling | Custom | Express error middleware |
| CORS | Function config | app.use(cors()) |
| Logging | Application Insights | Console/Winston |

## 📝 Module/Feature Names

Common modules in the system (customize as needed):

- **Reports**: Report creation and management
- **Users**: User management
- **Roles**: Role management
- **Devices**: Device tracking
- **Transactions**: Transaction management
- **Settings**: System configuration
- **Analytics**: Analytics and reporting
- **Audit**: Audit trail management

## 🧪 Testing

### Test Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

### Test Protected Route

```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer <your-token>"
```

### Run Demo Script

```bash
npm run demo
```

## 📚 Additional Resources

- [Mongoose Documentation](https://mongoosejs.com/)
- [Express.js Guide](https://expressjs.com/)
- [RBAC Concepts](https://en.wikipedia.org/wiki/Role-based_access_control)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

## 🆘 Troubleshooting

### Token validation fails

```
✗ Check if token is expired (3-hour default)
✗ Verify Authorization header format: "Bearer <token>"
✗ Check if user is still active in database
```

### Permission denied

```
✗ Verify user has role assigned
✗ Check role has required permission
✗ Verify permission module/action names match exactly
```

### MongoDB connection error

```
✗ Ensure MongoDB is running
✗ Check MONGODB_URI in .env
✗ Verify network connectivity
```

## 📄 License

MIT

## 👤 Support

For questions or issues, refer to the main documentation or contact your development team.
