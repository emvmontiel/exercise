const Report = require("../models/report.model");

const submit = (req, res, next) => {
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
        message: "Report submitted!",
      });
    })
    .catch((error) => {
      res.status(400).json({
        message: "An error occurred!",
      });
    });
};

module.exports = { submit };
