# RBAC System Implementation Guide for Express.js

## Overview

This guide explains how to implement the role-based access control (RBAC) system from your DCR project into an Express.js backend application. The system uses MongoDB/Mongoose for data persistence and implements fine-grained permission tracking.

## System Architecture

### Core Components

1. **Role Model**: Defines user roles (e.g., "System Administrator", "Guest")
   - Properties: `name`, `active`

2. **RoleAccess Model**: Defines what permissions each role has
   - Tracks: `add`, `edit`, `delete` permissions for each module/feature
   - References: Role via `idroles`

3. **RoleUser Model**: Junction table linking users to roles
   - Maps: `idusers` → `idroles` (many-to-many relationship)

4. **Token Model**: Manages authentication and session tracking
   - Handles: User sessions, token generation, expiration, IP tracking
   - Links: User to active sessions with automatic 3-hour expiry

5. **User Model**: Core user data
   - Contains: Authentication, profile, and device information

### Data Flow

```
User Login → Token Created → Token linked to User
    ↓
User's Roles Fetched from RoleUser
    ↓
Roles' Permissions Fetched from RoleAccess
    ↓
Request authorized based on action (add/edit/delete)
```

## Key Features

- **Token-based Authentication**: 3-hour expiry with automatic refresh capability
- **Privilege Aggregation**: Uses MongoDB aggregation pipelines for efficient permission lookup
- **Audit Trail**: Transaction logging (`Translog`) tracks all role/permission changes
- **Multi-role Support**: Users can have multiple roles with combined permissions
- **Permission Granularity**: Separate add/edit/delete permissions per module

## Implementation Steps for Express.js

### Step 1: Set Up Project Structure

```
your-express-app/
├── models/
│   ├── Role.js
│   ├── RoleAccess.js
│   ├── RoleUser.js
│   ├── Token.js
│   ├── User.js
│   └── Translog.js
├── middleware/
│   ├── authenticateToken.js
│   ├── authorizePermission.js
│   └── tokenRefresh.js
├── routes/
│   ├── auth.js
│   ├── users.js
│   ├── roles.js
│   └── protected.js
├── utilities/
│   └── util.js
└── server.js
```

### Step 2: Install Dependencies

```bash
npm install express mongoose dotenv jsonwebtoken cors body-parser
```

### Step 3: Create Models

Create the Mongoose models as shown in the provided files section.

### Step 4: Create Authentication Middleware

Create Express middleware to:
1. Verify tokens in requests
2. Check token expiration
3. Validate IP address (optional)
4. Attach user info to request object

### Step 5: Create Permission Middleware

Create middleware that:
1. Retrieves user's roles
2. Fetches role permissions
3. Validates user has required permission
4. Blocks unauthorized requests

### Step 6: Create Protected Routes

Use middleware to protect routes that require specific permissions.

## Usage Pattern

### In Your Routes

```javascript
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authenticateToken');
const { requirePermission } = require('../middleware/authorizePermission');

// Protect route with authentication
// Then verify specific permission
router.post('/reports/create', 
  authenticateToken, 
  requirePermission('Reports', 'add'),
  async (req, res) => {
    // Your logic here
  }
);
```

### Token Management Flow

1. **On Login**: Create Token document, return token to client
2. **On Each Request**: Middleware validates token and user
3. **On Expiry**: Client can request new token (auto-refresh)
4. **On Logout**: Update token `odate` field with current timestamp

## Best Practices

### For Adapting to Express

1. **Middleware over Custom Methods**: Use Express middleware instead of schema methods for cross-cutting concerns
2. **Separation of Concerns**: Keep models lean, move business logic to services/controllers
3. **Error Handling**: Implement proper Express error handling middleware
4. **Token Validation**: Always validate token expiration before processing
5. **Logging**: Log all permission denials for audit purposes
6. **IP Whitelisting**: Consider storing and validating IP addresses for added security

### Performance Considerations

1. **Cache Permissions**: Consider caching user permissions in Redis for high-traffic scenarios
2. **Batch Operations**: Use aggregation pipelines for complex queries (already implemented)
3. **Index Optimization**: Index frequently queried fields (userId, roleId, token)
4. **Connection Pooling**: Configure Mongoose connection pool appropriately

### Security Considerations

1. **Token Storage**: Store tokens securely (use httpOnly cookies in production)
2. **CORS**: Configure appropriate CORS policies
3. **Rate Limiting**: Implement rate limiting on auth endpoints
4. **Validation**: Always validate role and permission IDs match expected format
5. **Audit Trail**: Log all administrative actions (role creation, permission changes)

## Module/Feature Names

From your system, typical access points are:
- Reports
- Users
- Roles
- Devices
- Transactions
- (Add others as needed in your system)

Each access point can have `add`, `edit`, and `delete` permissions.

## Migration Checklist

- [ ] Set up Express project structure
- [ ] Install required dependencies
- [ ] Copy and adapt Mongoose models
- [ ] Create authentication middleware
- [ ] Create authorization middleware
- [ ] Create protected routes
- [ ] Test token creation and validation
- [ ] Test permission checking
- [ ] Set up token refresh mechanism
- [ ] Configure transaction logging
- [ ] Test role assignment to users
- [ ] Test permission aggregation
- [ ] Implement error handling
- [ ] Set up production environment variables

## References to Implementation Files

See the following files in this directory for:
- **models/**: Complete model implementations ready to use
- **middleware/**: Authentication and authorization middleware
- **routes/**: Example protected route implementations
- **example-usage.js**: End-to-end example showing login, permission check, and request
