import { Page } from "@playwright/test";
import { BaseRequester, RequestContext, RequestOptions } from "./baseRequester";
import { Environment, AuthRole } from "../configs/environment";
import { HttpClientOptions } from "./httpClient";

export interface RoleBasedRequestContext extends RequestContext {
  authRole?: AuthRole;
}

export class Requester extends BaseRequester {
  constructor(page: Page, options: HttpClientOptions = {}) {
    super(page, options);
  }

  /**
   * Execute a request with role-based authentication
   */
  async executeRequestWithRole<T>(
    context: RoleBasedRequestContext,
  ): Promise<any> {
    const { authRole = this.environment.getDefaultAuthRole(), ...requestContext } = context;
    
    // Get authenticated URL for the specified role
    const authenticatedUrl = this.environment.getAuthenticatedUrl(authRole);
    
    // Build the full URL with authentication
    const fullUrl = this.buildFullUrl(authenticatedUrl, requestContext.url);
    
    // Execute the request with the authenticated URL
    const authenticatedContext: RequestContext = {
      ...requestContext,
      url: fullUrl,
    };

    return this.executeRequest<T>(authenticatedContext);
  }

  /**
   * Execute a request with retry logic and role-based authentication
   */
  async executeRequestWithRoleAndRetry<T>(
    context: RoleBasedRequestContext,
    maxRetries: number = this.environment.getRetries(),
  ): Promise<any> {
    const { authRole = this.environment.getDefaultAuthRole(), ...requestContext } = context;
    
    // Get authenticated URL for the specified role
    const authenticatedUrl = this.environment.getAuthenticatedUrl(authRole);
    
    // Build the full URL with authentication
    const fullUrl = this.buildFullUrl(authenticatedUrl, requestContext.url);
    
    // Execute the request with the authenticated URL
    const authenticatedContext: RequestContext = {
      ...requestContext,
      url: fullUrl,
    };

    return this.executeRequestWithRetry<T>(authenticatedContext, maxRetries);
  }

  /**
   * Execute a batch of requests with role-based authentication
   */
  async executeBatchRequestsWithRole<T>(
    contexts: RoleBasedRequestContext[],
  ): Promise<any[]> {
    const authenticatedContexts: RequestContext[] = contexts.map(context => {
      const { authRole = this.environment.getDefaultAuthRole(), ...requestContext } = context;
      const authenticatedUrl = this.environment.getAuthenticatedUrl(authRole);
      const fullUrl = this.buildFullUrl(authenticatedUrl, requestContext.url);
      
      return {
        ...requestContext,
        url: fullUrl,
      };
    });

    return this.executeBatchRequests<T>(authenticatedContexts);
  }

  /**
   * Execute parallel requests with role-based authentication
   */
  async executeParallelRequestsWithRole<T>(
    contexts: RoleBasedRequestContext[],
    maxConcurrency: number = 5,
  ): Promise<any[]> {
    const authenticatedContexts: RequestContext[] = contexts.map(context => {
      const { authRole = this.environment.getDefaultAuthRole(), ...requestContext } = context;
      const authenticatedUrl = this.environment.getAuthenticatedUrl(authRole);
      const fullUrl = this.buildFullUrl(authenticatedUrl, requestContext.url);
      
      return {
        ...requestContext,
        url: fullUrl,
      };
    });

    return this.executeParallelRequests<T>(authenticatedContexts, maxConcurrency);
  }

  /**
   * Build full URL by combining authenticated base URL with endpoint
   */
  private buildFullUrl(authenticatedBaseUrl: string, endpoint: string): string {
    // Remove leading slash from endpoint if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    
    // Handle authenticated URL format: http://:token@host:port or http://user:pass@host:port
    if (authenticatedBaseUrl.includes('@')) {
      // Extract the base URL without the path
      const urlParts = authenticatedBaseUrl.split('/');
      const protocol = urlParts[0]; // http:
      const authAndHost = urlParts[2]; // :token@host:port or user:pass@host:port
      
      // Construct the full URL
      return `${protocol}//${authAndHost}/${cleanEndpoint}`;
    } else {
      // Fallback for non-authenticated URLs
      return `${authenticatedBaseUrl}/${cleanEndpoint}`;
    }
  }

  /**
   * Get available authentication roles
   */
  getAvailableRoles(): AuthRole[] {
    return this.environment.getAvailableAuthRoles();
  }

  /**
   * Check if a role is available
   */
  hasRole(role: AuthRole): boolean {
    return this.environment.hasAuthRole(role);
  }

  /**
   * Get the default authentication role
   */
  getDefaultRole(): AuthRole {
    return this.environment.getDefaultAuthRole();
  }

  /**
   * Get authentication credentials for a specific role
   */
  getAuthCredentials(role: AuthRole) {
    return this.environment.getAuthCredentials(role);
  }

  /**
   * Convenience methods for common HTTP operations with role-based auth
   */
  async getWithRole<T>(endpoint: string, authRole?: AuthRole, headers?: Record<string, string>): Promise<any> {
    return this.executeRequestWithRole<T>({
      method: "GET",
      url: endpoint,
      headers,
      authRole,
    });
  }

  async postWithRole<T>(endpoint: string, data?: any, authRole?: AuthRole, headers?: Record<string, string>): Promise<any> {
    return this.executeRequestWithRole<T>({
      method: "POST",
      url: endpoint,
      data,
      headers,
      authRole,
    });
  }

  async putWithRole<T>(endpoint: string, data?: any, authRole?: AuthRole, headers?: Record<string, string>): Promise<any> {
    return this.executeRequestWithRole<T>({
      method: "PUT",
      url: endpoint,
      data,
      headers,
      authRole,
    });
  }

  async deleteWithRole<T>(endpoint: string, authRole?: AuthRole, headers?: Record<string, string>): Promise<any> {
    return this.executeRequestWithRole<T>({
      method: "DELETE",
      url: endpoint,
      headers,
      authRole,
    });
  }

  async patchWithRole<T>(endpoint: string, data?: any, authRole?: AuthRole, headers?: Record<string, string>): Promise<any> {
    return this.executeRequestWithRole<T>({
      method: "PATCH",
      url: endpoint,
      data,
      headers,
      authRole,
    });
  }
} 