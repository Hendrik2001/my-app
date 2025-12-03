import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, setLogLevel } from 'firebase/firestore';

/* global __firebase_config, __initial_auth_token */

// --- Firebase Configuration (MANDATORY) ---
// These global variables are provided by the environment...
// ...but we must provide a fallback for local development.

/* eslint-disable no-undef */
const firebaseConfig = typeof __firebase_config !== 'undefined'
  ? JSON.parse(__firebase_config)
  : {
      // PASTE YOUR LOCAL CONFIG HERE
      apiKey: "AIzaSyDdtWdjAZJXEuXfEiQTUt89HV0uGvN92To",
      authDomain: "law-firm-simulation.firebaseapp.com",
      projectId: "law-firm-simulation",
      storageBucket: "law-firm-simulation.firebasestorage.app",
      messagingSenderId: "55201403119",
      appId: "1:55201403119:web:146a1918849ffc0b188b1a"
    };

const initialAuthToken = typeof __initial_auth_token !== 'undefined'
  ? __initial_auth_token
  : null;
/* eslint-enable no-undef */

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Enable Firestore debug logging
setLogLevel('Debug');

// --- Initial Auth ---
// Handle signing in when the app first loads
const handleAuth = async () => {
    if (initialAuthToken) {
        try {
            await signInWithCustomToken(auth, initialAuthToken);
        } catch (err) {
            console.error("Custom token sign-in failed, trying anonymous", err);
            await signInAnonymously(auth);
        }
    } else {
        // Fallback for local dev
        await signInAnonymously(auth);
    }
};

handleAuth();

export { app, auth, db };