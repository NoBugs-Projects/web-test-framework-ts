import { Page, APIResponse } from '@playwright/test';
import { Environment } from '../configs/environment';
import { Logger } from '../utils/logger';
import { HttpClient, ApiResponse, HttpClientOptions } from './httpClient';
import { ApiConfig } from '../configs/apiConfig';

export interface RequestOptions {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  validateResponse?: boolean;
  logRequest?: boolean;
  logResponse?: boolean;
  expectedStatus?: number | number[];
  ignoreErrors?: boolean;
}

export interface RequestContext {
  method: string;
  url: string;
  data?: any;
  headers?: Record<string, string>;
  options?: RequestOptions;
}

export class BaseRequester {
  protected httpClient: HttpClient;
  protected logger: Logger;
  protected environment: Environment;

  constructor(page: Page, options: HttpClientOptions = {}) {
    this.environment = Environment.getInstance();
    this.logger = new Logger({
      logLevel: this.environment.getLogLevel() === 'debug' ? 3 : 2,
      enableConsole: this.environment.isLoggingEnabled(),
      enableFile: this.environment.isFileLoggingEnabled(),
      logFile: this.environment.getLogFilePath(),
    });

    // Create HTTP client with environment config
    const httpClientOptions: HttpClientOptions = {
      timeout: this.environment.getTimeout(),
      retries: this.environment.getRetries(),
      validateStatus: (status: number) => status >= 200 && status < 300,
      ...options,
    };

    const apiConfig = new ApiConfig({
      protocol: 'http',
      port: 8111,
      timeout: httpClientOptions.timeout || 30000,
      retries: httpClientOptions.retries || 3,
      defaultHeaders: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.httpClient = new HttpClient(page, apiConfig, httpClientOptions);
  }

  /**
   * Execute a request with comprehensive logging and error handling
   */
  protected async executeRequest<T>(
    context: RequestContext
  ): Promise<ApiResponse<T>> {
    const { method, url, data, headers, options } = context;
    const requestOptions = options || {};

    // Log request if enabled
    if (requestOptions.logRequest !== false) {
      this.logger.info(`Executing ${method} request`, {
        url,
        data,
        headers: this.sanitizeHeaders(headers),
        options: requestOptions,
      });
    }

    try {
      let response: ApiResponse<T>;

      switch (method.toUpperCase()) {
        case 'GET':
          response = await this.httpClient.get<T>(url, headers);
          break;
        case 'POST':
          response = await this.httpClient.post<T>(url, data, headers);
          break;
        case 'PUT':
          response = await this.httpClient.put<T>(url, data, headers);
          break;
        case 'DELETE':
          response = await this.httpClient.delete<T>(url, headers);
          break;
        case 'PATCH':
          response = await this.httpClient.patch<T>(url, data, headers);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }

      // Log response if enabled
      if (requestOptions.logResponse !== false) {
        this.logger.info(`Received ${method} response`, {
          status: response.status,
          success: response.success,
          data: response.data,
          headers: this.sanitizeHeaders(response.headers),
        });
      }

      // Validate response if enabled
      if (requestOptions.validateResponse !== false && !response.success) {
        this.logger.error(`Request failed`, {
          method,
          url,
          status: response.status,
          error: response.error,
        });
        throw new Error(`Request failed: ${response.error}`);
      }

      return response;
    } catch (error) {
      this.logger.error(`Request execution failed`, {
        method,
        url,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Execute a request with retry logic
   */
  protected async executeRequestWithRetry<T>(
    context: RequestContext,
    maxRetries: number = this.environment.getRetries()
  ): Promise<ApiResponse<T>> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.executeRequest<T>(context);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries) {
          this.logger.warn(`Request attempt ${attempt} failed, retrying...`, {
            url: context.url,
            error: lastError.message,
            nextAttempt: attempt + 1,
          });

          // Exponential backoff
          await this.delay(Math.pow(2, attempt - 1) * 1000);
        }
      }
    }

    throw lastError || new Error('Request failed after all retries');
  }

  /**
   * Execute a batch of requests
   */
  protected async executeBatchRequests<T>(
    contexts: RequestContext[]
  ): Promise<ApiResponse<T>[]> {
    const results: ApiResponse<T>[] = [];
    const errors: Error[] = [];

    for (const context of contexts) {
      try {
        const response = await this.executeRequest<T>(context);
        results.push(response);
      } catch (error) {
        errors.push(error instanceof Error ? error : new Error(String(error)));
        results.push({
          status: 0,
          data: null as T,
          headers: {},
          url: context.url,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (errors.length > 0) {
      this.logger.warn(`Batch request completed with ${errors.length} errors`, {
        total: contexts.length,
        successful: results.length - errors.length,
        failed: errors.length,
      });
    }

    return results;
  }

  /**
   * Execute parallel requests
   */
  protected async executeParallelRequests<T>(
    contexts: RequestContext[],
    maxConcurrency: number = 5
  ): Promise<ApiResponse<T>[]> {
    const results: ApiResponse<T>[] = [];
    const chunks = this.chunkArray(contexts, maxConcurrency);

    for (const chunk of chunks) {
      const chunkPromises = chunk.map((context) =>
        this.executeRequest<T>(context)
      );
      const chunkResults = await Promise.allSettled(chunkPromises);

      for (const result of chunkResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            status: 0,
            data: null as T,
            headers: {},
            url: 'unknown',
            success: false,
            error:
              result.reason instanceof Error
                ? result.reason.message
                : String(result.reason),
          });
        }
      }
    }

    return results;
  }

  /**
   * Sanitize headers for logging (remove sensitive information)
   */
  private sanitizeHeaders(
    headers?: Record<string, string>
  ): Record<string, string> {
    if (!headers) return {};

    const sanitized: Record<string, string> = {};
    const sensitiveKeys = [
      'authorization',
      'cookie',
      'x-csrf-token',
      'x-tc-csrf-token',
      'x-api-key',
      'x-auth-token',
      'bearer',
    ];

    for (const [key, value] of Object.entries(headers)) {
      if (sensitiveKeys.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Delay execution for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Split array into chunks for parallel processing
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Get the underlying HTTP client for advanced usage
   */
  getHttpClient(): HttpClient {
    return this.httpClient;
  }

  /**
   * Get the logger instance
   */
  getLogger(): Logger {
    return this.logger;
  }

  /**
   * Get the environment configuration
   */
  getEnvironment(): Environment {
    return this.environment;
  }
}
