import type { Order } from '@/types/order';
export interface DashboardAnalytics {
  todayOrders: number;
  pendingOrders: number;
  weeklyRevenue: number;
  bestSellers: Array<{ name: string; qty: number; revenue: number }>;
  newCustomers: number;
  repeatCustomers: number;
}
export function computeDashboardAnalytics(orders: Order[], now = new Date()): DashboardAnalytics {
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);
  const weekAgo = new Date(startToday);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const completed = orders.filter((o) => o.status !== 'cancelled');
  const todayOrders = orders.filter((o) => o.createdAt.toDate() >= startToday).length;
  const pendingOrders = orders.filter((o) => o.status === 'placed').length;
  const weeklyRevenue = completed
    .filter((o) => o.createdAt.toDate() >= weekAgo)
    .reduce((n, o) => n + o.subtotal, 0);
  const map = new Map<string, { qty: number; revenue: number }>();
  for (const o of completed) {
    for (const i of o.items) {
      const x = map.get(i.name) ?? { qty: 0, revenue: 0 };
      x.qty += i.qty;
      x.revenue += i.qty * i.unitPrice;
      map.set(i.name, x);
    }
  }
  const bestSellers = [...map.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);
  const counts = new Map<string, number>();
  for (const o of orders) counts.set(o.customerPhone, (counts.get(o.customerPhone) ?? 0) + 1);
  let newCustomers = 0,
    repeatCustomers = 0;
  for (const c of counts.values()) c > 1 ? repeatCustomers++ : newCustomers++;
  return { todayOrders, pendingOrders, weeklyRevenue, bestSellers, newCustomers, repeatCustomers };
}
