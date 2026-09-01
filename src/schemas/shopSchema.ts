import { z } from 'zod';
import { normalizedIndianPhoneSchema } from './common';
export const shopFormSchema = z.object({
  name: z.string().trim().min(2).max(120),
  ownerDisplayName: z.string().trim().min(2).max(120),
  address: z.string().trim().min(5).max(500),
  phone: normalizedIndianPhoneSchema,
  businessHours: z.string().trim().min(3).max(250),
  active: z.boolean(),
});
export type ShopFormInput = z.input<typeof shopFormSchema>;
export type ShopFormValue = z.output<typeof shopFormSchema>;
