import { getStorage, connectStorageEmulator, type FirebaseStorage } from 'firebase/storage';
import { firebaseApp } from './client';
import { appConfig } from '@/config/env';

const STORAGE_EMULATOR_HOST = '127.0.0.1';
const STORAGE_EMULATOR_PORT = 9199;

let emulatorConnected = false;

function getStorageInstance(): FirebaseStorage {
  const storage = getStorage(firebaseApp);

  if (appConfig.useEmulators && !emulatorConnected) {
    try {
      connectStorageEmulator(storage, STORAGE_EMULATOR_HOST, STORAGE_EMULATOR_PORT);
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

  return storage;
}

export const storage: FirebaseStorage = getStorageInstance();


import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';

export async function uploadFile(path: string, file: Blob, metadata?: { contentType?: string }): Promise<string> {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, metadata);
  return getDownloadURL(storageRef);
}

export async function deleteFile(path: string): Promise<void> {
  await deleteObject(ref(storage, path));
}
