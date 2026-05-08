const { response } = require('express')
const Employee = require('../models/employee.model.js')

// declaring a function called index
// shows the entire list of employees
const index = (req, res, next) => {
    Employee.find() // this is a mongoose query; promise
    .then(response => {
        res.json({
            response
        })
    })
    .catch(error => {
        res.json({
            message: 'An error has occured!'
        })
    })
}

// Notes
// node.js is asynchrounous
// asynchronous programming can utilize `async-await` and `promises`

// return a single employee
// declares a function that shows an employee according to the employee id
const show = (req, res, next) => {
    let employeeID = req.body.employeeID
    Employee.findById(employeeID)
    .then(response => {
        res.json({
            response
        })
    })
    .catch(error => {
        res.json({
            message: 'An error has occurred!'
        })
    })
}

// add an employee
// declaring a `store` function that adds an employee to the database
const store = (req, res, next) => {
    let employee = new Employee({
        name: req.body.name, 
        designation: req.body.designation,
        email: req.body.email,
        phone: req.body.phone, 
        age: req.body.age
    })
    employee.save()
    .then(response => {
        res.json({
            message: 'Employee added successfully!'
        })
    })
    .catch(error => {
        res.json({
            message: 'An error has occurred!'
        })
    })
}

// update an employee
// declaring a function that updates employee info by its employee id
const update = (req, res, next) => {
    let employeeID = req.body.employeeID
    let updatedData = {
        name: req.body.name, 
        designation: req.body.designation,
        email: req.body.email,
        phone: req.body.phone, 
        age: req.body.age
    }

    Employee.findByIdAndUpdate(employeeID, {$set: updatedData})
    .then(() => {
        res.json({
            message: 'Employee updated successfully!'
        })
    })
    .catch(error => {
        res.json({
            message: 'An error has occurred!'            
        })
    })
}

// delete an employee
// declaring a function that deletes an employee
const destroy = (req, res, next) => {
    let employeeID = req.body.employeeID
    Employee.findOneAndDelete(employeeID)
    .then(() => {
        res.json({
            message: 'Employee deleted successfully!'
        })
    })
    .catch(error => {
        res.json({
            message: 'An error has occurred!'
        })
    })
}

// export the functions created above
module.exports = {
    index, show, store, update, destroy
}