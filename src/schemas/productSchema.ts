import { z } from 'zod';
import { AVAILABILITY_STATUSES, PRODUCT_UNITS } from '@/constants/enums';
export const productFormSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    brand: z.string().trim().max(120).optional().or(z.literal('')),
    categoryId: z.string().trim().min(1, 'Choose a category.'),
    description: z.string().trim().max(1500).optional().or(z.literal('')),
    unit: z.enum(PRODUCT_UNITS),
    packSize: z.coerce.number().positive(),
    mrp: z.coerce.number().positive(),
    discountPrice: z.union([z.coerce.number().positive(), z.literal(''), z.undefined()]),
    availabilityStatus: z.enum(AVAILABILITY_STATUSES),
    stockQty: z.union([z.coerce.number().int().min(0), z.literal(''), z.undefined()]),
    active: z.boolean(),
  })
  .refine((v) => v.discountPrice === '' || v.discountPrice === undefined || v.discountPrice <= v.mrp, {
    path: ['discountPrice'],
    message: 'Discount price cannot exceed MRP.',
  });
export type ProductFormInput = z.input<typeof productFormSchema>;
export type ProductFormValue = z.output<typeof productFormSchema>;
