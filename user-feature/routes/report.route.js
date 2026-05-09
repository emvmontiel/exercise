const express       = require('express');
const router        = express.Router();

const reportController  = require('../controllers/report.controller');
const upload            = require('../middleware/upload') 

router.post('/submit', upload.array('pictures[]'), reportController.submit);
// router.post('/submit', reportController.submit);

module.exports = router;