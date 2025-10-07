
'use client';

import { initializeApp, getApps, type FirebaseOptions, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';

// Explicitly import hooks and providers to re-export
import { FirebaseProvider } from './provider';
import { FirebaseClientProvider } from './client-provider';
import { useUser } from './auth/use-user';
import {
  useFirebase,
  useFirebaseApp,
  useFirestore,
  useAuth,
} from './provider';

// Re-export all the hooks and providers
export {
  FirebaseProvider,
  FirebaseClientProvider,
  useUser,
  useFirebase,
  useFirebaseApp,
  useFirestore,
  useAuth,
};

let firebaseAppInstance: FirebaseApp | undefined;

interface FirebaseInstances {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

export function initializeFirebase(firebaseConfig: FirebaseOptions): FirebaseInstances {
  if (firebaseAppInstance) {
    return {
      firebaseApp: firebaseAppInstance,
      auth: getAuth(firebaseAppInstance),
      firestore: getFirestore(firebaseAppInstance),
    };
  }
  
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  firebaseAppInstance = app;

  const auth = getAuth(app);
  const firestore = getFirestore(app);

  if (process.env.NEXT_PUBLIC_EMULATOR_HOST) {
    const host = process.env.NEXT_PUBLIC_EMULATOR_HOST;
    // Before using any Firestore features, connect to the emulator
    // Note: The host and port must match what you are using for the emulators
    // connectFirestoreEmulator(firestore, host, 8080);
    // connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
  }


  return { firebaseApp: app, auth, firestore };
}
