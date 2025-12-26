
import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// This function is for server-side use, like in actions.
function initializeFirebase() {
    const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const auth: Auth = getAuth(app);
    const firestore: Firestore = getFirestore(app);
    return { firebaseApp: app, auth, firestore };
}

// These are for client-side use via the provider.
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const firestore: Firestore = getFirestore(app);

export { initializeFirebase, app as firebaseApp, auth, firestore };
export * from './provider';
export * from './auth/use-user';
