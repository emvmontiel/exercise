const express        = require('express');
const router         = express.Router();
const roleController = require('../controllers/role.controller');

// Role management
router.post('/', roleController.createRole); // create role
router.get('/', roleController.getRoles); // read role
router.get('/user/:userId/permissions', roleController.getUserPermissions); 
router.get('/:id', roleController.getRoleById); 
router.put('/:id', roleController.updateRole);
router.delete('/:id', roleController.deleteRole);

// Role assignment (user-role link)
router.post('/assign', roleController.assignRoleToUser);
router.get('/assignments', roleController.listRoleUsers);
router.delete('/assignments/:id', roleController.removeRoleFromUser);

// Role access permissions
router.post('/access', roleController.createRoleAccess);
router.get('/access', roleController.getRoleAccesses);
router.get('/access/:id', roleController.getRoleAccessById);
router.put('/access/:id', roleController.updateRoleAccess);
router.delete('/access/:id', roleController.deleteRoleAccess);

// User effective permissions
router.get('/user/:userId/permissions', roleController.getUserPermissions);

module.exports = router;
