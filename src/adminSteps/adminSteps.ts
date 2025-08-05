import { Page, expect } from "@playwright/test";
import { HttpClient, ApiResponse } from "../requesters/httpClient";
import { DataGenerator } from "../generator/dataGenerator";
import { HTTP_STATUS, ERROR_MESSAGES, ROLES } from "../utils/constants";
import { ApiConfig } from "../configs/apiConfig";
import { ModelAssertions } from "../models/comparison/modelAssertions";
import {
  CreateProjectRequestModel,
  ProjectResponseModel,
} from "../models/projectModels";

export interface AdminStepsOptions {
  config?: any;
  enableLogging?: boolean;
  validateResponses?: boolean;
}

export class AdminSteps {
  private httpClient: HttpClient;
  private config: ApiConfig;
  private options: AdminStepsOptions;

  constructor(page: Page, options: AdminStepsOptions = {}) {
    this.config = options.config || ApiConfig.createTeamCityConfig();
    this.options = {
      enableLogging: true,
      validateResponses: true,
      ...options,
    };
    this.httpClient = new HttpClient(page, this.config, {
      enableAutoCleanup: true,
    });
  }

  /**
   * Generate unique identifier for test data
   */
  private generateUniqueId(prefix: string): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);
    return `${prefix}_${timestamp}_${randomSuffix}`;
  }

  /**
   * Create project with automatic unique data generation
   */
  async createProject(
    projectData?: Partial<CreateProjectRequestModel>,
  ): Promise<{
    request: CreateProjectRequestModel;
    response: ApiResponse<ProjectResponseModel>;
    project: ProjectResponseModel;
  }> {
    // Generate unique data if not provided
    const uniqueId = this.generateUniqueId("test_project");
    const uniqueName = this.generateUniqueId("TestProject");

    const finalProjectData = DataGenerator.generateProjectData({
      name: projectData?.name || uniqueName,
      id: projectData?.id || uniqueId,
      ...projectData,
    });

    const response = await this.httpClient.post<ProjectResponseModel>(
      "/app/rest/projects",
      finalProjectData,
    );

    if (this.options.validateResponses && !response.success) {
      throw new Error(`Failed to create project: ${response.error}`);
    }

    return {
      request: finalProjectData,
      response,
      project: response.data,
    };
  }

  /**
   * Create a project and get its token (if applicable)
   */
  async createProjectWithToken(
    projectData?: Partial<CreateProjectRequestModel>,
  ): Promise<{
    project: ProjectResponseModel;
    token?: string;
  }> {
    const result = await this.createProject(projectData);

    // In TeamCity, projects don't have tokens, but we could extend this for other systems
    const token = await this.getProjectToken(result.project.id);

    return {
      project: result.project,
      token,
    };
  }

  /**
   * Delete a project by ID
   */
  async deleteProject(projectId: string): Promise<ApiResponse<void>> {
    const response = await this.httpClient.delete<void>(
      `/app/rest/projects/id:${projectId}`,
    );

    if (this.options.validateResponses && !response.success) {
      throw new Error(
        `Failed to delete project ${projectId}: ${response.error}`,
      );
    }

    return response;
  }

  /**
   * Get project by ID
   */
  async getProject(projectId: string): Promise<ProjectResponseModel> {
    const response = await this.httpClient.get<ProjectResponseModel>(
      `/app/rest/projects/id:${projectId}`,
    );

    if (this.options.validateResponses && !response.success) {
      throw new Error(`Failed to get project ${projectId}: ${response.error}`);
    }

    return ProjectResponseModel.fromObject(response.data);
  }

  /**
   * Get all projects
   */
  async getAllProjects(): Promise<ProjectResponseModel[]> {
    const response = await this.httpClient.get<{
      project: ProjectResponseModel[];
    }>("/app/rest/projects");

    if (this.options.validateResponses && !response.success) {
      throw new Error(`Failed to get projects: ${response.error}`);
    }

    return response.data.project.map((project) =>
      ProjectResponseModel.fromObject(project),
    );
  }

  /**
   * Update project (not supported in TeamCity, but kept for compatibility)
   */
  async updateProject(
    projectId: string,
    updateData: Partial<ProjectResponseModel>,
  ): Promise<ProjectResponseModel> {
    // TeamCity doesn't support PUT for projects, so we'll just return the current project
    const currentProject = await this.getProject(projectId);
    console.warn(
      `Update project not supported in TeamCity. Returning current project: ${projectId}`,
    );
    return currentProject;
  }

  /**
   * Create multiple projects
   */
  async createMultipleProjects(
    count: number,
    baseData?: Partial<CreateProjectRequestModel>,
  ): Promise<ProjectResponseModel[]> {
    const projects: ProjectResponseModel[] = [];

    for (let i = 0; i < count; i++) {
      const projectData = baseData
        ? {
            ...baseData,
            name: `${baseData.name}_${i + 1}`,
            id: `${baseData.id}_${i + 1}`, // Make IDs unique
          }
        : undefined;
      const result = await this.createProject(projectData);
      projects.push(result.project);
    }

    return projects;
  }

  /**
   * Clean up projects by pattern
   */
  async cleanupProjectsByPattern(pattern: string): Promise<number> {
    const allProjects = await this.getAllProjects();
    const projectsToDelete = allProjects.filter(
      (project) =>
        project.name.includes(pattern) || project.id.includes(pattern),
    );

    let deletedCount = 0;
    for (const project of projectsToDelete) {
      try {
        await this.deleteProject(project.id);
        deletedCount++;
      } catch (error) {
        console.warn(`Failed to delete project ${project.id}: ${error}`);
      }
    }

    return deletedCount;
  }

  /**
   * Validate project structure
   */
  async validateProjectStructure(
    project: ProjectResponseModel,
  ): Promise<boolean> {
    try {
      // Simple validation - check that required fields exist and are strings
      expect(typeof project.id).toBe("string");
      expect(typeof project.name).toBe("string");
      expect(typeof project.href).toBe("string");
      expect(typeof project.webUrl).toBe("string");
      expect(project.id.length).toBeGreaterThan(0);
      expect(project.name.length).toBeGreaterThan(0);
      return true;
    } catch (error) {
      console.error("Project structure validation failed:", error);
      return false;
    }
  }

  /**
   * Get server information
   */
  async getServerInfo(): Promise<any> {
    const response = await this.httpClient.get<any>("/app/rest/server");

    if (this.options.validateResponses && !response.success) {
      throw new Error(`Failed to get server info: ${response.error}`);
    }

    return response.data;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const serverInfo = await this.getServerInfo();
      return !!(serverInfo && serverInfo.version);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get project token (placeholder for future implementation)
   */
  private async getProjectToken(
    projectId: string,
  ): Promise<string | undefined> {
    // This is a placeholder - in TeamCity, projects don't have tokens
    // But this could be implemented for other systems
    return undefined;
  }

  /**
   * Batch operations
   */
  async batchCreateProjects(
    projectDataList: Partial<CreateProjectRequestModel>[],
  ): Promise<ProjectResponseModel[]> {
    const results: ProjectResponseModel[] = [];

    for (const projectData of projectDataList) {
      const result = await this.createProject(projectData);
      results.push(result.project);
    }

    return results;
  }

  async batchDeleteProjects(
    projectIds: string[],
  ): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const projectId of projectIds) {
      try {
        await this.deleteProject(projectId);
        success.push(projectId);
      } catch (error) {
        failed.push(projectId);
      }
    }

    return { success, failed };
  }

  // Build Type Management Methods
  async createBuildType(
    buildTypeData?: Partial<any>,
  ): Promise<ApiResponse<any>> {
    // Generate unique build type ID if not provided
    const uniqueId = this.generateUniqueId("test_build_type");
    const uniqueName = this.generateUniqueId("TestBuildType");

    const finalBuildTypeData = DataGenerator.generateBuildTypeData({
      id: buildTypeData?.id || uniqueId,
      name: buildTypeData?.name || uniqueName,
      ...buildTypeData,
    });

    const response = await this.httpClient.post<any>(
      "/app/rest/buildTypes",
      finalBuildTypeData,
    );

    if (this.options.validateResponses && !response.success) {
      // Preserve the original server error message for better error handling
      const errorMessage = response.error || response.data || "Unknown error";
      throw new Error(`Failed to create build type: ${errorMessage}`);
    }

    return response;
  }

  async getBuildType(buildTypeId: string): Promise<ApiResponse<any>> {
    const response = await this.httpClient.get<any>(
      `/app/rest/buildTypes/id:${buildTypeId}`,
    );

    if (this.options.validateResponses && !response.success) {
      throw new Error(
        `Failed to get build type ${buildTypeId}: ${response.error}`,
      );
    }

    return response;
  }

  async deleteBuildType(buildTypeId: string): Promise<ApiResponse<void>> {
    const response = await this.httpClient.delete<void>(
      `/app/rest/buildTypes/id:${buildTypeId}`,
    );

    if (this.options.validateResponses && !response.success) {
      throw new Error(
        `Failed to delete build type ${buildTypeId}: ${response.error}`,
      );
    }

    return response;
  }

  async getAllBuildTypes(): Promise<ApiResponse<any>> {
    const response = await this.httpClient.get<any>("/app/rest/buildTypes");

    if (this.options.validateResponses && !response.success) {
      throw new Error(`Failed to get build types: ${response.error}`);
    }

    return response;
  }

  // User Management Methods
  async createUser(userData?: Partial<any>): Promise<ApiResponse<any>> {
    // Generate unique username if not provided
    const uniqueUsername = this.generateUniqueId("test_user");

    const finalUserData = DataGenerator.generateUserData({
      username: userData?.username || uniqueUsername,
      ...userData,
    });

    const response = await this.httpClient.post<any>(
      "/app/rest/users",
      finalUserData,
    );

    if (this.options.validateResponses && !response.success) {
      throw new Error(`Failed to create user: ${response.error}`);
    }

    return response;
  }

  async getUser(username: string): Promise<ApiResponse<any>> {
    const response = await this.httpClient.get<any>(
      `/app/rest/users/username:${username}`,
    );

    if (this.options.validateResponses && !response.success) {
      throw new Error(`Failed to get user ${username}: ${response.error}`);
    }

    return response;
  }

  async deleteUser(username: string): Promise<ApiResponse<void>> {
    const response = await this.httpClient.delete<void>(
      `/app/rest/users/username:${username}`,
    );

    if (this.options.validateResponses && !response.success) {
      throw new Error(`Failed to delete user ${username}: ${response.error}`);
    }

    return response;
  }

  // Role Management Methods
  async assignProjectRole(
    projectId: string,
    username: string,
    role: string,
  ): Promise<ApiResponse<any>> {
    const roleData = {
      username,
      roleId: role,
    };

    // TeamCity uses PUT for role assignment, not POST
    const response = await this.httpClient.put<any>(
      `/app/rest/projects/id:${projectId}/roles`,
      roleData,
    );

    if (this.options.validateResponses && !response.success) {
      throw new Error(
        `Failed to assign role ${role} to user ${username} in project ${projectId}: ${response.error}`,
      );
    }

    return response;
  }

  async getProjectRoles(projectId: string): Promise<ApiResponse<any>> {
    const response = await this.httpClient.get<any>(
      `/app/rest/projects/id:${projectId}/roles`,
    );

    if (this.options.validateResponses && !response.success) {
      throw new Error(
        `Failed to get roles for project ${projectId}: ${response.error}`,
      );
    }

    return response;
  }

  /**
   * Generic wrapper for testing positive cases - expects any operation to succeed with specific status code and success message
   */
  async expectSuccess<T>(
    operation: () => Promise<T>,
    expectedStatus: number = HTTP_STATUS.OK,
    expectedSuccessMessage?: string,
  ): Promise<T> {
    try {
      const response = await operation();

      // Check if the response has a status property (ApiResponse)
      if (response && typeof response === "object" && "status" in response) {
        const apiResponse = response as any;
        if (apiResponse.status !== expectedStatus) {
          throw new Error(
            `Expected status ${expectedStatus} but got ${apiResponse.status}`,
          );
        }

        // Check if the response contains the expected success message (if provided)
        if (expectedSuccessMessage) {
          const responseData = JSON.stringify(apiResponse.data || apiResponse);
          if (
            !responseData
              .toLowerCase()
              .includes(expectedSuccessMessage.toLowerCase())
          ) {
            throw new Error(
              `Expected success message to contain "${expectedSuccessMessage}" but got: ${responseData}`,
            );
          }
        }
      }

      return response;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Expected operation to succeed with status ${expectedStatus} but it failed: ${error.message}`,
        );
      }
      throw error;
    }
  }

  /**
   * Generic wrapper for testing negative cases - expects any operation to fail with specific status code and error message
   */
  async expectFailure<T>(
    operation: () => Promise<T>,
    expectedStatus: number,
    expectedErrorMessage?: string,
  ): Promise<void> {
    try {
      const response = await operation();
      throw new Error(
        `Expected operation to fail with status ${expectedStatus} but it succeeded`,
      );
    } catch (error) {
      if (error instanceof Error) {
        // Check if the error message contains the expected status code
        if (
          !error.message.includes(`status ${expectedStatus}`) &&
          !error.message.includes(
            `Request failed with status ${expectedStatus}`,
          ) &&
          !error.message.includes(`status code: ${expectedStatus}`)
        ) {
          throw new Error(
            `Expected status ${expectedStatus} but got different error: ${error.message}`,
          );
        }

        // Check if the error message contains the expected error message (if provided)
        if (expectedErrorMessage) {
          // Look for the expected error message in the full error message
          const fullErrorMessage = error.message;
          if (
            !fullErrorMessage
              .toLowerCase()
              .includes(expectedErrorMessage.toLowerCase())
          ) {
            throw new Error(
              `Expected error message to contain "${expectedErrorMessage}" but got: ${fullErrorMessage}`,
            );
          }
        }

        // If we reach here, the error is as expected
        return;
      }
      throw error;
    }
  }
}
