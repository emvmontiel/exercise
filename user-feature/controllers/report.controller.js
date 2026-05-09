const Report = require("../models/report.model");

const submit = (req, res, next) => {
  let report = new Report({
    userId: req.body.userId,
    subject: req.body.subject,
    details: req.body.details,
    location: req.body.location
    // pictures: req.body.pictures,
  });
  if(req.files) {
    report.pictures = req.files.map(file => file.path);
  }
  report.save()
    .then((response) => {
      res.json({
        message: "Report submitted!",
      });
    })
    .catch((error) => {
      res.json({
        message: "An error occurred!",
      });
    });
};

module.exports = { submit };
