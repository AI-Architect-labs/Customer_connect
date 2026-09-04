import { getWebPushToken } from '@/lib/firebase/messaging';
import { callFunction } from '@/lib/firebase/functions';
export async function enableOwnerNotifications(
  shopId: string,
): Promise<'enabled' | 'unsupported' | 'denied' | 'missing-vapid'> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  const permission =
    Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (permission !== 'granted') return 'denied';
  const token = await getWebPushToken();
  if (!token) return 'missing-vapid';
  await callFunction('registerOwnerFcmToken', { shopId, token });
  return 'enabled';
}
