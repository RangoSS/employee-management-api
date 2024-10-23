const { db, bucket, admin } = require('../config/firebaseConfig');
const { v4: uuidv4 } = require('uuid');

// Login function
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Authenticate with Firebase using the Admin SDK
        const userCredential = await admin.auth().getUserByEmail(email);
        
        // Note: Password verification should be done on the client-side with Firebase Client SDK
        // Set a cookie with the user ID
        res.cookie('session', userCredential.uid, {
            httpOnly: true,
            maxAge: 5 * 60 * 1000, // 5 minutes
        });

        res.status(200).json({ message: 'Login successful', userId: userCredential.uid });
    } catch (error) {
        console.error('Login error:', error);
        res.status(401).json({ message: 'Login failed', error });
    }
};

// Create an employee
exports.createEmployee = async (req, res) => {
    // Your createEmployee logic...
    res.status(201).json({ message: 'Employee created successfully' });
};

// Update an existing employee
exports.updateEmployee = async (req, res) => {
    // Your updateEmployee logic...
    res.status(200).json({ message: 'Employee updated successfully' });
};

// Delete an employee
exports.deleteEmployee = async (req, res) => {
    // Your deleteEmployee logic...
    res.status(204).json(); // No content
};

// Retrieve all employees
exports.getAllEmployees = async (req, res) => {
    // Your getAllEmployees logic...
    res.status(200).json({ message: 'All employees retrieved successfully' });
};
