import { Page } from "@playwright/test";
import { BaseRequester, RequestContext, RequestOptions } from "./baseRequester";
import { ApiResponse } from "./httpClient";
import { DataGenerator } from "../generator/dataGenerator";
import { ModelAssertions } from "../models/comparison/modelAssertions";

export interface ApiRequestOptions extends RequestOptions {
  validateModel?: boolean;
  transformResponse?: (data: any) => any;
  expectedStatus?: number | number[];
  ignoreErrors?: boolean;
}

export interface ApiEndpoint {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  description: string;
  expectedStatus?: number | number[];
  requiresAuth?: boolean;
}

export class ApiRequester extends BaseRequester {
  private endpoints: Map<string, ApiEndpoint> = new Map();

  constructor(page: Page) {
    super(page);
    this.initializeEndpoints();
  }

  /**
   * Initialize API endpoints
   */
  private initializeEndpoints(): void {
    // TeamCity API endpoints
    this.endpoints.set("server.info", {
      path: "/app/rest/server",
      method: "GET",
      description: "Get server information",
      expectedStatus: 200,
    });

    this.endpoints.set("projects.create", {
      path: "/app/rest/projects",
      method: "POST",
      description: "Create a new project",
      expectedStatus: 200,
      requiresAuth: true,
    });

    this.endpoints.set("projects.get", {
      path: "/app/rest/projects",
      method: "GET",
      description: "Get all projects",
      expectedStatus: 200,
    });

    this.endpoints.set("project.get", {
      path: "/app/rest/projects/id:{id}",
      method: "GET",
      description: "Get project by ID",
      expectedStatus: 200,
    });

    this.endpoints.set("project.delete", {
      path: "/app/rest/projects/id:{id}",
      method: "DELETE",
      description: "Delete project by ID",
      expectedStatus: 204,
    });

    this.endpoints.set("buildTypes.create", {
      path: "/app/rest/buildTypes",
      method: "POST",
      description: "Create a new build type",
      expectedStatus: 200,
      requiresAuth: true,
    });

    this.endpoints.set("buildTypes.get", {
      path: "/app/rest/buildTypes",
      method: "GET",
      description: "Get all build types",
      expectedStatus: 200,
    });

    this.endpoints.set("buildType.get", {
      path: "/app/rest/buildTypes/id:{id}",
      method: "GET",
      description: "Get build type by ID",
      expectedStatus: 200,
    });

    this.endpoints.set("buildType.delete", {
      path: "/app/rest/buildTypes/id:{id}",
      method: "DELETE",
      description: "Delete build type by ID",
      expectedStatus: 204,
    });

    this.endpoints.set("buildTypes.create", {
      path: "/app/rest/buildTypes",
      method: "POST",
      description: "Create new build type",
      expectedStatus: 200,
    });

    // User management endpoints
    this.endpoints.set("users.create", {
      path: "/app/rest/users",
      method: "POST",
      description: "Create a new user",
      expectedStatus: 200,
      requiresAuth: true,
    });

    this.endpoints.set("user.get", {
      path: "/app/rest/users/username:{username}",
      method: "GET",
      description: "Get user by username",
      expectedStatus: 200,
    });

    this.endpoints.set("user.delete", {
      path: "/app/rest/users/username:{username}",
      method: "DELETE",
      description: "Delete user by username",
      expectedStatus: 204,
    });

    // Role management endpoints
    this.endpoints.set("project.roles.get", {
      path: "/app/rest/projects/id:{id}/roles",
      method: "GET",
      description: "Get project roles",
      expectedStatus: 200,
    });

    this.endpoints.set("project.role.assign", {
      path: "/app/rest/projects/id:{id}/roles",
      method: "PUT",
      description: "Assign role to user in project",
      expectedStatus: 200,
    });
  }

