const User = require('../models/user.model');

const registerUser = async (req, res) => {
  try {
    const { fullname, email, cellno, address, emailVerified } = req.body;
    const user = new User({
      fullname,
      email,
      cellno,
      address,
      emailVerified: typeof emailVerified === 'boolean' ? emailVerified : true,
    });
    await user.save();
    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    res.status(400).json({ message: 'User creation failed', error: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load users', error: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Failed to load user", error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { fullname, email, cellno, address, emailVerified } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { fullname, email, cellno, address, emailVerified },
      { new: true, runValidators: true},
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User updated successfully", user });
  } catch (error) {
    res
      .status(400)
      .json({ message: "User update failed", error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found"});
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'User deletion failed', error: error.message });
  }
};

module.exports = { 
  registerUser, 
  getUsers,
  getUserById,
  updateUser,
  deleteUser
}