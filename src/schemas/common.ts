import { z } from 'zod';
export const normalizedIndianPhoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s()-]/g, ''))
  .transform((value) =>
    value.startsWith('+91')
      ? value
      : value.startsWith('91') && value.length === 12
        ? `+${value}`
        : `+91${value}`,
  )
  .refine(
    (value) => /^\+91[6-9]\d{9}$/.test(value),
    'Enter a valid 10-digit Indian mobile number.',
  );
export const nonEmptyText = (label: string, max = 250) =>
  z.string().trim().min(1, `${label} is required.`).max(max, `${label} is too long.`);
