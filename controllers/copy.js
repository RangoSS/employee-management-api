const { db, bucket, admin } = require('../config/firebaseConfig');
const { v4: uuidv4 } = require('uuid');

// Login function
exports.login = async (req, res) => {
    console.log('in login');
    
    try {
        const { email, password } = req.body; 
        console.log({ body: req.body });
        

        // Authenticate with Firebase using the Admin SDK
        const userCredential = await admin.auth().getUserByEmail(email);
        
        // Note: Password verification should be done on the client-side with Firebase Client SDK
        // Set a cookie with the user ID
        res.cookie('session', userCredential.uid, {
            httpOnly: true,
            maxAge: 5 * 60 * 1000, // 5 minutes
        });
       
        // Log the cookie to the console
        console.log('Set-Cookie:', `session=${userCredential.uid}; HttpOnly; Max-Age=300`);
        res.status(200).json({ message: 'Login successful', userId: userCredential.uid });
    } catch (error) {
        console.error('Login error:', error);
        console.log({ body: req.body });
        console.log('hi there');
        
        res.status(401).json({ message: 'Login failed you', error });
    }
};

// Create an employee
exports.createEmployee = async (req, res) => {
    try {
        const { name, surname, age, idNumber, role } = req.body;
        let photoUrl = '';

        if (req.file) {
            // Generate a unique filename for the uploaded photo
            const fileName = `employees/${uuidv4()}_${req.file.originalname}`;
            const blob = bucket.file(fileName);
            const blobStream = blob.createWriteStream();

            blobStream.on('finish', async () => {
                // Generate a signed URL
                const [signedUrl] = await blob.getSignedUrl({
                    action: 'read',
                    expires: '03-01-2500', // Adjust expiration date as needed
                });

                // The signed URL with access ID, expiration, and signature
                photoUrl = signedUrl;

                // Save employee data to Firestore with the signed URL
                await db.collection('employees').add({
                    name,
                    surname,
                    age,
                    idNumber,
                    role,
                    photoUrl
                });

                // Respond with the employee data including photo URL
                res.status(201).send({
                    message: 'Employee added successfully',
                    employee: {
                        name,
                        surname,
                        age,
                        idNumber,
                        role,
                        photoUrl
                    }
                });
            });

            blobStream.on('error', (err) => {
                console.error('File upload error:', err);
                res.status(500).send({ error: 'Failed to upload photo', details: err.message });
            });

            blobStream.end(req.file.buffer); // Upload the file buffer
        } else {
            // If no photo is uploaded, save employee data without the photo
            await db.collection('employees').add({
                name,
                surname,
                age,
                idNumber,
                role
            });

            res.status(201).send({
                message: 'Employee added successfully without photo',
                employee: {
                    name,
                    surname,
                    age,
                    idNumber,
                    role
                }
            });
        }
    } catch (error) {
        res.status(500).send({ error: 'Failed to add employee', details: error.message });
    }
};


// Update an existing employee
exports.updateEmployee = async (req, res) => {
    try {
        const { employeeId } = req.params; // Employee ID is expected as a URL parameter
        const { name, surname, age, idNumber, role } = req.body;
        let photoUrl = null;

        // Get the current employee document
        const employeeRef = db.collection('employees').doc(employeeId);
        const employeeDoc = await employeeRef.get();

        if (!employeeDoc.exists) {
            return res.status(404).send({ error: 'Employee not found' });
        }

        const employeeData = employeeDoc.data();

        // Check if there's a new photo being uploaded
        if (req.file) {
            // Delete the old photo if it exists
            if (employeeData.photoUrl) {
                const oldFileName = employeeData.photoUrl.split('/').pop(); // Extract the filename
                const oldFile = bucket.file(`employees/${oldFileName}`);
                await oldFile.delete(); // Delete the old photo from storage
            }

            // Generate a unique filename for the new uploaded photo
            const fileName = `employees/${uuidv4()}_${req.file.originalname}`;
            const blob = bucket.file(fileName);
            const blobStream = blob.createWriteStream();

            blobStream.on('finish', async () => {
                // Generate a signed URL for the new photo
                const [signedUrl] = await blob.getSignedUrl({
                    action: 'read',
                    expires: '03-01-2500', // Adjust expiration date as needed
                });

                photoUrl = signedUrl; // Update photoUrl with the new signed URL

                // Update employee data in Firestore
                await employeeRef.update({
                    name,
                    surname,
                    age,
                    idNumber,
                    role,
                    photoUrl
                });

                // Respond with the updated employee data
                res.status(200).send({
                    message: 'Employee updated successfully',
                    employee: {
                        name,
                        surname,
                        age,
                        idNumber,
                        role,
                        photoUrl
                    }
                });
            });

            blobStream.on('error', (err) => {
                console.error('File upload error:', err);
                res.status(500).send({ error: 'Failed to upload new photo', details: err.message });
            });

            blobStream.end(req.file.buffer); // Upload the new file buffer
        } else {
            // Update employee data without changing the photo
            await employeeRef.update({
                name,
                surname,
                age,
                idNumber,
                role
            });

            res.status(200).send({
                message: 'Employee updated successfully without changing the photo',
                employee: {
                    name,
                    surname,
                    age,
                    idNumber,
                    role,
                    photoUrl: employeeData.photoUrl // Return the existing photo URL
                }
            });
        }
    } catch (error) {
        console.error('Error updating employee:', error);
        res.status(500).send({ error: 'Failed to update employee', details: error.message });
    }
};


// Delete an employee
exports.deleteEmployee = async (req, res) => {
    try {
        const { employeeId } = req.params; // Assuming employeeId is passed as a URL parameter

        // Fetch the employee document to get the photo URL
        const employeeRef = db.collection('employees').doc(employeeId);
        const employeeDoc = await employeeRef.get();

        if (!employeeDoc.exists) {
            return res.status(404).send({ error: 'Employee not found' });
        }

        const employeeData = employeeDoc.data();
        const photoUrl = employeeData.photoUrl;

        // If there is a photo URL, delete the photo from Firebase Storage
        if (photoUrl) {
            const fileName = photoUrl.split('/').pop(); // Extract the filename from the URL
            const file = bucket.file(`employees/${fileName}`);

            await file.delete(); // Delete the file from storage
        }

        // Delete the employee document from Firestore
        await employeeRef.delete();

        res.status(200).send({ message: 'Employee deleted successfully' });
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).send({ error: 'Failed to delete employee', details: error.message });
    }
};



// Retrieve all employees
exports.getAllEmployees = async (req, res) => {
    try {
        // Fetch the snapshot of the 'employees' collection from Firestore
        const employeesSnapshot = await db.collection('employees').get();
        
        console.log("Snapshot size:", employeesSnapshot.size);  // Log the size of the snapshot (optional)
        
        const employees = employeesSnapshot.docs.map(doc => {
            const data = doc.data();
            console.log("Employee data:", data);  // Log each employee's data
            return {
                id: doc.id,
                ...data,  // Spread the employee document data
            };
        });

        // If no employees are found, return a 404 response
        if (employees.length === 0) {
            return res.status(404).json({ message: "No employees found" });
        }

        // Respond with the list of employees
        res.status(200).json(employees);
    } catch (error) {
        console.error("Error fetching employees:", error);  // Log any errors that occur
        res.status(500).json({ message: 'Error fetching employees', details: error.message });
    }
};
