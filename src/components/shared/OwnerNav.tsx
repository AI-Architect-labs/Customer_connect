'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, Tags, ClipboardList, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth';
const items = [
  ['/owner/dashboard', 'Dashboard', LayoutDashboard],
  ['/owner/products', 'Products', Package],
  ['/owner/categories', 'Categories', Tags],
  ['/owner/orders', 'Orders', ClipboardList],
  ['/owner/settings', 'Shop Settings', Settings],
] as const;
export function OwnerNav() {
  const path = usePathname();
  const { signOut } = useAuth();
  return (
    <aside className="border-b bg-background md:min-h-screen md:w-64 md:border-b-0 md:border-r">
      <div className="flex items-center justify-between p-4 md:block">
        <Link href="/owner/dashboard" className="text-xl font-extrabold text-primary">
          AgriConnect Owner
        </Link>
        <button
          className="flex min-h-11 items-center gap-2 text-sm text-muted-foreground md:hidden"
          onClick={() => void signOut()}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
      <nav
        className="flex overflow-x-auto px-2 pb-2 md:flex-col md:gap-1"
        aria-label="Owner navigation"
      >
        {items.map(([href, label, Icon]) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex min-h-11 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-semibold',
              path.startsWith(href) ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
      <button
        className="m-3 hidden min-h-11 items-center gap-2 rounded-md px-3 text-sm font-semibold text-destructive hover:bg-red-50 md:flex"
        onClick={() => void signOut()}
      >
        <LogOut className="h-4 w-4" />
        Log out
      </button>
    </aside>
  );
}
