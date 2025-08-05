import { Page, APIResponse } from "@playwright/test";
import { getIPAddress } from "../utils/getLocalIpAddress";
import { headers } from "../payloads/headers";
import { ApiConfig } from "../configs/apiConfig";
import { Logger } from "../utils/logger";
import { TestDataStorage } from "../utils/testDataStorage";
import { Environment } from "../configs/environment";

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
  private environment: Environment;

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
    this.environment = Environment.getInstance();
  }

  private async getBaseUrl(): Promise<string> {
    // Use environment configuration for base URL
    return this.environment.getBaseUrl();
  }

  private async getDefaultHeaders(): Promise<Record<string, string>> {
    return await headers(this.page);
  }

  private validateStatus(
    status: number,
    expectedStatus?: number | number[],
  ): boolean {
    if (expectedStatus) {
      if (Array.isArray(expectedStatus)) {
        return expectedStatus.includes(status);
      }
      return status === expectedStatus;
    }
    return status >= 200 && status < 300;
  }

  private async makeRequest<T>(
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    url: string,
    data?: any,
    additionalHeaders?: Record<string, string>,
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
      case "GET":
        response = await this.page.request.get(fullUrl, requestOptions);
        break;
      case "POST":
        response = await this.page.request.post(fullUrl, requestOptions);
        break;
      case "PUT":
        response = await this.page.request.put(fullUrl, requestOptions);
        break;
      case "DELETE":
        response = await this.page.request.delete(fullUrl, requestOptions);
        break;
      case "PATCH":
        response = await this.page.request.patch(fullUrl, requestOptions);
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }

    const responseData = await response.json();
    const apiResponse: ApiResponse<T> = {
      status: response.status(),
      data: responseData,
      headers: response.headers(),
      url: fullUrl,
      success: this.validateStatus(response.status()),
    };

    // Log response
    this.logger.info(`HTTP Response (${apiResponse.status})`, {
      status: apiResponse.status,
      data: apiResponse.data,
      headers: apiResponse.headers,
    });

    // Collect created entity for cleanup if enabled
    if (this.options.enableAutoCleanup && method === "POST") {
      this.collectCreatedEntity(url, data, apiResponse);
    }

    return apiResponse;
  }

  async get<T>(
    url: string,
    additionalHeaders?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>("GET", url, undefined, additionalHeaders);
  }

  async post<T>(
    url: string,
    data?: any,
    additionalHeaders?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>("POST", url, data, additionalHeaders);
  }

  async put<T>(
    url: string,
    data?: any,
    additionalHeaders?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>("PUT", url, data, additionalHeaders);
  }

  async delete<T>(
    url: string,
    additionalHeaders?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>("DELETE", url, undefined, additionalHeaders);
  }

  async patch<T>(
    url: string,
    data?: any,
    additionalHeaders?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>("PATCH", url, data, additionalHeaders);
  }

  private collectCreatedEntity(
    url: string,
    requestData: any,
    response: ApiResponse<any>,
  ): void {
    if (response.success && response.data) {
      // Determine entity type based on URL and create appropriate TestEntity
      let entityType: "project" | "buildType" | "user" = "project";
      let entityId = response.data.id || response.data.username || "";
      let entityName = response.data.name || "";

      if (url.includes("/app/rest/buildTypes")) {
        entityType = "buildType";
      } else if (url.includes("/app/rest/users")) {
        entityType = "user";
        entityId = response.data.username || entityId;
      }

      this.testDataStorage.addEntity({
        type: entityType,
        id: entityId,
        name: entityName,
        username: response.data.username,
        cleanupMethod: async () => {
          // Mock cleanup method for CI environment
          console.log(`Mock cleanup for ${entityType} ${entityId}`);
        },
      });
    }
  }

  async cleanup(): Promise<void> {
    if (this.options.enableAutoCleanup) {
      await this.testDataStorage.cleanupAll();
    }
  }
}
