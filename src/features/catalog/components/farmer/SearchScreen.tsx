'use client';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { appConfig } from '@/config/env';
import { useProducts } from '../../hooks/useProducts';
import { Input } from '@/components/ui/Input';
import { ProductCard } from '@/components/shared/ProductCard';
import { EmptyState } from '@/components/shared/EmptyState';
export function SearchScreen() {
  const [q, setQ] = useState('');
  const { products } = useProducts(appConfig.defaultShopId, { activeOnly: true, search: q });
  return (
    <main className="p-4">
      <h1 className="mb-4 text-2xl font-extrabold">Search</h1>
      <div className="relative mb-5">
        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
        <Input
          className="pl-10"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search product or brand"
          aria-label="Search products"
        />
      </div>
      {q.trim() && products.length === 0 ? (
        <EmptyState title="No matching products" message="Try another product name or brand." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </main>
  );
}
