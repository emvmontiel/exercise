const mongoose  = require("mongoose");
const Schema    = mongoose.Schema

const roleAccessSchema = new Schema({
  idroles: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role",
    required: true,
  },
  access: {
    type: String,
    required: true,
  },
  add: {
    type: Number,
    default: 0,
  },
  edit: {
    type: Number,
    default: 0,
  },
  delete: {
    type: Number,
    default: 0,
  },
}, {
  collection: "rolesaccess",
});

roleAccessSchema.index(
  { idroles: 1, access: 1 }, 
  { unique: true }
);

const RoleAccess = mongoose.model("RoleAccess", roleAccessSchema)
module.exports = RoleAccess