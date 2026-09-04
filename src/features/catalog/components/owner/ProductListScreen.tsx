'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '@/features/auth';
import { useProducts } from '../../hooks/useProducts';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AvailabilityBadge } from '@/components/shared/AvailabilityBadge';
export function ProductListScreen() {
  const { session } = useAuth();
  const shopId = session?.ownerProfile?.shopId ?? '';
  const [q, setQ] = useState('');
  const { products, loading } = useProducts(shopId, { search: q });
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Products</h1>
        <Link href="/owner/products/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>
      <Input
        className="mb-4 max-w-md"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search product or brand"
      />
      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-background">
          <table className="w-full min-w-[700px] text-left">
            <thead className="bg-muted">
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3">Price</th>
                <th className="p-3">Availability</th>
                <th className="p-3">Active</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-3">
                    <strong>{p.name}</strong>
                    <div className="text-sm text-muted-foreground">{p.brand}</div>
                  </td>
                  <td className="p-3">₹{(p.discountPrice ?? p.mrp).toLocaleString('en-IN')}</td>
                  <td className="p-3">
                    <AvailabilityBadge status={p.availabilityStatus} />
                  </td>
                  <td className="p-3">{p.active ? 'Yes' : 'No'}</td>
                  <td className="p-3">
                    <Link
                      href={`/owner/products/${p.id}/edit`}
                      className="font-semibold text-primary"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
