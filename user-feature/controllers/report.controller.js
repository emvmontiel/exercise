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
    let path = ''
    req.files.foreach(function(files, index, arr){
      path = path + files.path + ', '
    })
     path = path.substring(0, path.lastIndexOf(', '))
     report.pictures = path
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
