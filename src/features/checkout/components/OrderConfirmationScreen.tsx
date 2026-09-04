'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PwaInstallButton } from '@/components/shared/PwaInstallButton';

interface LastOrder {
  orderId: string;
  subtotal: number;
  items: Array<{ name: string; qty: number }>;
}

export function OrderConfirmationScreen() {
  const [data] = useState<LastOrder | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem('agriconnect-last-order');
      return raw ? (JSON.parse(raw) as LastOrder) : null;
    } catch {
      // Confirmation still renders if session storage is unavailable.
      return null;
    }
  });

  return (
    <main className="p-4">
      <div className="mx-auto max-w-lg rounded-lg border bg-background p-6 text-center shadow-sm">
        <CheckCircle2 className="mx-auto mb-3 h-16 w-16 text-success" />
        <h1 className="text-2xl font-extrabold">Order Placed</h1>
        <p className="mt-2 text-muted-foreground">Shop owner will confirm shortly.</p>

        {data && (
          <div className="my-5 rounded-md bg-muted p-4 text-left">
            <p>
              <strong>Order ID:</strong> {data.orderId}
            </p>
            <p>
              <strong>Total:</strong> ₹{data.subtotal.toLocaleString('en-IN')}
            </p>
            <ul className="mt-2 list-inside list-disc">
              {data.items.map((item, index) => (
                <li key={`${item.name}-${index}`}>
                  {item.name} × {item.qty}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/">
            <Button>Continue Shopping</Button>
          </Link>
          <Link href="/orders">
            <Button variant="outline">Track My Orders</Button>
          </Link>
        </div>
        <div className="mt-4 flex justify-center">
          <PwaInstallButton />
        </div>
      </div>
    </main>
  );
}
