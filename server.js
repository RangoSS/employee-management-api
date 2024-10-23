const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const employeeRoutes = require('./routes/employeeRoutes');

const app = express();
const PORT = 3000; // Hardcoded port

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Use cookie-parser middleware

// Routes
app.use('/api/employees', employeeRoutes);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
