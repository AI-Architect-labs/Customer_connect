/**
 * Structured logging utility (FolderStructure.md §10 — generic, feature-agnostic
 * helper). This is the ONLY file in the codebase that should call
 * console.log/console.info directly — everywhere else, code imports `logger`
 * from here instead, so log formatting and level filtering stay consistent
 * and swapping in a real remote logging service later (e.g. Sentry, Cloud
 * Logging) touches this one file, not every call site.
 *
 * Level filtering: in production, `debug` logs are suppressed by default,
 * since they're intended for local development only. `info`, `warn`, and
 * `error` always log, in every environment.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogMeta {
  [key: string]: unknown;
}

const isProduction = process.env.NODE_ENV === 'production';

function formatMessage(level: LogLevel, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
}

function debug(message: string, meta?: LogMeta): void {
  if (isProduction) {
    return;
  }
  // eslint-disable-next-line no-console -- this file is the designated console wrapper
  console.log(formatMessage('debug', message), meta ?? '');
}

function info(message: string, meta?: LogMeta): void {
  // eslint-disable-next-line no-console -- this file is the designated console wrapper
  console.info(formatMessage('info', message), meta ?? '');
}

function warn(message: string, meta?: LogMeta): void {
  console.warn(formatMessage('warn', message), meta ?? '');
}

function error(message: string, meta?: LogMeta): void {
  console.error(formatMessage('error', message), meta ?? '');
}

export const logger = {
  debug,
  info,
  warn,
  error,
};
