'use client';

import { LoginForm, useOwnerLogin } from '@/features/auth';

export default function OwnerLoginPage() {
  const { handleSubmit, isSubmitting, submitError } = useOwnerLogin('/owner/dashboard');

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary">AgriConnect</h1>
          <p className="text-sm text-muted-foreground">Shop Owner Sign In</p>
        </div>
        <LoginForm onSubmit={handleSubmit} isSubmitting={isSubmitting} submitError={submitError} />
      </div>
    </main>
  );
}
