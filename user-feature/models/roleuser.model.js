const mongoose  = require("mongoose");
const Schema    = mongoose.Schema

const roleUserSchema = new Schema({
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

roleUserSchema.index(
  { idroles: 1, idusers: 1 }, 
  { unique: true }
);

const RoleUser = mongoose.model("RoleUser", roleUserSchema)
module.exports = RoleUser