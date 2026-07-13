# RBAC System Architecture Diagrams

## 1. Data Model Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                         USER                                │
│  ┌────────────┬──────────────┬──────────┬──────────────┐   │
│  │ _id        │ fullname     │ email    │ password     │   │
│  │ office     │ position     │ active   │ devices[]    │   │
│  └────────────┴──────────────┴──────────┴──────────────┘   │
└──────────────────────────────┬──────────────────────────────┘
                               │ 1:N
                               │
                    ┌──────────┴──────────┐
                    │                     │
                    ▼ N:M                 ▼ 1:N
            ┌──────────────────┐   ┌────────────────┐
            │    ROLEUSER      │   │     TOKEN      │
            ├──────────────────┤   ├────────────────┤
            │ idusers (FK)     │   │ userId (FK)    │
            │ idroles (FK) ────┼─┐ │ token (unique) │
            │ assignedAt       │ │ │ tkexp          │
            │ assignedBy       │ │ │ odate (logout) │
            └──────────────────┘ │ └────────────────┘
                                 │
                                 ▼ N:1
                        ┌──────────────────┐
                        │      ROLE        │
                        ├──────────────────┤
                        │ _id              │
                        │ name (unique)    │
                        │ active           │
                        │ createdAt        │
                        └────────┬─────────┘
                                 │ 1:N
                                 │
                                 ▼
                        ┌──────────────────────┐
                        │   ROLEACCESS        │
                        ├──────────────────────┤
                        │ idroles (FK)         │
                        │ access (module name) │
                        │ add: 0|1             │
                        │ edit: 0|1            │
                        │ delete: 0|1          │
                        └──────────────────────┘
```

## 2. Authentication & Authorization Flow

```
┌──────────────────────────────────────────────────────────────┐
│                        CLIENT                                │
│  Sends: POST /auth/login {email, password}                  │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│                     Express Server                           │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 1. Find user by email                                  │ │
│  │ 2. Verify password                                     │ │
│  │ 3. Create TOKEN document                               │ │
│  │ 4. Return token + user info                            │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│                        CLIENT                                │
│  Receives: { token: "abc123...", user: {...}, roles: [...] }│
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼ (Store token in localStorage/cookie)
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│                  PROTECTED REQUEST                           │
│  GET /protected/reports                                     │
│  Header: Authorization: Bearer abc123...                    │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│              EXPRESS - MIDDLEWARE CHAIN                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 1. authenticateToken()                              │   │
│  │    - Extract token from header                      │   │
│  │    - Validate token exists                          │   │
│  │    - Check not expired                              │   │
│  │    - Check user is active                           │   │
│  │    - Attach req.user = {...}                        │   │
│  └──────────────┬───────────────────────────────────────┘   │
│                 │ ✓ Token valid
│                 ▼
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 2. requirePermission('Reports', 'add')              │   │
│  │    - Check user has role                            │   │
│  │    - Get role's permissions                         │   │
│  │    - Verify 'add' permission exists                 │   │
│  │    - Check permission value == 1                    │   │
│  └──────────────┬───────────────────────────────────────┘   │
│                 │ ✓ Permission granted
│                 ▼
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 3. Route Handler                                    │   │
│  │    - req.user available                            │   │
│  │    - req.permission contains details                │   │
│  │    - Execute business logic                         │   │
│  └──────────────┬───────────────────────────────────────┘   │
└─────────────────┼──────────────────────────────────────────────┘
                  │
                  ▼
         ┌────────────────────┐
         │ Response (200 OK)  │
         │ { success: true }  │
         └────────────────────┘

FAILURE PATHS:
├─ No token → 401 Unauthorized
├─ Invalid token → 401 Unauthorized
├─ Expired token → 401 Token expired
├─ User inactive → 401 User not active
└─ No permission → 403 Permission denied
```

## 3. Permission Check Deep Dive

```
Input: userID, module='Reports', action='add'

