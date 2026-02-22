import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

// 1. Config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID 
};

// Validation
if (!firebaseConfig.apiKey) {
    console.error("CRITICAL: Firebase Configuration is missing. Check your .env file.");
}

// 2. Initialize App (Singleton)
// Check if apps are already initialized
const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();

// 3. Initialize Services
const auth = firebase.auth();
const db = firebase.firestore();

// FIX: Force Long Polling
// This helps with restrictive networks/firewalls.
try {
    db.settings({
        experimentalForceLongPolling: true,
    });
} catch (e) {
    console.warn("Firestore settings already locked, skipping reconfiguration.");
}

const storage = firebase.storage();
const googleProvider = new firebase.auth.GoogleAuthProvider();

console.log("Firebase Initialized (Compatibility Mode):", { 
  projectId: firebaseConfig.projectId, 
  authDomain: firebaseConfig.authDomain 
});

export { auth, googleProvider, db, storage, firebase };
export default app;