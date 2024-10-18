const { db } = require('../config/firebaseConfig');
const { v4: uuidv4 } = require('uuid');

// Create an employee
exports.createEmployee = async (req, res) => {
    try {
        const { name, surname, age, idNumber, role } = req.body;
        const employeeId = uuidv4(); // Generate a unique ID
        const employeeData = { name, surname, age, idNumber, role, employeeId };

        // Handle file upload
        let photoUrl = '';
        if (req.file) {
            const blob = bucket.file(`employees/${employeeId}/${req.file.originalname}`);
            const blobStream = blob.createWriteStream({ metadata: { contentType: req.file.mimetype } });

            await new Promise((resolve, reject) => {
                blobStream.on('finish', async () => {
                    photoUrl = await blob.getSignedUrl({ action: 'read', expires: '03-09-2491' });
                    resolve();
                });
                blobStream.on('error', reject);
            });
        }

        employeeData.photoUrl = photoUrl;
        await db.collection('employees').doc(employeeId).set(employeeData);
        res.status(201).json({ message: 'Employee created successfully', employee: employeeData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating employee', error });
    }
};

// Update an existing employee
exports.updateEmployee = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { name, surname, age, idNumber, role } = req.body;
        const employeeRef = db.collection('employees').doc(employeeId);
        const employeeDoc = await employeeRef.get();

        if (!employeeDoc.exists) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const updatedData = { name, surname, age, idNumber, role };

        // Handle file upload for update
        if (req.file) {
            const blob = bucket.file(`employees/${employeeId}/${req.file.originalname}`);
            const blobStream = blob.createWriteStream({ metadata: { contentType: req.file.mimetype } });

            await new Promise((resolve, reject) => {
                blobStream.on('finish', async () => {
                    updatedData.photoUrl = await blob.getSignedUrl({ action: 'read', expires: '03-09-2491' });
                    resolve();
                });
                blobStream.on('error', reject);
            });
        }

        await employeeRef.update(updatedData);
        res.status(200).json({ message: 'Employee updated successfully', updatedData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating employee', error });
    }
};

// Delete an employee
eexports.deleteEmployee = async (req, res) => {
  try {
      const { employeeId } = req.params;
      const employeeRef = db.collection('employees').doc(employeeId);
      const employeeDoc = await employeeRef.get();

      // Check if employee exists
      if (!employeeDoc.exists) {
          return res.status(404).json({ message: 'Employee not found' });
      }

      const { photoUrl } = employeeDoc.data();

      if (photoUrl) {
          // Extract the file path from the URL
          const filePathMatch = photoUrl.match(/employees\/[^?]+/); // This will capture "employees/{employeeId}/{fileName}"
          if (filePathMatch) {
              const filePath = filePathMatch[0];
              const file = bucket.file(filePath);

              // Try deleting the file
              try {
                  await file.delete();
                  console.log(`File deleted: ${filePath}`);
              } catch (error) {
                  console.error(`Error deleting file: ${filePath}`, error);
                  return res.status(500).json({ message: 'Error deleting file from storage', error });
              }
          } else {
              console.warn(`File path could not be extracted from URL: ${photoUrl}`);
          }
      }

      // Delete the employee document
      await employeeRef.delete();
      res.status(200).json({ message: 'Employee deleted successfully' });
  } catch (error) {
      console.error('Error deleting employee:', error);
      res.status(500).json({ message: 'Error deleting employee', error });
  }
};


// Retrieve all employees
const admin = require('firebase-admin');
const db = admin.firestore();
const storage = admin.storage().bucket(); // Ensure you've initialized Firebase Admin SDK

exports.getAllEmployees = async (req, res) => {
    try {
        console.log('Fetching employees from Firestore...');
        const snapshot = await db.collection('employees').get();

        if (snapshot.empty) {
            console.log('No employees found in Firestore.');
            return res.status(404).json({ message: 'No employees found' });
        }

        console.log(`Found ${snapshot.size} employees. Processing...`);
        // Create an array to hold employee data
        const employees = await Promise.all(snapshot.docs.map(async (doc) => {
            const employeeData = { id: doc.id, ...doc.data() };

            // Assuming employee photo is stored in a specific path like 'employees/{employeeId}/photo.jpg'
            const photoPath = `employees/${doc.id}/photo.jpg`; // Adjust this path as necessary

            try {
                console.log(`Fetching photo for employee ID: ${doc.id} from path: ${photoPath}`);
                // Generate a signed URL for the photo
                const [url] = await storage.file(photoPath).getSignedUrl({
                    action: 'read',
                    expires: Date.now() + 1000 * 60 * 60 // URL expires in 1 hour
                });

                employeeData.photoUrl = url; // Add the photo URL to employee data
                console.log(`Photo URL for employee ID ${doc.id}: ${url}`);
            } catch (error) {
                console.error(`Error retrieving photo for employee ${doc.id}:`, error);
                employeeData.photoUrl = null; // If no photo is found, set to null
            }

            return employeeData; // Return the employee data with the photo URL
        }));

        console.log('Returning employee data:', employees);
        res.status(200).json(employees);
    } catch (error) {
        console.error('Error retrieving employees:', error);
        res.status(500).json({ message: 'Error retrieving employees', error });
    }
};

