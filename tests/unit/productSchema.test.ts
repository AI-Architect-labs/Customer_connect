import { describe, expect, it } from 'vitest';
import { productFormSchema } from '@/schemas/productSchema';
const base = {
  name: 'Urea',
  brand: 'IFFCO',
  categoryId: 'fert',
  description: '',
  unit: 'kg' as const,
  packSize: 50,
  mrp: 500,
  discountPrice: 450,
  availabilityStatus: 'available' as const,
  stockQty: 10,
  active: true,
};
describe('productFormSchema', () => {
  it('accepts a valid product', () => expect(productFormSchema.safeParse(base).success).toBe(true));
  it('rejects discount above MRP', () =>
    expect(productFormSchema.safeParse({ ...base, discountPrice: 600 }).success).toBe(false));
});
