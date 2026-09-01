'use client';
import{getMessaging,getToken,isSupported,type Messaging}from'firebase/messaging';import{firebaseApp}from'./client';import{appConfig}from'@/config/env';
let instance:Messaging|undefined;
export async function getMessagingIfSupported():Promise<Messaging|null>{if(!(await isSupported()))return null;instance??=getMessaging(firebaseApp);return instance;}
export async function getWebPushToken():Promise<string|null>{if(!appConfig.vapidKey)return null;const messaging=await getMessagingIfSupported();if(!messaging)return null;const registration=await navigator.serviceWorker.ready;return getToken(messaging,{vapidKey:appConfig.vapidKey,serviceWorkerRegistration:registration});}
