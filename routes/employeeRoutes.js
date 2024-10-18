const express = require('express');
const multer = require('multer');
const { createEmployee, updateEmployee, deleteEmployee, getAllEmployees } = require('../controllers/employeeController');

const router = express.Router();
const upload = multer(); // Configure multer (use memory storage if needed)

// Routes for employee operations
router.post('/', upload.single('photo'), createEmployee); // Create an employee
router.put('/:employeeId', upload.single('photo'), updateEmployee); // Update an employee
router.delete('/:employeeId', deleteEmployee); // Delete an employee
router.get('/', getAllEmployees); // Retrieve all employees

module.exports = router;
