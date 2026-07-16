const Report = require("../models/report.model");

const submitReport = (req, res, next) => {
  let report = new Report({
    userId: req.body.userId,
    subject: req.body.subject,
    details: req.body.details,
    location: req.body.location,
    pictures: req.files.map((file) => file.path),
  });
  console.log(req.files);
  report
    .save()
    .then((response) => {
      res.json({
        message: "Report submitted!"
      });
    })
    .catch((error) => {
      res.status(400).json({
        message: "An error occurred!"
      });
    });
  };

const getReports = async (req, res) => {
  try {
    const reports = await Report.find();
    res.json({ reports });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load reports', error: error.message });
  }
};

const deleteReport = async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found"});
    res.json({ message: "Report deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Report deletion failed', error: error.message });
  }
};


module.exports = { submitReport, getReports, deleteReport};
