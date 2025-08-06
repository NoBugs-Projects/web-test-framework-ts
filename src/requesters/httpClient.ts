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
  private csrfToken: string | null = null;

  constructor(page: Page, config: ApiConfig, options: HttpClientOptions = {}) {
    this.page = page;
    this.config = config;
    this.options = options;
    this.environment = Environment.getInstance();
    this.testDataStorage = TestDataStorage.getInstance();

    this.logger = new Logger({
      logLevel: this.environment.getLogLevel() === "debug" ? 3 : 2,
      enableConsole: this.environment.isLoggingEnabled(),
      enableFile: this.environment.isFileLoggingEnabled(),
      logFile: this.environment.getLogFilePath(),
    });
  }

  /**
   * Get CSRF token from TeamCity server
   */
  private async getCsrfToken(): Promise<string | null> {
    try {
      // Use authenticated URL to get CSRF token
      const authenticatedUrl = this.environment.getAuthenticatedUrl("superuser");
      const response = await this.page.request.get(`${authenticatedUrl}/app/rest/csrf-token`);
      
      if (response.status() === 200) {
        const responseText = await response.text();
        const data = JSON.parse(responseText);
        return data.token || null;
      }
    } catch (error) {
      this.logger.warn("Failed to get CSRF token:", error);
    }
    return null;
  }

  /**
   * Ensure CSRF token is available for requests that need it
   */
  private async ensureCsrfToken(): Promise<void> {
    if (!this.csrfToken) {
      this.csrfToken = await this.getCsrfToken();
    }
  }

  private async getBaseUrl(): Promise<string> {
    return this.environment.getBaseUrl();
  }

  private async getDefaultHeaders(): Promise<Record<string, string>> {
    return {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
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
    // Check if the URL already includes authentication (contains @)
    const isAuthenticatedUrl = url.includes('@');
    
    let fullUrl: string;
    if (isAuthenticatedUrl) {
      // If URL already includes authentication, use it directly
      fullUrl = url;
    } else {
      // Otherwise, prepend the base URL
      const baseUrl = await this.getBaseUrl();
      fullUrl = `${baseUrl}${url}`;
    }
    
    const defaultHeaders = await this.getDefaultHeaders();

    // Get CSRF token for PUT operations (role assignments)
    const needsCsrfToken = method === "PUT";
    if (needsCsrfToken) {
      await this.ensureCsrfToken();
    }

    const requestHeaders = {
      ...defaultHeaders,
      ...this.config.defaultHeaders,
      ...additionalHeaders,
    };

    // Add CSRF token if available and needed
    if (needsCsrfToken && this.csrfToken) {
      requestHeaders["X-TC-CSRF-TOKEN"] = this.csrfToken;
    }

    const requestOptions: any = {
      headers: requestHeaders,
      timeout: this.options.timeout,
      data: data ? JSON.stringify(data) : undefined,
      failOnStatusCode: false,
      ignoreHTTPSErrors: true,
    };

    // Clear cookies before making the request to prevent CSRF token issues
    await this.page.context().clearCookies();

    // Log request
    this.logger.info("HTTP Request", {
      method,
      url: fullUrl,
      data,
      headers: requestHeaders,
    });

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

    // Read response text first to handle any extra characters
    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (error) {
      // If we can't parse JSON, check if it's an HTML response
      if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
        // Extract meaningful error information from HTML
        const errorMatch = responseText.match(/<title[^>]*>([^<]+)<\/title>/i);
        const errorMessage = errorMatch ? errorMatch[1] : 'HTML Error Response';
        
        throw new Error(`Server returned HTML instead of JSON: ${errorMessage}. Status: ${response.status()}`);
      } else {
        console.warn("Failed to parse JSON response:", error);
        console.warn("Response text:", responseText);
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to parse JSON response: ${errorMessage}`);
      }
    }
    
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
