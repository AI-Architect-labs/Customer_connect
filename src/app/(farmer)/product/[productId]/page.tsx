import { ProductDetailScreen } from '@/features/catalog/components/farmer/ProductDetailScreen';
export default async function Page({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  return <ProductDetailScreen productId={productId} />;
}
