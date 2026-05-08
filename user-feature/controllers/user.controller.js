const User = require('../models/user.model');

const register = (req, res, next) => {
    let user = new User({
        fullname: req.body.fullname,
        email: req.body.email,
        cellno: req.body.cellno,
        address: req.body.address
    })
    user.save()
    .then(response => {
        res.json({
            message: 'User created successfully!'
        })
    })
    .catch(error => {
        res.json({
            message: 'An error occurred!'
        })
    })
}

module.exports = { register }