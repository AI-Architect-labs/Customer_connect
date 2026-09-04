'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid2X2, ShoppingCart, ReceiptText, Store } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { cn } from '@/lib/utils';
const items = [
  ['/', 'Home', Home],
  ['/categories', 'Categories', Grid2X2],
  ['/cart', 'Cart', ShoppingCart],
  ['/orders', 'My Orders', ReceiptText],
  ['/about-shop', 'About', Store],
] as const;
export function FarmerNav() {
  const path = usePathname();
  const count = useCartStore((s) => s.items.reduce((n, i) => n + i.qty, 0));
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur md:sticky md:bottom-auto md:top-0"
      aria-label="Farmer navigation"
    >
      <div className="mx-auto grid max-w-3xl grid-cols-5">
        {items.map(([href, label, Icon]) => {
          const active = href === '/' ? path === href : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium',
                active ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
              {href === '/cart' && count > 0 && (
                <span className="absolute right-[22%] top-1 rounded-full bg-secondary px-1.5 text-[10px] font-bold text-secondary-foreground">
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
