const express       = require("express");
const mongoose      = require("mongoose");
const morgan        = require("morgan");

const userRoute     = require("./routes/user.route");
const reportRoute   = require("./routes/report.route");

mongoose.connect("mongodb://localhost:27017/userfeature");
const db = mongoose.connection;

db.once("open", () => {
  console.log("Database connection established!");
});

db.on("error", (err) => {
  console.log(err);
});

const app = express();
 
app.use(express.json());
app.use(morgan("dev"));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.use("/api/user", userRoute);
app.use("/api/report", reportRoute);