Step 1: Get User's Roles
┌─────────────────────────────────┐
│ RoleUser.find({idusers: userID})│
│ Returns: [ {idroles: role1_id}, │
│           {idroles: role2_id} ] │
└─────────────────────────────────┘

Step 2: For Each Role, Check Module Permission
┌──────────────────────────────────────────────────┐
│ For role1_id:                                    │
│  RoleAccess.find({                               │
│    idroles: role1_id,                           │
│    access: 'Reports'                            │
│  })                                              │
│  Returns: {add: 1, edit: 0, delete: 0}          │
│                                                  │
│ For role2_id: (same query)                      │
│  Returns: {add: 0, edit: 1, delete: 1}          │
└──────────────────────────────────────────────────┘

Step 3: Combine Results (ANY role with permission = granted)
┌──────────────────────────────────────────────────┐
│ role1: add=1 ✓  ← At least one role has it      │
│ role2: add=0     ← Not all need it               │
│                                                  │
│ Result: PERMISSION GRANTED                      │
└──────────────────────────────────────────────────┘

MONGODB AGGREGATION PIPELINE:
```
db.roleuser.aggregate([
  { $match: { idusers: ObjectId("...") } },           // User's roles
  { $lookup: { from: "rolesaccess", ... } },          // Get permissions
  { $unwind: "$permissions" },                         // Flatten
  { $match: { "permissions.access": "Reports",        // Filter module
              "permissions.add": 1 } },               // Filter action
  { $group: { _id: null, count: { $sum: 1 } } }      // Count matches
])
```

## 4. Request Flow with Caching (Performance)

```
REQUEST
  │
  ├─ Check Redis Cache (User Permissions)
  │  ├─ HIT: Return cached permissions
  │  └─ MISS: Continue to database
  │
  ├─ Query MongoDB
  │  ├─ Get user's roles
  │  ├─ Get role permissions
  │  └─ Combine results
  │
  ├─ Cache in Redis (1 hour TTL)
  │
  └─ Return to application

Benefits:
- 90%+ cache hit rate in production
- Reduce MongoDB queries by 80%
- Faster permission checks (< 5ms vs 50ms)
```

## 5. Token Lifecycle

```
┌──────────────────────────────────────────────────────┐
│             TOKEN CREATED (at login)                 │
│ - Generated hash: SHA256(day-timestamp)              │
│ - Expiration: Now + 3 hours                          │
│ - Saved to MongoDB                                   │
│ - Returned to client                                 │
└─────────────┬──────────────────────────────────────┘
              │
              ├─ NORMAL USAGE
              │  ├─ Each request: Validate token
              │  ├─ If valid: Process request
              │  ├─ If expired: Return 401
              │  └─ If < 1 hour to expiry: Auto-refresh
              │
              ├─ AUTO-REFRESH (within 1 hour of expiry)
              │  ├─ Extend expiration: Now + 3 hours
              │  ├─ Return new token in header
              │  └─ Update MongoDB
              │
              └─ LOGOUT
                 ├─ Set odate = current time
                 ├─ Set isValid = false
                 └─ Token no longer valid
```

## 6. Typical User Flow

```
┌─────────────────────────────────────┐
│  1. User Opens Application          │
│     No token yet                    │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  2. User Submits Login Form         │
│     email: user@example.com         │
│     password: ****                  │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  3. Server Validates Credentials    │
│     ✓ Email exists                  │
│     ✓ Password matches              │
│     ✓ User is active                │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  4. Token Created & Returned        │
│     Response: { token, roles, ... } │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  5. Client Stores Token             │
│     localStorage/sessionStorage     │
│     or httpOnly cookie              │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  6. User Navigates Application      │
│     Each request: Bearer token      │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  7. Server Validates Token          │
│     ✓ Token exists                  │
│     ✓ Not expired                   │
│     ✓ User active                   │
│     ✓ Grant/Deny permission         │
└────────┬────────────────────────────┘
         │
         ├─ 2.5 hours used
         │  → Auto-refresh token
         │  → New token in response
         │
         └─ User requests logout
            → Set odate
            → Token invalid
            → Redirect to login
```

