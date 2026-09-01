import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { appConfig } from '@/config/env';

/**
 * Returns the single shared Firebase App instance, creating it on first
 * access. Guards against re-initialization, which Next.js's development
 * hot-reload can otherwise trigger (`initializeApp` throws if called twice
 * for the same app without this check).
 */
function getOrCreateFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp({
    apiKey: appConfig.firebase.apiKey,
    authDomain: appConfig.firebase.authDomain,
    projectId: appConfig.firebase.projectId,
    storageBucket: appConfig.firebase.storageBucket,
    messagingSenderId: appConfig.firebase.messagingSenderId,
    appId: appConfig.firebase.appId,
  });
}

export const firebaseApp: FirebaseApp = getOrCreateFirebaseApp();
