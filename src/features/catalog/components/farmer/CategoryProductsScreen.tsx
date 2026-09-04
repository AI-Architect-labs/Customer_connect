'use client';
import { useMemo } from 'react';
import { appConfig } from '@/config/env';
import { useCategories } from '../../hooks/useCategories';
import { useProducts } from '../../hooks/useProducts';
import { ProductCard } from '@/components/shared/ProductCard';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { EmptyState } from '@/components/shared/EmptyState';
export function CategoryProductsScreen({ categoryId }: { categoryId: string }) {
  const shopId = appConfig.defaultShopId;
  const { categories } = useCategories(shopId);
  const category = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categories, categoryId],
  );
  const { products, loading } = useProducts(shopId, { activeOnly: true, categoryId });
  return (
    <main className="p-4">
      <h1 className="mb-4 text-2xl font-extrabold">{category?.name ?? 'Products'}</h1>
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          title="No products yet"
          message="There are no active products in this category right now."
        />
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
