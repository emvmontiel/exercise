const path      = require('path');
const multer    = require('multer');

let storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/')
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
            file.mimetype == "image/jpg" ||
            file.mimetype == "image/jpeg" ||
            file.mimetype == "image/png"
        ) {
            cb(null, true)
        } else {
            cb(new Error('Only .jpg, .jpeg, and .png files are allowed!'), false)
        }
    }
})