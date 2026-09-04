'use client';
import { useMemo, useState } from 'react';
import { useAuth } from '@/features/auth';
import { useOrder } from '../../hooks/useOrder';
import { updateOrderStatus } from '../../services/orderService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { QuantityStepper } from '@/components/shared/QuantityStepper';
import StatusPill from '../StatusPill';
import { useToast } from '@/components/providers/ToastProvider';
import type { OrderStatus } from '@/constants/enums';
const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  placed: 'confirmed',
  confirmed: 'out_for_delivery',
  out_for_delivery: 'delivered',
};
export function OwnerOrderDetailScreen({ orderId }: { orderId: string }) {
  const { session } = useAuth();
  const shopId = session?.ownerProfile?.shopId ?? '';
  const { order, loading } = useOrder(shopId, orderId);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const { showToast } = useToast();
  const [draftQty, setDraftQty] = useState<Record<string, number>>({});
  const items = useMemo(
    () =>
      order?.items.map((i) => ({ productId: i.productId, qty: draftQty[i.productId] ?? i.qty })) ??
      [],
    [order, draftQty],
  );
  if (loading) return <p>Loading order…</p>;
  if (!order) return <p>Order not found.</p>;
  const currentOrder = order;
  async function transition(status: OrderStatus) {
    setBusy(true);
    try {
      await updateOrderStatus({
        shopId,
        orderId,
        status,
        cancelReason:
          status === 'cancelled' ? reason.trim() || 'Cancelled by shop owner' : undefined,
        items: currentOrder.status === 'placed' ? items : undefined,
      });
      showToast({ type: 'success', message: `Order updated to ${status.replaceAll('_', ' ')}.` });
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Could not update order.',
      });
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Order #{order.id.slice(0, 8)}</h1>
          <p className="text-muted-foreground">
            {order.customerName} · {order.customerPhone}
          </p>
        </div>
        <StatusPill status={order.status} />
      </div>
      <section className="rounded-lg border bg-background p-4">
        <h2 className="mb-3 font-bold">Items</h2>
        {order.items.map((i) => (
          <div
            key={i.productId}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b py-3 last:border-0"
          >
            <div>
              <p className="font-semibold">{i.name}</p>
              <p className="text-sm text-muted-foreground">
                ₹{i.unitPrice.toLocaleString('en-IN')} each
              </p>
            </div>
            {order.status === 'placed' ? (
              <QuantityStepper
                value={draftQty[i.productId] ?? i.qty}
                onChange={(q) => setDraftQty((s) => ({ ...s, [i.productId]: q }))}
              />
            ) : (
              <span>× {i.qty}</span>
            )}
            <span className="font-semibold">
              ₹{(i.unitPrice * (draftQty[i.productId] ?? i.qty)).toLocaleString('en-IN')}
            </span>
          </div>
        ))}
      </section>
      <section className="rounded-lg border bg-background p-4">
        <h2 className="font-bold">Delivery details</h2>
        <p>{order.address}</p>
        {order.village && <p>{order.village}</p>}
        {order.landmark && <p>Landmark: {order.landmark}</p>}
      </section>
      <section className="flex flex-wrap gap-3">
        {nextStatus[order.status] && (
          <Button disabled={busy} onClick={() => void transition(nextStatus[order.status]!)}>
            Move to {nextStatus[order.status]!.replaceAll('_', ' ')}
          </Button>
        )}
        {(order.status === 'placed' || order.status === 'confirmed') && (
          <div className="flex min-w-[280px] flex-1 gap-2">
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Cancellation reason"
            />
            <Button variant="danger" disabled={busy} onClick={() => void transition('cancelled')}>
              Cancel order
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
