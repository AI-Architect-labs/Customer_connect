import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges conditional class names (via clsx) and then resolves any
 * conflicting Tailwind utility classes (via tailwind-merge), so a
 * component can accept a `className` prop and safely override its
 * own default classes without producing duplicate/conflicting
 * utilities in the final class string.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
