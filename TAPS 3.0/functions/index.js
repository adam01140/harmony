const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Define the Firebase Firestore Database
const db = admin.firestore();

// Cloud Function to enforce rate limit on user reports
exports.rateLimit = functions.firestore
  .document('sightings/{sightingId}')
  .onCreate(async (snapshot, context) => {
    const now = admin.firestore.Timestamp.now();
    const sighting = snapshot.data();
    const uid = sighting.uid; // Assuming each report includes a uid field identifying the user
    
    // Reference to the user's document in a 'users' collection
    const userRef = db.collection('users').doc(uid);

    // Get the user document
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      const userData = userDoc.data();

      // If the user has reported in the last 60 seconds, disallow the write and delete the document
      if (userData.lastReportedAt.toMillis() > (now.toMillis() - 60000)) {
        return snapshot.ref.delete();
      }
    }

    // If the user hasn't reported recently, update their last reported time
    return userRef.set({ lastReportedAt: now }, { merge: true });
  });
