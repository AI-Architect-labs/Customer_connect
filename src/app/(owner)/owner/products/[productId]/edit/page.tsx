import { ProductFormScreen } from '@/features/catalog/components/owner/ProductFormScreen';
export default async function Page({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  return <ProductFormScreen productId={productId} />;
}
