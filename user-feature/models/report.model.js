const mongoose      = require('mongoose');
const Schema        = mongoose.Schema

const reportSchema = new Schema({
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            default: null
        },
        subject: {
            type: String,
            required: true
        }, 
        details: {
            type: String
        },
        location: {
            type: String
        },
        pictures: [{
            type: String,
            required: false
        }]
    }, { timestamps: true }
)

const Report = mongoose.model('Report', reportSchema)
module.exports = Report