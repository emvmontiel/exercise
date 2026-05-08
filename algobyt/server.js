// April 30, 2026
// 15:54
// https://youtu.be/XczMRjat8P0

const express = require("express"); // framework of node.js
const mongoose = require("mongoose"); // works with mongodb e.g. mongodb connection, creating models, queries, etc.
const morgan = require("morgan");
const bodyParser = require("body-parser");

// importing route in the server.js file
const EmployeeRoute = require('./routes/employee.route')

// 27017 is the default port of mongodb
// testdb is the name of the mongo database
// next line is called the connection string
mongoose.connect("mongodb://localhost:27017/testdb");
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// removed above lines because chattie said these are outdated connection options that are no longer needed
// still need to remove other content related to it

const db = mongoose.connection;

db.on("error", (err) => {
  console.log(err);
});

db.once("open", () => {
  console.log("Database connection established!");
});

// declaring an express app
const app = express();

// using morgan and body parser in our express app
app.use(morgan("dev"));

// if a request body is in a url encoded format, we are still able to use it
// app.use(bodyParser.urlencoded({ extended: true }));

// if a request body is in json format, we are still able to use it
// app.use(bodyParser.json());

// upon research, body parsed is now outdated, here are the following modern ways to use the same functionalities
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// declaring a port for our node.js application; where it will run
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// to run this server, you can run `npm start` on the terminal

app.use('/api/employee', EmployeeRoute)