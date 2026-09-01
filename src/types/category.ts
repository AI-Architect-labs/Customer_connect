import type { Timestamp } from 'firebase/firestore';
export interface Category {
  id: string;
  name: string;
  sortOrder: number;
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  updatedBy: string;
  deletedAt?: Timestamp | null;
  deletedBy?: string | null;
}
