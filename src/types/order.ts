import type { Timestamp } from 'firebase/firestore';
import type { OrderStatus, ProductUnit } from '@/constants/enums';
export interface OrderItem {
  productId: string;
  name: string;
  brand: string | null;
  unit: ProductUnit;
  packSize: number;
  qty: number;
  unitPrice: number;
}
export interface StatusHistoryEntry {
  status: OrderStatus;
  at: Timestamp;
  note: string | null;
}
export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  address: string;
  village?: string;
  landmark?: string;
  items: OrderItem[];
  subtotal: number;
  status: OrderStatus;
  statusHistory: StatusHistoryEntry[];
  cancelReason?: string;
  createdByUid: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  updatedBy: string;
}
