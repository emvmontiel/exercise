const User = require('../models/user.model');

// const register = (req, res, next) => {
//     let user = new User({
//         fullname: req.body.fullname,
//         email: req.body.email,
//         cellno: req.body.cellno,
//         address: req.body.address 
//     })
//     user.save()
//     .then(response => {
//         res.json({
//             message: 'User created successfully!'
//         })
//     })
//     .catch(error => {
//         res.json({
//             message: 'An error occurred!'
//         })
//     })
// }

const registerUser = async (req, res) => {
  try {
    const { fullname, email, cellno, address } = req.body;
    const user = new User({ fullname, email, cellno, address });
    await user.save();
    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    res.status(400).json({ message: 'User creation failed', error: error.message });
  }
};

const read = async (req, res) => {
  try {
    const users = await User.find();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load users', error: error.message });
  }
};

module.exports = { registerUser, read }