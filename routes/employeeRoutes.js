const express = require('express');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const { createEmployee, updateEmployee, deleteEmployee, getAllEmployees, login } = require('../controllers/employeeController');
const { checkAuth } = require('../middleware/authMiddleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(cookieParser());
router.post('/login', login);
router.post('/', upload.single('photo'), createEmployee);
router.put('/:employeeId', upload.single('photo'), checkAuth, updateEmployee);
router.delete('/:employeeId', checkAuth, deleteEmployee);
router.get('/', getAllEmployees);

module.exports = router;