## 7. Permission Matrix Example

```
ROLES:              MODULES:              ACTIONS:
├─ Admin           ├─ Reports            ├─ add
├─ Manager         ├─ Users              ├─ edit
└─ Guest           ├─ Roles              └─ delete
                   ├─ Devices
                   └─ Transactions

PERMISSION MATRIX (1 = granted, 0 = denied):

                Reports         Users          Roles
         add  edit  del  │  add  edit  del  │  add  edit  del
Admin    1    1    1    │  1    1    1    │  1    1    1
Manager  1    1    0    │  0    0    0    │  0    0    0
Guest    0    0    0    │  0    0    0    │  0    0    0

DATABASE REPRESENTATION (ROLEACCESS):
┌─────────────────────────────────────────────────────┐
│ Role: Admin                                         │
├─────────────────────────────────────────────────────┤
│ { access: 'Reports',     add: 1, edit: 1, del: 1 } │
│ { access: 'Users',       add: 1, edit: 1, del: 1 } │
│ { access: 'Roles',       add: 1, edit: 1, del: 1 } │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Role: Manager                                       │
├─────────────────────────────────────────────────────┤
│ { access: 'Reports',     add: 1, edit: 1, del: 0 } │
│ { access: 'Users',       add: 0, edit: 0, del: 0 } │
│ { access: 'Roles',       add: 0, edit: 0, del: 0 } │
└─────────────────────────────────────────────────────┘
```

## 8. Error Handling Flow

```
REQUEST RECEIVED
  │
  ▼
CHECK AUTHENTICATION
  ├─ Missing token
  │  └─ Return 401 + "Access token missing"
  │
  ├─ Invalid token
  │  └─ Return 401 + "Authentication failed"
  │
  ├─ Expired token
  │  └─ Return 401 + "Token expired - Please login again"
  │
  ├─ User inactive
  │  └─ Return 401 + "User is not active"
  │
  └─ ✓ Token valid
    │
    ▼
    CHECK AUTHORIZATION
      ├─ User has no roles
      │  └─ Return 403 + "Permission denied"
      │
      ├─ Role has no permissions
      │  └─ Return 403 + "Permission denied"
      │
      ├─ Permission not granted
      │  └─ Return 403 + "You don't have permission to {action} {module}"
      │
      └─ ✓ Permission granted
        │
        ▼
        EXECUTE BUSINESS LOGIC
          ├─ Database error
          │  └─ Return 500 + error details
          │
          └─ ✓ Success
            └─ Return 200 + data
```

## 9. Scalability Architecture

```
SIMPLE SETUP (Development):
┌─────────────────────────────────────┐
│ Express Server (Single Instance)    │
│ ├─ Mongoose ODM                     │
│ └─ Direct MongoDB Connection        │
└────────────┬────────────────────────┘
             │
             ▼
       ┌──────────────┐
       │   MongoDB    │
       └──────────────┘

PRODUCTION SETUP (Scalable):
┌────────────────────────────────────────────┐
│ Load Balancer (nginx/HAProxy)              │
└────────────────────────────────────────────┘
             │
      ┌──────┴──────┐
      ▼             ▼
  ┌────────┐    ┌────────┐
  │Express │    │Express │ (Multiple instances)
  │Server1 │    │Server2 │
  └────────┘    └────────┘
      │             │
      └──────┬──────┘
             │
    ┌────────┴────────┐
    ▼                 ▼
┌─────────────┐   ┌─────────────┐
│ Redis Cache │   │  MongoDB    │
│ (Shared)    │   │ (Replica    │
│             │   │  Set)       │
└─────────────┘   └─────────────┘
```

---

These diagrams illustrate the complete RBAC system flow. Reference them when understanding or debugging the implementation.
