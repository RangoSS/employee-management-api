// controllers/employeeController.js
const { db, bucket } = require('../config/firebaseConfig');

const { v4: uuidv4 } = require('uuid');

// Create an employee
exports.createEmployee = async (req, res) => {
  try {
    const { name, surname, age, idNumber, role } = req.body;
    const employeeId = uuidv4(); // Generate a unique ID
    const employeeData = { name, surname, age, idNumber, role, employeeId };

    // Upload employee photo to Firebase Storage
    let photoUrl = '';
    if (req.file) {
      const blob = bucket.file(`employees/${employeeId}/${req.file.originalname}`);
      const blobStream = blob.createWriteStream({ metadata: { contentType: req.file.mimetype } });
      blobStream.end(req.file.buffer);

      await new Promise((resolve, reject) => {
        blobStream.on('finish', async () => {
          photoUrl = await blob.getSignedUrl({ action: 'read', expires: '03-09-2491' });
          resolve();
        });
        blobStream.on('error', reject);
      });

      employeeData.photo = photoUrl;
    }

    // Save employee data to Firestore
    await db.collection('employees').doc(employeeId).set(employeeData);

    res.status(201).json({ message: 'Employee created successfully', employee: employeeData });
  } catch (error) {
    console.error(error); // Added error logging
    res.status(500).json({ message: 'Error creating employee', error });
  }
};

// Update employee details
exports.updateEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { name, surname, age, idNumber, role } = req.body;

    const employeeRef = db.collection('employees').doc(employeeId);
    const employeeData = { name, surname, age, idNumber, role };

    const currentEmployee = await employeeRef.get();
    if (!currentEmployee.exists) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    if (req.file) {
      const oldPhotoUrl = currentEmployee.data().photo;
      if (oldPhotoUrl) {
        const fileName = oldPhotoUrl.split('/').pop();
        await bucket.file(`employees/${employeeId}/${fileName}`).delete();
      }

      const blob = bucket.file(`employees/${employeeId}/${req.file.originalname}`);
      const blobStream = blob.createWriteStream({ metadata: { contentType: req.file.mimetype } });
      blobStream.end(req.file.buffer);

      let photoUrl = '';
      await new Promise((resolve, reject) => {
        blobStream.on('finish', async () => {
          photoUrl = await blob.getSignedUrl({ action: 'read', expires: '03-09-2491' });
          resolve();
        });
        blobStream.on('error', reject);
      });

      employeeData.photo = photoUrl;
    }

    await employeeRef.update(employeeData);
    res.status(200).json({ message: 'Employee updated successfully' });
  } catch (error) {
    console.error(error); // Added error logging
    res.status(500).json({ message: 'Error updating employee', error });
  }
};

// Delete employee
exports.deleteEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
     const employeeRef = await db.collection('employees').doc(employeeId).get();
    const employeeData = employeeRef.data();
     const fileName = employeeData.photo.split('/').pop();

     await bucket.file(`employees/${employeeId}/${fileName}`).delete();
     await db.collection('employees').doc(employeeId).delete();

    res.status(200).json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error(error); // Added error logging
    res.status(500).json({ message: 'Error deleting employee', error });
  }
};

// Get employee by ID
exports.getEmployeeById = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const employeeRef = await db.collection('employees').doc(employeeId).get();

    if (!employeeRef.exists) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.status(200).json(employeeRef.data());
  } catch (error) {
    console.error(error); // Added error logging
    res.status(500).json({ message: 'Error retrieving employee', error });
  }
};
