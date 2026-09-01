import { z } from 'zod';
export const categoryFormSchema = z.object({
  name: z.string().trim().min(2, 'Category name is required.').max(80),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  active: z.boolean(),
});
export type CategoryFormInput = z.input<typeof categoryFormSchema>;
export type CategoryFormValue = z.output<typeof categoryFormSchema>;
