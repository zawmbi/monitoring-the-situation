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

// __ROOT_ENV__ is injected by vite.config.js from the root .env file.
// Falls back to import.meta.env for cases where Vite's envDir works.
/* eslint-disable no-undef */
const _env = typeof __ROOT_ENV__ !== 'undefined' ? __ROOT_ENV__ : {};
/* eslint-enable no-undef */
const e = (key) => _env[key] || import.meta.env[key];

const firebaseConfig = {
  apiKey: e('VITE_FIREBASE_API_KEY'),
  authDomain: e('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: e('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: e('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: e('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: e('VITE_FIREBASE_APP_ID'),
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
  if (import.meta.env.DEV && e('VITE_USE_FIREBASE_EMULATORS') === 'true') {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectFunctionsEmulator(functions, 'localhost', 5001);
  }
} catch (err) {
  initError = err;
  console.error('Firebase initialization failed:', err.message);
  console.error('Firebase config:', JSON.stringify({
    apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.slice(0, 8)}...` : undefined,
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
  }));
}

export { auth, db, functions, initError };
export default app;
