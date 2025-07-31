/**
 * Error handling utilities
 */

export class GameError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'GameError';
  }
}

export class ErrorHandler {
  private static onError: ((error: Error) => void) | null = null;

  /**
   * Set global error handler
   */
  static setErrorHandler(handler: (error: Error) => void): void {
    this.onError = handler;
  }

  /**
   * Handle and log errors
   */
  static handle(error: Error, context?: string): void {
    const message = context ? `[${context}] ${error.message}` : error.message;
    console.error(message, error);

    if (this.onError) {
      this.onError(error);
    }
  }

  /**
   * Safe DOM element retrieval
   */
  static getRequiredElement(id: string): HTMLElement {
    const element = document.getElementById(id);
    if (!element) {
      throw new GameError(`Required DOM element not found: ${id}`, 'DOM_ELEMENT_NOT_FOUND');
    }
    return element;
  }

  /**
   * Safe async operation wrapper
   */
  static async safeAsync<T>(
    operation: () => Promise<T>,
    context: string,
    fallback?: T
  ): Promise<T | undefined> {
    try {
      return await operation();
    } catch (error) {
      this.handle(error instanceof Error ? error : new Error(String(error)), context);
      return fallback;
    }
  }

  /**
   * Safe sync operation wrapper
   */
  static safe<T>(
    operation: () => T,
    context: string,
    fallback?: T
  ): T | undefined {
    try {
      return operation();
    } catch (error) {
      this.handle(error instanceof Error ? error : new Error(String(error)), context);
      return fallback;
    }
  }
}