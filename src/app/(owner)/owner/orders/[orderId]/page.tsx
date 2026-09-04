import { OwnerOrderDetailScreen } from '@/features/orders/components/owner/OwnerOrderDetailScreen';
export default async function Page({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return <OwnerOrderDetailScreen orderId={orderId} />;
}
