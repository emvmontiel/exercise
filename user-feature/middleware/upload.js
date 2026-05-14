const path      = require('path');
const multer    = require('multer');

let storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'pictures/')
    },
    filename: function(req, file, cb) {
        let ext = path.extname(file.originalname)
        cb(null, Date.now() + ext)
    }
})

let upload = multer({
    storage: storage,
    fileFilter: function(req, file, cb) {
        if (
            file.mimetype == "image/jpeg" ||
            file.mimetype == "image/png" ||
            file.mimetype == "application/pdf"
        ) {
            cb(null, true)
        } else {
            // console.log('Only .jpg, .jpeg, .png, and .pdf  files are accepted.')
            cb(new Error("Only .jpg, .jpeg, .png, and .pdf  files are accepted."))
        }
    },
    // limits: {
    //     fileSize: 1024 * 1024 * 2
    // }
})

module.exports = upload