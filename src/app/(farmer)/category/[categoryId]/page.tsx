import { CategoryProductsScreen } from '@/features/catalog/components/farmer/CategoryProductsScreen';
export default async function Page({ params }: { params: Promise<{ categoryId: string }> }) {
  const { categoryId } = await params;
  return <CategoryProductsScreen categoryId={categoryId} />;
}
