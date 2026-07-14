const express        = require("express");
const router         = express.Router();
const userController = require("../controllers/user.controller");

router.post("/", userController.registerUser);
router.get("/", userController.read);

module.exports = router;
