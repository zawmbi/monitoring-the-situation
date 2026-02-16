/**
 * Firebase client SDK initialization
 *
 * SECURITY: Only public-facing Firebase config values are used here.
 * These are NOT secrets — they identify the Firebase project and are
 * safe to include in client-side code. All sensitive operations
 * (writes, Stripe, admin) go through Cloud Functions.
 *
 * Configuration is loaded from Vite environment variables (VITE_ prefix).
 * These must be set in the root .env file.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app = null;
let auth = null;
let db = null;
let functions = null;
let initError = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  functions = getFunctions(app);

  // SECURITY: Connect to emulators in development mode only.
  // This prevents accidental writes to production during local dev.
  if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectFunctionsEmulator(functions, 'localhost', 5001);
  }
} catch (err) {
  initError = err;
  console.error('Firebase initialization failed:', err.message);
  console.error('Check that VITE_FIREBASE_* environment variables are set in the root .env file.');
}

export { auth, db, functions, initError };
export default app;
