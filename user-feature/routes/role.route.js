const express = require("express");
const router = express.Router();
const roleController = require("../controllers/role.controller");

// Role management
router.post("/", roleController.createRole);
router.get("/", roleController.getRoles);

// Role access permissions
router.post("/access", roleController.createRoleAccess);
router.get("/access", roleController.getRoleAccesses);
router.get("/access/:id", roleController.getRoleAccessById);    // id of RoleAccess model
router.put("/access/:id", roleController.updateRoleAccess);     // id of RoleAccess model
router.delete("/access/:id", roleController.deleteRoleAccess);  // id of RoleUser model

// Role assignment (user-role link)
router.post("/assign", roleController.assignRoleToUser);
router.get("/assignments", roleController.listRoleUsers);
router.delete("/assignments/:id", roleController.removeRoleFromUser);

// User permissions
router.get("/user/:userId/permissions", roleController.getUserPermissions);

// Views
router.get("/user/email/:email/view", roleController.getRoleViewByEmail);

// Role :id routes
router.get("/:id", roleController.getRoleById);
router.put("/:id", roleController.updateRole);
router.delete("/:id", roleController.deleteRole);

module.exports = router;
