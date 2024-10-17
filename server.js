const express = require('express');
const cors = require('cors');
const employeeRoutes = require('./routes/employeeRoutes');
const { db, bucket } = require('./config/firebaseConfig'); // Import Firestore db and Storage bucket

// Initialize Express app
const app = express();
const PORT = 5000; // Hardcoded port

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
//app.use('/api', employeeRoutes);
app.use('/api', employeeRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Export Firestore db and Storage bucket for use in routes if needed
module.exports = { db, bucket };
