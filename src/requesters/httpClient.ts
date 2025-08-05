import { Page, APIResponse } from '@playwright/test';
import { getIPAddress } from '../utils/getLocalIpAddress';
import { headers } from '../payloads/headers';
import { ApiConfig } from '../configs/apiConfig';
import { Logger } from '../utils/logger';
import { TestDataStorage } from '../utils/testDataStorage';

export interface HttpClientOptions {
  timeout?: number;
  retries?: number;
  validateStatus?: (status: number) => boolean;
  enableAutoCleanup?: boolean;
}

export interface ApiResponse<T = any> {
  status: number;
  data: T;
  headers: Record<string, string>;
  url: string;
  success: boolean;
  error?: string;
}

export class HttpClient {
  private page: Page;
  private config: ApiConfig;
  private logger: Logger;
  private options: HttpClientOptions;
  private testDataStorage: TestDataStorage;

  constructor(page: Page, config: ApiConfig, options: HttpClientOptions = {}) {
    this.page = page;
    this.config = config;
    this.logger = new Logger();
    this.options = {
      timeout: 30000,
      retries: 3,
      validateStatus: (status: number) => status >= 200 && status < 300,
      enableAutoCleanup: true,
      ...options,
    };
    this.testDataStorage = TestDataStorage.getInstance();
  }

  private async getBaseUrl(): Promise<string> {
    const ipAddress = await getIPAddress();
    return `${this.config.protocol}://${ipAddress}:${this.config.port}`;
  }

  private async getDefaultHeaders(): Promise<Record<string, string>> {
    return await headers(this.page);
  }

  private validateStatus(
    status: number,
    expectedStatus?: number | number[]
  ): boolean {
    if (expectedStatus) {
      if (Array.isArray(expectedStatus)) {
        return expectedStatus.includes(status);
      }
      return status === expectedStatus;
    }
    return this.options.validateStatus!(status);
  }

  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url: string,
    data?: any,
    additionalHeaders?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    const baseUrl = await this.getBaseUrl();
    const fullUrl = `${baseUrl}${url}`;
    const defaultHeaders = await this.getDefaultHeaders();

    const requestHeaders = {
      ...defaultHeaders,
      ...this.config.defaultHeaders,
      ...additionalHeaders,
    };

    const requestOptions: any = {
      headers: requestHeaders,
      timeout: this.options.timeout,
    };

    if (data) {
      requestOptions.data = data;
    }

    // Log request
    this.logger.logRequest(method, fullUrl, data, requestHeaders);

    let response: APIResponse;
    switch (method) {
      case 'GET':
        response = await this.page.request.get(fullUrl, requestOptions);
        break;
      case 'POST':
        response = await this.page.request.post(fullUrl, requestOptions);
        break;
      case 'PUT':
        response = await this.page.request.put(fullUrl, requestOptions);
        break;
      case 'DELETE':
        response = await this.page.request.delete(fullUrl, requestOptions);
        break;
      case 'PATCH':
        response = await this.page.request.patch(fullUrl, requestOptions);
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }

    let responseData: T;
    try {
      const contentType = response.headers()['content-type'] || '';
      if (contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = (await response.text()) as T;
      }
    } catch (error) {
      responseData = (await response.text()) as T;
    }

    const status = response.status();
    const isValidStatus = this.validateStatus(status);

    // Log response
    this.logger.logResponse(status, responseData, response.headers());

    return {
      status,
      data: responseData,
      headers: response.headers(),
      url: response.url(),
      success: isValidStatus,
      error: !isValidStatus
        ? typeof responseData === 'string'
          ? responseData
          : `Request failed with status ${status}`
        : undefined,
    };
  }

  // Core HTTP methods
  async get<T>(
    url: string,
    additionalHeaders?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return await this.makeRequest<T>('GET', url, undefined, additionalHeaders);
  }

  async post<T>(
    url: string,
    data?: any,
    additionalHeaders?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    const response = await this.makeRequest<T>(
      'POST',
      url,
      data,
      additionalHeaders
    );

    // Auto-collect created entities for cleanup
    if (this.options.enableAutoCleanup && response.success) {
      this.collectCreatedEntity(url, data, response);
    }

    return response;
  }

  async put<T>(
    url: string,
    data?: any,
    additionalHeaders?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return await this.makeRequest<T>('PUT', url, data, additionalHeaders);
  }

  async delete<T>(
    url: string,
    additionalHeaders?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return await this.makeRequest<T>(
      'DELETE',
      url,
      undefined,
      additionalHeaders
    );
  }

  async patch<T>(
    url: string,
    data?: any,
    additionalHeaders?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return await this.makeRequest<T>('PATCH', url, data, additionalHeaders);
  }

  /**
   * Collect created entity for automatic cleanup
   */
  private collectCreatedEntity(
    url: string,
    requestData: any,
    response: ApiResponse<any>
  ): void {
    try {
      // Determine entity type based on URL and response data
      if (url.includes('/app/rest/projects') && response.data?.id) {
        this.testDataStorage.addEntity({
          type: 'project',
          id: response.data.id,
          name: response.data.name,
          cleanupMethod: async () => {
            await this.delete(`/app/rest/projects/id:${response.data.id}`);
          },
        });
      } else if (url.includes('/app/rest/buildTypes') && response.data?.id) {
        this.testDataStorage.addEntity({
          type: 'buildType',
          id: response.data.id,
          name: response.data.name,
          cleanupMethod: async () => {
            await this.delete(`/app/rest/buildTypes/id:${response.data.id}`);
          },
        });
      } else if (url.includes('/app/rest/users') && response.data?.username) {
        this.testDataStorage.addEntity({
          type: 'user',
          id: response.data.username,
          username: response.data.username,
          cleanupMethod: async () => {
            await this.delete(
              `/app/rest/users/username:${response.data.username}`
            );
          },
        });
      }
    } catch (error) {
      // Don't fail the test if entity collection fails
      console.warn('Failed to collect entity for cleanup:', error);
    }
  }
}
