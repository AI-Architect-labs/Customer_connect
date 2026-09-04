'use client';
import Link from 'next/link';
import { useAuth } from '@/features/auth';
import { useOwnerOrders } from '@/features/orders';
import { useProducts } from '@/features/catalog';
import { computeDashboardAnalytics } from '../services/analyticsService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { OwnerNotificationSetup } from '@/features/notifications';
export function DashboardScreen() {
  const { session } = useAuth();
  const shopId = session?.ownerProfile?.shopId ?? '';
  const { orders } = useOwnerOrders(shopId);
  const { products } = useProducts(shopId);
  const a = computeDashboardAnalytics(orders);
  const low = products.filter((p) => p.availabilityStatus !== 'available');
  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome, {session?.ownerProfile?.displayName}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/owner/dashboard/analytics">
            <Button variant="outline">Analytics</Button>
          </Link>
          <OwnerNotificationSetup shopId={shopId} />
          <Link href="/owner/products/new">
            <Button>Add Product</Button>
          </Link>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-muted-foreground">Today’s orders</p>
          <p className="text-3xl font-extrabold">{a.todayOrders}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Pending confirmation</p>
          <p className="text-3xl font-extrabold text-warning">{a.pendingOrders}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">7-day revenue</p>
          <p className="text-3xl font-extrabold text-primary">
            ₹{a.weeklyRevenue.toLocaleString('en-IN')}
          </p>
        </Card>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-lg font-bold">Best sellers</h2>
          {a.bestSellers.length === 0 ? (
            <p className="text-muted-foreground">No sales yet.</p>
          ) : (
            <ol className="space-y-2">
              {a.bestSellers.map((x, i) => (
                <li key={x.name} className="flex justify-between">
                  <span>
                    {i + 1}. {x.name}
                  </span>
                  <strong>{x.qty} units</strong>
                </li>
              ))}
            </ol>
          )}
        </Card>
        <Card>
          <h2 className="mb-3 text-lg font-bold">Stock alerts</h2>
          {low.length === 0 ? (
            <p className="text-muted-foreground">No stock alerts.</p>
          ) : (
            <ul className="space-y-2">
              {low.slice(0, 8).map((p) => (
                <li key={p.id} className="flex justify-between">
                  <Link
                    href={`/owner/products/${p.id}/edit`}
                    className="font-semibold text-primary"
                  >
                    {p.name}
                  </Link>
                  <span>{p.availabilityStatus.replaceAll('_', ' ')}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
