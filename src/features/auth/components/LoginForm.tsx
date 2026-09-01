'use client';

import { useRef, useState, type FormEvent } from 'react';
import {
  validateOwnerLogin,
  type OwnerLoginFieldErrors,
  type OwnerLoginFormValues,
} from '../schema';

export interface LoginFormProps {
  onSubmit: (values: OwnerLoginFormValues) => void | Promise<void>;
  isSubmitting: boolean;
  /** A form-level error (e.g. "incorrect email or password") — distinct from per-field validation errors. */
  submitError: string | null;
}

/**
 * Pure UI. This component knows nothing about Firebase, `authService`, or
 * how `onSubmit` is implemented — it only knows how to collect two fields,
 * validate them client-side (Database.md-style validation, but for a form
 * rather than a Firestore write), and report a complete, valid set of
 * values upward. This is what makes it independently testable and reusable
 * regardless of what the actual sign-in mechanism turns out to be.
 */
export function LoginForm({ onSubmit, isSubmitting, submitError }: LoginFormProps) {
  const [values, setValues] = useState<OwnerLoginFormValues>({ email: '', password: '' });
  const [touched, setTouched] = useState<Record<keyof OwnerLoginFormValues, boolean>>({
    email: false,
    password: false,
  });
  const [fieldErrors, setFieldErrors] = useState<OwnerLoginFieldErrors>({});

  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const handleBlur = (field: keyof OwnerLoginFormValues) => {
    setTouched((current) => ({ ...current, [field]: true }));
    setFieldErrors(validateOwnerLogin(values));
  };

  const handleChange = (field: keyof OwnerLoginFormValues, value: string) => {
    const nextValues = { ...values, [field]: value };
    setValues(nextValues);
    // Re-validate only if the field has already been touched, so an error
    // clears the moment it's fixed rather than lingering until blur again —
    // but a field is never flagged invalid before the user has left it once
    // (UI_UX.md §11: "Inline, not preemptive").
    if (touched[field]) {
      setFieldErrors(validateOwnerLogin(nextValues));
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errors = validateOwnerLogin(values);
    setFieldErrors(errors);
    setTouched({ email: true, password: true });

    if (errors.email) {
      emailInputRef.current?.focus();
      return;
    }
    if (errors.password) {
      passwordInputRef.current?.focus();
      return;
    }

    void onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {submitError && (
        <p
          role="alert"
          className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {submitError}
        </p>
      )}

      <div className="space-y-1.5">
        <label htmlFor="owner-email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <input
          ref={emailInputRef}
          id="owner-email"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(event) => handleChange('email', event.target.value)}
          onBlur={() => handleBlur('email')}
          aria-invalid={Boolean(touched.email && fieldErrors.email)}
          aria-describedby={touched.email && fieldErrors.email ? 'owner-email-error' : undefined}
          className="h-11 w-full rounded-md border border-border bg-background px-3 text-base text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
        {touched.email && fieldErrors.email && (
          <p id="owner-email-error" role="alert" className="text-sm text-destructive">
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="owner-password" className="text-sm font-medium text-foreground">
          Password
        </label>
        <input
          ref={passwordInputRef}
          id="owner-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={values.password}
          onChange={(event) => handleChange('password', event.target.value)}
          onBlur={() => handleBlur('password')}
          aria-invalid={Boolean(touched.password && fieldErrors.password)}
          aria-describedby={
            touched.password && fieldErrors.password ? 'owner-password-error' : undefined
          }
          className="h-11 w-full rounded-md border border-border bg-background px-3 text-base text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
        {touched.password && fieldErrors.password && (
          <p id="owner-password-error" role="alert" className="text-sm text-destructive">
            {fieldErrors.password}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="h-11 w-full rounded-md bg-primary text-base font-medium text-primary-foreground hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
      >
        {isSubmitting ? 'Signing in…' : 'Log In'}
      </button>
    </form>
  );
}
