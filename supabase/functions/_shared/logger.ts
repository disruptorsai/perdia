/**
 * Shared Logger Module for Supabase Edge Functions
 *
 * Provides consistent logging format across all Edge Functions.
 */

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * Logger class for consistent logging
 */
export class Logger {
  private functionName: string;

  constructor(functionName: string) {
    this.functionName = functionName;
  }

  /**
   * Format log message with timestamp and function name
   */
  private format(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const baseMessage = `[${timestamp}] [${this.functionName}] [${level}] ${message}`;

    if (data) {
      return `${baseMessage}\n${JSON.stringify(data, null, 2)}`;
    }

    return baseMessage;
  }

  /**
   * Log debug message
   */
  debug(message: string, data?: any): void {
    console.log(this.format(LogLevel.DEBUG, message, data));
  }

  /**
   * Log info message
   */
  info(message: string, data?: any): void {
    console.log(this.format(LogLevel.INFO, message, data));
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: any): void {
    console.warn(this.format(LogLevel.WARN, message, data));
  }

  /**
   * Log error message
   */
  error(message: string, error?: any): void {
    const errorData = error instanceof Error
      ? { message: error.message, stack: error.stack }
      : error;

    console.error(this.format(LogLevel.ERROR, message, errorData));
  }

  /**
   * Log function start
   */
  start(data?: any): void {
    this.info('Function started', data);
  }

  /**
   * Log function completion
   */
  complete(data?: any): void {
    this.info('Function completed successfully', data);
  }

  /**
   * Log function failure
   */
  failed(error: any): void {
    this.error('Function failed', error);
  }
}

/**
 * Create a logger instance for a function
 *
 * @param functionName - Name of the Edge Function
 * @returns Logger instance
 *
 * @example
 * ```typescript
 * const logger = createLogger('wordpress-publish');
 * logger.info('Publishing content', { contentId: '123' });
 * ```
 */
export function createLogger(functionName: string): Logger {
  return new Logger(functionName);
}
