const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  active: {
    type: String,
    default: "Y",
  },
});

module.exports = mongoose.model("Role", roleSchema);