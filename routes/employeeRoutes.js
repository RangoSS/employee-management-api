// routes/employeeRoutes.js
const express = require('express');
const multer = require('multer');
const employeeController = require('../controllers/employeeController');

const router = express.Router();
const upload = multer(); // Configure multer as needed

router.post('/employees', upload.single('photo'), employeeController.createEmployee);
router.put('/employees/:employeeId', upload.single('photo'), employeeController.updateEmployee);
router.delete('/employees/:employeeId', employeeController.deleteEmployee);
router.get('/employees/:employeeId', employeeController.getEmployeeById);

module.exports = router;
