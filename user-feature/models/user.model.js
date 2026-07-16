const mongoose      = require('mongoose');
const Schema        = mongoose.Schema

const userSchema = new Schema({
        fullname: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },
        cellno: {
            type: String,
            required: true,
            trim: true
        },
        address: {
            type: String
        },
        emailVerified: {
            type: Boolean,
            default: false
        }
    }, { timestamps: true }
)

const User = mongoose.model('User', userSchema)
module.exports = User