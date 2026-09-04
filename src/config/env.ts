/** Centralized, validated environment configuration. */
export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface AppConfig {
  firebase: FirebaseWebConfig;
  useEmulators: boolean;
  defaultShopId: string;
  vapidKey?: string;
  appCheckSiteKey?: string;
}

export const ENV_SCHEMA_VERSION = 1;

const REQUIRED_FIREBASE_ENV_VARS = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
] as const;

function readEnvVar(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

function parseUseEmulators(): boolean {
  return readEnvVar('NEXT_PUBLIC_USE_FIREBASE_EMULATORS') === 'true';
}

const EMULATOR_DUMMY_FIREBASE_CONFIG: FirebaseWebConfig = {
  apiKey: 'demo-api-key',
  authDomain: 'demo-agriconnect.firebaseapp.com',
  projectId: 'demo-agriconnect',
  storageBucket: 'demo-agriconnect.appspot.com',
  messagingSenderId: '000000000000',
  appId: '1:000000000000:web:0000000000000000000000',
};

function resolveFirebaseConfig(useEmulators: boolean): FirebaseWebConfig {
  if (useEmulators) return EMULATOR_DUMMY_FIREBASE_CONFIG;
  const missing = REQUIRED_FIREBASE_ENV_VARS.filter((name) => !readEnvVar(name));
  if (missing.length > 0) {
    throw new Error(
      `Missing required Firebase environment variable(s): ${missing.join(', ')}. ` +
        'See .env.local.example or use NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true.',
    );
  }
  return {
    apiKey: readEnvVar('NEXT_PUBLIC_FIREBASE_API_KEY')!,
    authDomain: readEnvVar('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN')!,
    projectId: readEnvVar('NEXT_PUBLIC_FIREBASE_PROJECT_ID')!,
    storageBucket: readEnvVar('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET')!,
    messagingSenderId: readEnvVar('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID')!,
    appId: readEnvVar('NEXT_PUBLIC_FIREBASE_APP_ID')!,
  };
}

function buildAppConfig(): AppConfig {
  const useEmulators = parseUseEmulators();
  const defaultShopId =
    readEnvVar('NEXT_PUBLIC_DEFAULT_SHOP_ID') ?? (useEmulators ? 'demo-shop' : undefined);
  if (!defaultShopId) {
    throw new Error(
      'Missing NEXT_PUBLIC_DEFAULT_SHOP_ID. Set the shop document id for this storefront.',
    );
  }
  return {
    firebase: resolveFirebaseConfig(useEmulators),
    useEmulators,
    defaultShopId,
    vapidKey: readEnvVar('NEXT_PUBLIC_FIREBASE_VAPID_KEY'),
    appCheckSiteKey: readEnvVar('NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY'),
  };
}

export const appConfig: AppConfig = buildAppConfig();
