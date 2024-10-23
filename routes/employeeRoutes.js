const express = require('express');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const { 
    createEmployee, 
    updateEmployee, 
    deleteEmployee, 
    getAllEmployees, 
    login 
} = require('../controllers/employeeController'); 
const { checkAuth } = require('../middleware/authMiddleware');

const router = express.Router();
const upload = multer(); // Configure multer

// Middleware to parse cookies
router.use(cookieParser());

// Routes for employee operations
router.post('/login', login); // User login
router.post('/', upload.single('photo'), createEmployee); // Create an employee
router.put('/:employeeId', upload.single('photo'), checkAuth, updateEmployee); // Update an employee
router.delete('/:employeeId', deleteEmployee); // Delete an employee
router.get('/', getAllEmployees); // Retrieve all employees

//router.delete('/:employeeId', checkAuth, deleteEmployee); // Delete an employee
module.exports = router; 
