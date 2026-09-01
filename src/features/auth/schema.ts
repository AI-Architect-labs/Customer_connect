import { z } from 'zod';

export const ownerLoginSchema = z.object({
  email: z
    .string()
    .min(1, 'Please enter your email address.')
    .email('Please enter a valid email address.'),
  password: z.string().min(1, 'Please enter your password.'),
});

export type OwnerLoginFormValues = z.infer<typeof ownerLoginSchema>;

/** Per-field error messages, keyed the same as OwnerLoginFormValues. */
export type OwnerLoginFieldErrors = Partial<Record<keyof OwnerLoginFormValues, string>>;

/**
 * Runs the schema against a set of form values and returns field-level
 * errors in a shape LoginForm can render directly under each input —
 * kept here (not inline in the component) so the validation contract is
 * testable independently of any UI.
 */
export function validateOwnerLogin(values: OwnerLoginFormValues): OwnerLoginFieldErrors {
  const result = ownerLoginSchema.safeParse(values);
  if (result.success) {
    return {};
  }

  const fieldErrors: OwnerLoginFieldErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof OwnerLoginFormValues | undefined;
    if (field && !fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }
  return fieldErrors;
}
