import type { Timestamp } from 'firebase/firestore';
import type { AvailabilityStatus, ProductUnit } from '@/constants/enums';
export interface ProductImage {
  id: string;
  url: string;
  storagePath: string;
  isCover: boolean;
  uploadedAt: Timestamp;
}
export interface Product {
  id: string;
  name: string;
  brand?: string;
  categoryId: string;
  description?: string;
  images: ProductImage[];
  unit: ProductUnit;
  packSize: number;
  mrp: number;
  discountPrice?: number;
  availabilityStatus: AvailabilityStatus;
  stockQty?: number;
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  updatedBy: string;
  deletedAt?: Timestamp | null;
  deletedBy?: string | null;
}
export function productSellingPrice(product: Pick<Product, 'mrp' | 'discountPrice'>): number {
  return product.discountPrice ?? product.mrp;
}
