const mongoose  = require("mongoose");
const Schema    = mongoose.Schema

const roleSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  active: {
    type: String,
    enum: ["Y", "N"],
    default: "Y",
  },
});

const Role = mongoose.model("Role", roleSchema)
module.exports = Role