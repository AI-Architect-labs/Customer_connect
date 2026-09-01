/**
 * Shared error utilities (FolderStructure.md §10 — generic, feature-agnostic
 * helpers). Services introduced from Sprint 1 onward throw `AppError` rather
 * than raw strings/Errors, so calling code (hooks, the Error Boundary, toast
 * triggers) can rely on one consistent shape instead of guessing at what a
 * given service might throw.
 */

export type AppErrorCode =
  'VALIDATION_ERROR' | 'NOT_FOUND' | 'PERMISSION_DENIED' | 'NETWORK_ERROR' | 'UNKNOWN_ERROR';

/**
 * A normalized application error. `isOperational` distinguishes expected,
 * handle-able failures (e.g. a validation error, a permission-denied
 * response) from unexpected programming errors — the Error Boundary uses
 * this distinction to decide whether a friendly inline message is enough,
 * or whether the failure is serious enough to log at a higher severity.
 */
export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly isOperational: boolean;
  override readonly cause?: unknown;

  constructor(
    message: string,
    options: {
      code?: AppErrorCode;
      isOperational?: boolean;
      cause?: unknown;
    } = {},
  ) {
    super(message);
    this.name = 'AppError';
    this.code = options.code ?? 'UNKNOWN_ERROR';
    this.isOperational = options.isOperational ?? true;
    this.cause = options.cause;

    // Maintains a proper stack trace in V8 environments (Node, Chrome) when
    // extending a built-in like Error via a subclass.
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * Safely extracts a human-readable message from a value caught in a
 * `catch (error: unknown)` block, without assuming it's actually an Error
 * instance (thrown values in JS/TS can be anything).
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return 'An unknown error occurred.';
  }
}

/**
 * Normalizes any thrown value into an AppError, so downstream code (the
 * Error Boundary, toast triggers) only ever has to handle one shape.
 */
export function toAppError(error: unknown, fallbackMessage = 'Something went wrong.'): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message || fallbackMessage, {
      cause: error,
      isOperational: false,
    });
  }

  return new AppError(getErrorMessage(error) || fallbackMessage, {
    cause: error,
    isOperational: false,
  });
}
