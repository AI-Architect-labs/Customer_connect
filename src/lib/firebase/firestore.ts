import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import { firebaseApp } from './client';
import { appConfig } from '@/config/env';

const FIRESTORE_EMULATOR_HOST = '127.0.0.1';
const FIRESTORE_EMULATOR_PORT = 8080;

let emulatorConnected = false;

function getFirestoreInstance(): Firestore {
  const firestore = getFirestore(firebaseApp);

  if (appConfig.useEmulators && !emulatorConnected) {
    try {
      connectFirestoreEmulator(firestore, FIRESTORE_EMULATOR_HOST, FIRESTORE_EMULATOR_PORT);
      emulatorConnected = true;
    } catch (error) {
      // The SDK throws if a Firestore instance is already connected to an
      // emulator host — this can happen under Next.js's dev hot-reload,
      // where this module may be re-evaluated against a Firestore instance
      // that a prior module evaluation already connected. That specific
      // condition is safe to ignore; anything else should surface.
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('already been called') && !message.includes('already started')) {
        throw error;
      }
      emulatorConnected = true;
    }
  }

  return firestore;
}

export const db: Firestore = getFirestoreInstance();
