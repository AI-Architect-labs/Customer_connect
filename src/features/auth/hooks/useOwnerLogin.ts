'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithOwnerCredentials } from '../services/authService';
import { mapFirebaseAuthError } from '../utils/authErrors';
import { useGlobalLoading } from '@/components/providers/LoadingProvider';
import type { OwnerLoginFormValues } from '../schema';

const LOADING_KEY = 'owner-login';

export interface UseOwnerLoginResult {
  handleSubmit: (values: OwnerLoginFormValues) => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
}

/**
 * Owns the full submission lifecycle for the owner login form: calls the
 * real Firebase sign-in, drives the global loading indicator, maps any
 * failure to a friendly message, and redirects on success. LoginForm (the
 * component) never imports this — the page composes them together, which
 * is what keeps the UI component reusable and independently testable
 * regardless of how sign-in is actually implemented.
 */
export function useOwnerLogin(redirectTo: string): UseOwnerLoginResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { startLoading, stopLoading } = useGlobalLoading();
  const router = useRouter();

  const handleSubmit = useCallback(
    async (values: OwnerLoginFormValues) => {
      setSubmitError(null);
      setIsSubmitting(true);
      startLoading(LOADING_KEY);

      try {
        await signInWithOwnerCredentials(values.email, values.password);
        router.push(redirectTo);
      } catch (error) {
        setSubmitError(mapFirebaseAuthError(error));
      } finally {
        setIsSubmitting(false);
        stopLoading(LOADING_KEY);
      }
    },
    [redirectTo, router, startLoading, stopLoading],
  );

  return { handleSubmit, isSubmitting, submitError };
}
