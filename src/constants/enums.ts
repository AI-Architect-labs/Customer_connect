export const PRODUCT_UNITS = ['kg', 'litre', 'piece', 'packet'] as const;
export type ProductUnit = (typeof PRODUCT_UNITS)[number];

export const AVAILABILITY_STATUSES = ['available', 'low_stock', 'out_of_stock'] as const;
export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number];

export const ORDER_STATUSES = [
  'placed',
  'confirmed',
  'out_for_delivery',
  'delivered',
  'cancelled',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const OWNER_ROLES = ['owner'] as const;
export type OwnerRole = (typeof OWNER_ROLES)[number];
