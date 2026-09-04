'use client';
import { Bell } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { enableOwnerNotifications } from '../services/notificationService';
import { useToast } from '@/components/providers/ToastProvider';
export function OwnerNotificationSetup({ shopId }: { shopId: string }) {
  const [busy, setBusy] = useState(false);
  const { showToast } = useToast();
  async function enable() {
    setBusy(true);
    try {
      const result = await enableOwnerNotifications(shopId);
      if (result === 'enabled')
        showToast({ type: 'success', message: 'New-order notifications enabled.' });
      else if (result === 'missing-vapid')
        showToast({
          type: 'warning',
          message: 'Set NEXT_PUBLIC_FIREBASE_VAPID_KEY to enable push notifications.',
        });
      else
        showToast({
          type: 'warning',
          message: 'Notifications are unavailable or permission was denied.',
        });
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Could not enable notifications.',
      });
    } finally {
      setBusy(false);
    }
  }
  return (
    <Button variant="outline" onClick={() => void enable()} disabled={busy}>
      <Bell className="mr-2 h-4 w-4" />
      {busy ? 'Enabling…' : 'Enable Notifications'}
    </Button>
  );
}
