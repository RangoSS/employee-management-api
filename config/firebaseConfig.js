const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');

// Import the credentials SDK from the config folder
const serviceAccount = require('./credentialsSDK.json'); 

// Log the contents of credentialsSDK.json for debugging
console.log('Credentials SDK:', serviceAccount);

// Initialize Firebase Admin SDK using credentialsSDK.json
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: `${serviceAccount.project_id}.appspot.com`, 
    });
}

// Initialize Firestore
const db = admin.firestore();

// Initialize Google Cloud Storage
const storage = new Storage({ keyFilename: './config/credentialsSDK.json' });
const bucket = storage.bucket(`${serviceAccount.project_id}.appspot.com`);

// Export Firestore db, Storage bucket, and admin
module.exports = { db, bucket, admin };