  /**
   * Execute API request using endpoint name
   */
  async executeApiRequest<T>(
    endpointName: string,
    data?: any,
    params?: Record<string, string>,
    options?: ApiRequestOptions,
  ): Promise<ApiResponse<T>> {
    const endpoint = this.endpoints.get(endpointName);
    if (!endpoint) {
      throw new Error(`Unknown endpoint: ${endpointName}`);
    }

    let path = endpoint.path;
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        path = path.replace(`{${key}}`, value);
      }
    }

    const context: RequestContext = {
      method: endpoint.method,
      url: path,
      data,
      options: {
        ...options,
        expectedStatus: options?.expectedStatus || endpoint.expectedStatus,
        validateResponse: options?.validateResponse ?? true,
      },
    };

    return await this.executeRequest<T>(context);
  }

  /**
   * Execute API request with retry logic
   */
  async executeApiRequestWithRetry<T>(
    endpointName: string,
    data?: any,
    params?: Record<string, string>,
    options?: ApiRequestOptions,
    maxRetries?: number,
  ): Promise<ApiResponse<T>> {
    const endpoint = this.endpoints.get(endpointName);
    if (!endpoint) {
      throw new Error(`Unknown endpoint: ${endpointName}`);
    }

    let path = endpoint.path;
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        path = path.replace(`{${key}}`, value);
      }
    }

    const context: RequestContext = {
      method: endpoint.method,
      url: path,
      data,
      options: {
        ...options,
        expectedStatus: options?.expectedStatus || endpoint.expectedStatus,
        validateResponse: options?.validateResponse ?? true,
      },
    };

    return await this.executeRequestWithRetry<T>(context, maxRetries);
  }

  /**
   * Execute batch API requests
   */
  async executeBatchApiRequests<T>(
    requests: Array<{
      endpointName: string;
      data?: any;
      params?: Record<string, string>;
      options?: ApiRequestOptions;
    }>,
  ): Promise<ApiResponse<T>[]> {
    const contexts: RequestContext[] = requests.map((request) => {
      const endpoint = this.endpoints.get(request.endpointName);
      if (!endpoint) {
        // Return a dummy context for unknown endpoints that will fail gracefully
        return {
          method: "GET",
          url: "/invalid/endpoint",
          data: undefined,
          options: {
            validateResponse: false,
            ignoreErrors: true,
          },
        };
      }

      let path = endpoint.path;
      if (request.params) {
        for (const [key, value] of Object.entries(request.params)) {
          path = path.replace(`{${key}}`, value);
        }
      }

      return {
        method: endpoint.method,
        url: path,
        data: request.data,
        options: {
          ...request.options,
          expectedStatus:
            request.options?.expectedStatus || endpoint.expectedStatus,
          validateResponse: request.options?.validateResponse ?? true,
        },
      };
    });

    return await this.executeBatchRequests<T>(contexts);
  }

  /**
   * Execute parallel API requests
   */
  async executeParallelApiRequests<T>(
    requests: Array<{
      endpointName: string;
      data?: any;
      params?: Record<string, string>;
      options?: ApiRequestOptions;
    }>,
    maxConcurrency?: number,
  ): Promise<ApiResponse<T>[]> {
    const contexts: RequestContext[] = requests.map((request) => {
      const endpoint = this.endpoints.get(request.endpointName);
      if (!endpoint) {
        throw new Error(`Unknown endpoint: ${request.endpointName}`);
      }

      let path = endpoint.path;
      if (request.params) {
        for (const [key, value] of Object.entries(request.params)) {
          path = path.replace(`{${key}}`, value);
        }
      }

      return {
        method: endpoint.method,
        url: path,
        data: request.data,
        options: {
          ...request.options,
          expectedStatus:
            request.options?.expectedStatus || endpoint.expectedStatus,
          validateResponse: request.options?.validateResponse ?? true,
        },
      };
    });

    return await this.executeParallelRequests<T>(contexts, maxConcurrency);
  }

  /**
   * General validation rule for successfully created entity
   */
  private validateSuccessfullyCreatedEntity<T>(
    response: ApiResponse<T>,
    expectedData: any,
    entityType: string = "entity",
  ): void {
    // Validate success status
    if (!response.success) {
      throw new Error(
        `${entityType} creation failed: ${response.status} - ${response.error || "Unknown error"}`,
      );
    }

    // Validate response structure contains expected data
    if (response.data && typeof response.data === "object") {
      ModelAssertions.assertContains(
        response.data,
        expectedData,
        `${entityType} response validation failed`,
      );
    }
  }

  /**
   * General validation rule for retrieved entity
   */
  private validateRetrievedEntity<T>(
    response: ApiResponse<T>,
    expectedData: any,
    entityType: string = "entity",
  ): void {
    // Validate success status
    if (!response.success) {
      throw new Error(
        `${entityType} retrieval failed: ${response.status} - ${response.error || "Unknown error"}`,
      );
    }

    // Validate response structure contains expected data
    if (response.data && typeof response.data === "object") {
      ModelAssertions.assertContains(
        response.data,
        expectedData,
        `${entityType} response validation failed`,
      );
    }
  }

  /**
   * Generic method to create entity with validation
   */
  async createEntityWithValidation<T>(
    endpointName: string,
    entityData: any,
    expectedFields: any,
    entityType: string = "Entity",
  ): Promise<ApiResponse<T>> {
    const response = await this.executeApiRequest<T>(
      endpointName,
      entityData,
      undefined,
      {
        validateModel: true,
      },
    );

    // Apply general validation rule for successfully created entity
    this.validateSuccessfullyCreatedEntity(
      response,
      expectedFields,
      entityType,
    );

    return response;
  }

  /**
   * Generic method to retrieve entity with validation
   */
  async getEntityWithValidation<T>(
    endpointName: string,
    params: Record<string, string>,
    expectedFields: any,
    entityType: string = "Entity",
  ): Promise<ApiResponse<T>> {
    const response = await this.executeApiRequest<T>(
      endpointName,
      undefined,
      params,
      {
        validateModel: true,
      },
    );

    // Apply general validation rule for retrieved entity
    this.validateRetrievedEntity(response, expectedFields, entityType);

    return response;
  }

  /**
   * Create project with validation
   */
  async createProjectWithValidation(
    projectData?: any,
  ): Promise<ApiResponse<any>> {
    const data = projectData || DataGenerator.generateProjectData();

    return await this.createEntityWithValidation<any>(
      "projects.create",
      data,
      {
        id: data.id,
        name: data.name,
      },
      "Project",
    );
  }

  /**
   * Create build type with validation
   */
  async createBuildTypeWithValidation(
    buildTypeData?: any,
  ): Promise<ApiResponse<any>> {
    const data = buildTypeData || DataGenerator.generateBuildTypeData();

    return await this.createEntityWithValidation<any>(
      "buildTypes.create",
      data,
      {
        id: data.id,
        name: data.name,
        project: data.project,
      },
      "BuildType",
    );
  }

  /**
   * Create user with validation
   */
  async createUserWithValidation(userData?: any): Promise<ApiResponse<any>> {
    const data = userData || DataGenerator.generateUserData();

    return await this.createEntityWithValidation<any>(
      "users.create",
      data,
      {
        username: data.username,
        email: data.email,
      },
      "User",
    );
  }

  /**
   * Get project with validation
   */
  async getProjectWithValidation(projectId: string): Promise<ApiResponse<any>> {
    return await this.getEntityWithValidation<any>(
      "project.get",
      { id: projectId },
      {
        id: projectId,
      },
      "Project",
    );
  }

  /**
   * Get build type with validation
   */
  async getBuildTypeWithValidation(
    buildTypeId: string,
  ): Promise<ApiResponse<any>> {
    return await this.getEntityWithValidation<any>(
      "buildType.get",
      { id: buildTypeId },
      {
        id: buildTypeId,
      },
      "BuildType",
    );
  }

  /**
   * Get projects with filtering
   */
  async getProjectsWithFilter(
    filter?: Record<string, any>,
  ): Promise<ApiResponse<any>> {
    const params: Record<string, string> = {};
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        params[key] = String(value);
      });
    }

    return await this.executeApiRequest<any>("projects.get", undefined, params);
  }

  /**
   * Delete project with confirmation
   */
  async deleteProjectWithConfirmation(
    projectId: string,
  ): Promise<ApiResponse<void>> {
    // First verify project exists
    await this.executeApiRequest("project.get", undefined, { id: projectId });

    // Then delete it
    return await this.executeApiRequest<void>("project.delete", undefined, {
      id: projectId,
    });
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.executeApiRequest<any>(
        "server.info",
        undefined,
        undefined,
        {
          ignoreErrors: true,
        },
      );
      return response.success && response.data && !!response.data.version;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get endpoint information
   */
  getEndpoint(endpointName: string): ApiEndpoint | undefined {
    return this.endpoints.get(endpointName);
  }

  /**
   * Add custom endpoint
   */
  addEndpoint(name: string, endpoint: ApiEndpoint): void {
    this.endpoints.set(name, endpoint);
  }

  /**
   * Remove endpoint
   */
  removeEndpoint(name: string): boolean {
    return this.endpoints.delete(name);
  }

  /**
   * List all endpoints
   */
  listEndpoints(): string[] {
    return Array.from(this.endpoints.keys());
  }

  /**
   * Validate response against expected model
   */
  validateResponseModel<T>(
    response: ApiResponse<T>,
    expectedModel: any,
  ): boolean {
    try {
      // Validate success status first
      if (!response.success) {
        this.logger.error(
          "Response validation failed: request was not successful",
          {
            status: response.status,
            error: response.error,
          },
        );
        return false;
      }

      // Validate response structure contains expected data
      if (response.data && typeof response.data === "object") {
        ModelAssertions.assertContains(response.data, expectedModel);
        return true;
      }

      this.logger.error(
        "Response validation failed: invalid response data structure",
      );
      return false;
    } catch (error) {
      this.logger.error("Response model validation failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Transform response data
   */
  transformResponseData<T>(
    response: ApiResponse<T>,
    transformer: (data: T) => any,
  ): ApiResponse<any> {
    return {
      ...response,
      data: transformer(response.data),
    };
  }
}
