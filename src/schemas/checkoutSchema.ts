import { z } from 'zod';
import { normalizedIndianPhoneSchema } from './common';
export const checkoutSchema = z.object({
  customerName: z.string().trim().min(2, 'Enter your name.').max(120),
  customerPhone: normalizedIndianPhoneSchema,
  address: z.string().trim().min(5, 'Enter your delivery address.').max(500),
  village: z.string().trim().max(120).optional().or(z.literal('')),
  landmark: z.string().trim().max(180).optional().or(z.literal('')),
});
export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutValue = z.output<typeof checkoutSchema>;
