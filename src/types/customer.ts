import type { Timestamp } from 'firebase/firestore';
export interface Customer {
  name: string;
  address: string;
  village?: string;
  landmark?: string;
  lastOrderAt: Timestamp;
  totalOrders: number;
  createdAt: Timestamp;
  createdBy: string;
  updatedBy: string;
}
