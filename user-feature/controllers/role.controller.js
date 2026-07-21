const Role = require("../models/role.model");
const RoleUser = require("../models/roleuser.model");
const RoleAccess = require("../models/roleaccess.model");
const Report = require("../models/report.model");
const User = require("../models/user.model");
const { buildRoleViewData, canAccessRoleView } = require("./role.helper");

const createRole = async (req, res) => {
  try {
    const { name, active = "Y" } = req.body;
    const role = new Role({ name, active });
    await role.save();
    res.status(201).json({ message: "Role created successfully", role });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Role creation failed", error: error.message });
  }
};

const getRoles = async (req, res) => {
  try {
    const roles = await Role.find();
    res.json({ roles });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to load roles", error: error.message });
  }
};

const getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ message: "Role not found" });
    res.json({ role });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Failed to load role", error: error.message });
  }
};

const updateRole = async (req, res) => {
  try {
    const { name, active } = req.body;
    const role = await Role.findByIdAndUpdate(
      req.params.id,
      { name, active },
      { new: true, runValidators: true },
    );
    if (!role) return res.status(404).json({ message: "Role not found" });
    res.json({ message: "Role updated successfully", role });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Role update failed", error: error.message });
  }
};

const deleteRole = async (req, res) => {
  try {
    const role = await Role.findByIdAndDelete(req.params.id);
    if (!role) return res.status(404).json({ message: "Role not found" });
    await RoleUser.deleteMany({ idroles: role._id });
    await RoleAccess.deleteMany({ idroles: role._id });
    res.json({ message: "Role deleted successfully" });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Role deletion failed", error: error.message });
  }
};

const assignRoleToUser = async (req, res) => {
  try {
    const { idroles, idusers } = req.body;
    const assignment = new RoleUser({ idroles, idusers });
    await assignment.save();
    res.status(201).json({ message: "Role assigned to user", assignment });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Role assignment failed", error: error.message });
  }
};

const listRoleUsers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.idroles) filter.idroles = req.query.idroles;
    if (req.query.idusers) filter.idusers = req.query.idusers;
    const assignments = await RoleUser.find(filter)
      .populate("idroles", "name active")
      .populate("idusers", "fullname email");
    res.json({ assignments });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Failed to load role assignments",
        error: error.message,
      });
  }
};

const removeRoleFromUser = async (req, res) => {
  try {
    const assignment = await RoleUser.findByIdAndDelete(req.params.id);
    if (!assignment)
      return res.status(404).json({ message: "Assignment not found" });
    res.json({ message: "Role removed from user" });
  } catch (error) {
    res
      .status(400)
      .json({
        message: "Failed to remove role assignment",
        error: error.message,
      });
  }
};

const createRoleAccess = async (req, res) => {
  try {
    const { idroles, access, add = 0, edit = 0, delete: del = 0 } = req.body;
    const roleAccess = new RoleAccess({
      idroles,
      access,
      add,
      edit,
      delete: del,
    });
    await roleAccess.save();
    res.status(201).json({ message: "Role access created", roleAccess });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Failed to create role access", error: error.message });
  }
};

const getRoleAccesses = async (req, res) => {
  try {
    const filter = {};
    if (req.query.idroles) filter.idroles = req.query.idroles;
    const accesses = await RoleAccess.find(filter).populate("idroles", "name");
    res.json({ accesses });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to load role accesses", error: error.message });
  }
};

const getRoleAccessById = async (req, res) => {
  try {
    const access = await RoleAccess.findById(req.params.id).populate(
      "idroles",
      "name",
    );
    if (!access)
      return res.status(404).json({ message: "Role access not found" });
    res.json({ access });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Failed to load role access", error: error.message });
  }
};

const updateRoleAccess = async (req, res) => {
  try {
    const { access, add, edit, delete: del } = req.body;
    const update = {};
    if (access !== undefined) update.access = access;
    if (add !== undefined) update.add = add;
    if (edit !== undefined) update.edit = edit;
    if (del !== undefined) update.delete = del;

    const roleAccess = await RoleAccess.findByIdAndUpdate(
      req.params.id,
      update,
      {
        new: true,
        runValidators: true,
      },
    );
    if (!roleAccess)
      return res.status(404).json({ message: "Role access not found" });
    res.json({ message: "Role access updated", roleAccess });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Failed to update role access", error: error.message });
  }
};

const deleteRoleAccess = async (req, res) => {
  try {
    const access = await RoleAccess.findByIdAndDelete(req.params.id);
    if (!access)
      return res.status(404).json({ message: "Role access not found" });
    res.json({ message: "Role access deleted" });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Failed to delete role access", error: error.message });
  }
};

const getUserPermissions = async (req, res) => {
  try {
    const userId = req.params.userId;
    const assignments = await RoleUser.find({ idusers: userId }).populate(
      "idroles",
      "name active",
    );
    if (!assignments.length) return res.json({ permissions: [] });

    const roleIds = assignments.map((assignment) => assignment.idroles._id);
    const accesses = await RoleAccess.find({
      idroles: { $in: roleIds },
    }).populate("idroles", "name");

    res.json({ permissions: accesses });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Failed to load user permissions",
        error: error.message,
      });
  }
};

const getRoleView = async (req, res) => {
  try {
    const userId = req.params.userId;
    const assignments = await RoleUser.find({ idusers: userId }).populate(
      "idroles",
      "name active",
    );
    const reports = await Report.find({ userId });
    const payload = buildRoleViewData({
      user: { _id: userId },
      assignments,
      reports,
    });

    res.json(payload);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to load role view", error: error.message });
  }
};

const getRoleViewByEmail = async (req, res) => {
  try {
    const email = req.params.email.toLowerCase();
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!canAccessRoleView(user)) {
      return res.status(403).json({ message: "Email verification required" });
    }

    const assignments = await RoleUser.find({ idusers: user._id }).populate(
      "idroles",
      "name active",
    );
    const reports = await Report.find();
    const payload = buildRoleViewData({ user, assignments, reports });

    res.json(payload);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Failed to load role view by email",
        error: error.message,
      });
  }
};

module.exports = {
  createRole,
  getRoles,
  getRoleById,
  updateRole,
  deleteRole,
  assignRoleToUser,
  listRoleUsers,
  removeRoleFromUser,
  createRoleAccess,
  getRoleAccesses,
  getRoleAccessById,
  updateRoleAccess,
  deleteRoleAccess,
  getUserPermissions,
  getRoleView,
  getRoleViewByEmail,
};
