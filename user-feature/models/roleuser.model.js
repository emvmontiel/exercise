const mongoose = require("mongoose");

const roleUserSchema = new mongoose.Schema({
  idroles: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role",
    required: true,
  },
  idusers: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

module.exports = mongoose.model("RoleUser", roleUserSchema);