import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { firebaseApp } from './client';
import { appConfig } from '@/config/env';

const AUTH_EMULATOR_URL = 'http://127.0.0.1:9099';

let emulatorConnected = false;

function getAuthInstance(): Auth {
  const auth = getAuth(firebaseApp);

  if (appConfig.useEmulators && !emulatorConnected) {
    try {
      // disableWarnings suppresses the SDK's console warning about emulator
      // use, which would otherwise fire on every hot-reload in development.
      connectAuthEmulator(auth, AUTH_EMULATOR_URL, { disableWarnings: true });
      emulatorConnected = true;
    } catch (error) {
      // See firestore.ts for why this specific failure mode is safely ignored
      // (re-connection attempts triggered by Next.js dev hot-reload).
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('already been called') && !message.includes('already started')) {
        throw error;
      }
      emulatorConnected = true;
    }
  }

  return auth;
}

export const auth: Auth = getAuthInstance();
