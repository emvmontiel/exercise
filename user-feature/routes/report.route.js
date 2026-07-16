const express           = require('express');
const router            = express.Router();
const reportController  = require('../controllers/report.controller');
const upload            = require('../middleware/upload') 

router.post('/', upload.array('pictures[]'), reportController.submitReport);
router.get('/', reportController.getReports);
router.delete("/:id", reportController.deleteReport);

module.exports = router;