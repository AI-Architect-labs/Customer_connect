import { describe, expect, it } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { computeDashboardAnalytics } from '@/features/analytics/services/analyticsService';
import type { Order } from '@/types/order';
function order(
  id: string,
  status: Order['status'],
  date: Date,
  phone: string,
  subtotal: number,
): Order {
  return {
    id,
    customerName: 'Farmer',
    customerPhone: phone,
    address: 'Village',
    items: [
      {
        productId: 'p1',
        name: 'Urea',
        brand: null,
        unit: 'kg',
        packSize: 50,
        qty: 2,
        unitPrice: subtotal / 2,
      },
    ],
    subtotal,
    status,
    statusHistory: [],
    createdByUid: 'u',
    createdAt: Timestamp.fromDate(date),
    updatedAt: Timestamp.fromDate(date),
    updatedBy: 'u',
  };
}
describe('computeDashboardAnalytics', () => {
  it('excludes cancelled revenue and counts repeat customers', () => {
    const now = new Date('2026-08-31T12:00:00Z');
    const result = computeDashboardAnalytics(
      [
        order('1', 'delivered', now, '+919999999999', 100),
        order('2', 'cancelled', now, '+919999999999', 300),
        order('3', 'placed', now, '+918888888888', 50),
      ],
      now,
    );
    expect(result.todayOrders).toBe(3);
    expect(result.pendingOrders).toBe(1);
    expect(result.weeklyRevenue).toBe(150);
    expect(result.repeatCustomers).toBe(1);
    expect(result.newCustomers).toBe(1);
  });
});
