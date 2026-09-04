'use client';
import Link from 'next/link';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { QuantityStepper } from '@/components/shared/QuantityStepper';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/shared/EmptyState';
export function CartScreen() {
  const items = useCartStore((s) => s.items);
  const setQty = useCartStore((s) => s.setQty);
  const remove = useCartStore((s) => s.remove);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  if (items.length === 0)
    return (
      <main className="p-4">
        <h1 className="mb-4 text-2xl font-extrabold">Cart</h1>
        <EmptyState
          title="Your cart is empty"
          message="Add products and they will appear here."
          icon={<ShoppingCart className="h-12 w-12" />}
          action={
            <Link href="/categories">
              <Button>Browse products</Button>
            </Link>
          }
        />
      </main>
    );
  return (
    <main className="p-4">
      <h1 className="mb-4 text-2xl font-extrabold">Cart</h1>
      <div className="space-y-3">
        {items.map((i) => (
          <div key={i.productId} className="flex gap-3 rounded-lg border bg-background p-3">
            {i.imageUrl ? (
              <img
                loading="lazy"
                decoding="async"
                src={i.imageUrl}
                alt={i.name}
                className="h-20 w-20 rounded object-cover"
              />
            ) : (
              <div className="h-20 w-20 rounded bg-muted" />
            )}
            <div className="min-w-0 flex-1">
              <h2 className="font-bold">{i.name}</h2>
              {i.brand && <p className="text-sm text-muted-foreground">{i.brand}</p>}
              <p className="font-semibold text-primary">₹{i.price.toLocaleString('en-IN')}</p>
              <div className="mt-2 flex items-center justify-between">
                <QuantityStepper value={i.qty} onChange={(v) => setQty(i.productId, v)} />
                <button
                  className="min-h-11 min-w-11 text-destructive"
                  onClick={() => remove(i.productId)}
                  aria-label={`Remove ${i.name}`}
                >
                  <Trash2 className="mx-auto h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="sticky bottom-20 mt-5 rounded-lg border bg-background p-4 shadow-lg md:bottom-4">
        <div className="mb-3 flex justify-between text-lg font-bold">
          <span>Subtotal</span>
          <span>₹{subtotal.toLocaleString('en-IN')}</span>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">
          Cash on Delivery. Final availability is confirmed by the shop.
        </p>
        <Link href="/checkout">
          <Button size="lg" className="w-full">
            Proceed to Checkout
          </Button>
        </Link>
      </div>
    </main>
  );
}
