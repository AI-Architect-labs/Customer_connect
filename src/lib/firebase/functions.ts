import {
  connectFunctionsEmulator,
  getFunctions,
  httpsCallable,
  type Functions,
} from 'firebase/functions';
import { firebaseApp } from './client';
import { appConfig } from '@/config/env';
let connected = false;
const functions: Functions = getFunctions(firebaseApp, 'us-central1');
if (appConfig.useEmulators && !connected) {
  try {
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    connected = true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes('already')) throw error;
    connected = true;
  }
}
export async function callFunction<TInput, TOutput>(name: string, input: TInput): Promise<TOutput> {
  const callable = httpsCallable<TInput, TOutput>(functions, name);
  const result = await callable(input);
  return result.data;
}
