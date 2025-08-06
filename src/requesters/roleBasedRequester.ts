import { Page } from "@playwright/test";
import { BaseRequester, RequestContext } from "./baseRequester";
import { Environment, AuthRole } from "../configs/environment";
import { HttpClientOptions } from "./httpClient";

export interface RoleBasedRequestContext extends RequestContext {
  authRole?: AuthRole;
}

export class RoleBasedRequester extends BaseRequester {
  private environment: Environment;
  private currentRole: AuthRole;

  constructor(page: Page, role: AuthRole = "superuser", options: HttpClientOptions = {}) {
    super(page, options);
    this.environment = Environment.getInstance();
    this.currentRole = role;
  }

  /**
   * Set the authentication role for subsequent requests
   */
  setAuthRole(role: AuthRole): void {
    if (!this.environment.hasAuthRole(role)) {
      throw new Error(`Authentication role '${role}' is not available. Available roles: ${this.environment.getAvailableAuthRoles().join(', ')}`);
    }
    this.currentRole = role;
  }

  /**
   * Get the current authentication role
   */
  getCurrentAuthRole(): AuthRole {
    return this.currentRole;
  }

  /**
   * Get available authentication roles
   */
  getAvailableAuthRoles(): AuthRole[] {
    return this.environment.getAvailableAuthRoles();
  }

  /**
   * Execute a request with role-based authentication
   */
  protected async executeRoleBasedRequest<T>(
    context: RoleBasedRequestContext,
  ): Promise<any> {
    const role = context.authRole || this.currentRole;
    
    // Get the authenticated URL for the specified role
    const authenticatedUrl = this.environment.getAuthenticatedUrl(role);
    
    // Update the URL to use the authenticated version
    const updatedContext: RequestContext = {
      ...context,
      url: context.url.replace(this.environment.getBaseUrl(), authenticatedUrl),
    };

    return this.executeRequest<T>(updatedContext);
  }

  /**
   * Execute a GET request with role-based authentication
   */
  async get<T>(url: string, role?: AuthRole, headers?: Record<string, string>): Promise<any> {
    return this.executeRoleBasedRequest<T>({
      method: "GET",
      url,
      headers,
      authRole: role,
    });
  }

  /**
   * Execute a POST request with role-based authentication
   */
  async post<T>(url: string, data?: any, role?: AuthRole, headers?: Record<string, string>): Promise<any> {
    return this.executeRoleBasedRequest<T>({
      method: "POST",
      url,
      data,
      headers,
      authRole: role,
    });
  }

  /**
   * Execute a PUT request with role-based authentication
   */
  async put<T>(url: string, data?: any, role?: AuthRole, headers?: Record<string, string>): Promise<any> {
    return this.executeRoleBasedRequest<T>({
      method: "PUT",
      url,
      data,
      headers,
      authRole: role,
    });
  }

  /**
   * Execute a DELETE request with role-based authentication
   */
  async delete<T>(url: string, role?: AuthRole, headers?: Record<string, string>): Promise<any> {
    return this.executeRoleBasedRequest<T>({
      method: "DELETE",
      url,
      headers,
      authRole: role,
    });
  }

  /**
   * Execute a PATCH request with role-based authentication
   */
  async patch<T>(url: string, data?: any, role?: AuthRole, headers?: Record<string, string>): Promise<any> {
    return this.executeRoleBasedRequest<T>({
      method: "PATCH",
      url,
      data,
      headers,
      authRole: role,
    });
  }

  /**
   * Execute a request with retry logic and role-based authentication
   */
  protected async executeRoleBasedRequestWithRetry<T>(
    context: RoleBasedRequestContext,
    maxRetries: number = this.environment.getRetries(),
  ): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.executeRoleBasedRequest<T>(context);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries) {
          this.getLogger().warn(`Request attempt ${attempt} failed, retrying...`, {
            url: context.url,
            role: context.authRole || this.currentRole,
            error: lastError.message,
            nextAttempt: attempt + 1,
          });

          // Exponential backoff
          await this.delay(Math.pow(2, attempt - 1) * 1000);
        }
      }
    }

    throw lastError || new Error("Request failed after all retries");
  }

  /**
   * Execute a batch of requests with role-based authentication
   */
  protected async executeRoleBasedBatchRequests<T>(
    contexts: RoleBasedRequestContext[],
  ): Promise<any[]> {
    const results: any[] = [];
    const errors: Error[] = [];

    for (const context of contexts) {
      try {
        const response = await this.executeRoleBasedRequest<T>(context);
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
      this.getLogger().warn(`Batch request completed with ${errors.length} errors`, {
        total: contexts.length,
        successful: results.length - errors.length,
        failed: errors.length,
      });
    }

    return results;
  }

  /**
   * Execute parallel requests with role-based authentication
   */
  protected async executeRoleBasedParallelRequests<T>(
    contexts: RoleBasedRequestContext[],
    maxConcurrency: number = 5,
  ): Promise<any[]> {
    const results: any[] = [];
    const chunks = this.chunkArray(contexts, maxConcurrency);

    for (const chunk of chunks) {
      const chunkPromises = chunk.map((context) =>
        this.executeRoleBasedRequest<T>(context),
      );
      const chunkResults = await Promise.allSettled(chunkPromises);

      for (const result of chunkResults) {
        if (result.status === "fulfilled") {
          results.push(result.value);
        } else {
          results.push({
            status: 0,
            data: null as T,
            headers: {},
            url: "unknown",
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
} 