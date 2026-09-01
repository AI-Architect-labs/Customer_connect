import type { Timestamp } from 'firebase/firestore';
export interface Shop {
  name: string;
  ownerUid: string;
  ownerDisplayName: string;
  address: string;
  phone: string;
  businessHours: string;
  shopPhotoURL?: string;
  shopPhotoStoragePath?: string;
  mapLocation?: { lat: number; lng: number };
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  updatedBy: string;
  deletedAt?: Timestamp | null;
  deletedBy?: string | null;
}
