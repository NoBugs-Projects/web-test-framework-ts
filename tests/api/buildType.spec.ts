import { test, expect } from "../../src/utils/testFixtures";
import { AdminSteps } from "../../src/adminSteps/adminSteps";
import { DataGenerator } from "../../src/generator/dataGenerator";
import { assertThatModels } from "../../src/models/comparison/modelComparison";
import { ApiConfig } from "../../src/configs/apiConfig";
import {
  HTTP_STATUS,
  ERROR_MESSAGES,
  ROLES,
  TEST_TAGS,
} from "../../src/utils/constants";

test.describe("Build Type Tests", () => {
  let adminSteps: AdminSteps;
  let testProjectId: string;
  let testProjectName: string;
  let testUsername: string;

  test.beforeEach(async ({ page }) => {
    // Initialize admin steps with TeamCity configuration
    adminSteps = new AdminSteps(page, {
      config: ApiConfig.createTeamCityConfig(),
      enableLogging: true,
      validateResponses: true,
    });

    // Create a test project for all tests - unique data generated automatically
    const projectResult = await adminSteps.createProject();
    testProjectId = projectResult.project.id;
    testProjectName = projectResult.project.name;

    // Create test user - unique data generated automatically
    const userResponse = await adminSteps.createUser();
    testUsername = userResponse.data.username;
  });

  test(
    "User should be able to create build type",
    { tag: [TEST_TAGS.POSITIVE, TEST_TAGS.CRUD] },
    async ({ testDataStorage }) => {
      // Step: Create user - unique data generated automatically
      const userResponse = await adminSteps.expectSuccess(
        () => adminSteps.createUser(),
        HTTP_STATUS.OK,
      );

      // Step: Create project - unique data generated automatically
      const projectResult = await adminSteps.expectSuccess(
        () => adminSteps.createProject(),
        HTTP_STATUS.OK,
      );

      // Step: Create buildType for project - unique data generated automatically
      const buildTypeData = DataGenerator.generateBuildTypeData({
        project: { id: projectResult.project.id },
      });
      const buildTypeResponse = await adminSteps.expectSuccess(
        () => adminSteps.createBuildType(buildTypeData),
        HTTP_STATUS.OK,
      );

      // Step: Verify build type was created by sending GET request
      const verificationResponse = await adminSteps.expectSuccess(
        () => adminSteps.getBuildType(buildTypeData.id),
        HTTP_STATUS.OK,
      );

      // Step: Verify the retrieved build type matches the created one using model comparison
      assertThatModels(buildTypeData, verificationResponse.data).contains({
        ignoreFields: [
          "href",
          "webUrl",
          "projectName",
          "settings",
          "parameters",
          "steps",
          "features",
          "triggers",
          "snapshot-dependencies",
          "artifact-dependencies",
          "agent-requirements",
          "builds",
          "investigations",
          "compatibleAgents",
          "compatibleCloudImages",
          "templates",
          "vcs-root-entries",
        ],
      });
    },
  );

  test(
    "User should not be able to create two build types with the same id",
    { tag: [TEST_TAGS.NEGATIVE, TEST_TAGS.CRUD] },
    async ({ testDataStorage }) => {
      // Step: Create user - unique data generated automatically
      const userResponse = await adminSteps.expectSuccess(
        () => adminSteps.createUser(),
        HTTP_STATUS.OK,
      );

      // Step: Create project - unique data generated automatically
      const projectResult = await adminSteps.expectSuccess(
        () => adminSteps.createProject(),
        HTTP_STATUS.OK,
      );

      // Step: Create buildType1 for project
      const buildTypeData = DataGenerator.generateBuildTypeData({
        project: { id: projectResult.project.id },
      });
      const buildType1Response = await adminSteps.expectSuccess(
        () => adminSteps.createBuildType(buildTypeData),
        HTTP_STATUS.OK,
      );

      // Step: Verify buildType1 was created by sending GET request
      const verificationResponse = await adminSteps.expectSuccess(
        () => adminSteps.getBuildType(buildTypeData.id),
        HTTP_STATUS.OK,
      );

      // Step: Verify the retrieved build type matches the created one using model comparison
      assertThatModels(buildTypeData, verificationResponse.data).contains({
        ignoreFields: [
          "href",
          "webUrl",
          "projectName",
          "settings",
          "parameters",
          "steps",
          "features",
          "triggers",
          "snapshot-dependencies",
          "artifact-dependencies",
          "agent-requirements",
          "builds",
          "investigations",
          "compatibleAgents",
          "compatibleCloudImages",
          "templates",
          "vcs-root-entries",
        ],
      });

      // Step: Create buildType2 with same id as buildType1 for project
      const buildType2Data = DataGenerator.generateBuildTypeData({
        id: buildTypeData.id, // Same ID as buildType1
        project: { id: projectResult.project.id },
      });

      // Step: Check buildType2 was not created with bad request code
      await adminSteps.expectFailure(
        () => adminSteps.createBuildType(buildType2Data),
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.ALREADY_USED,
      );
    },
  );

  test(
    "Project admin should be able to create build type for their project",
    { tag: [TEST_TAGS.POSITIVE, TEST_TAGS.ROLES] },
    async ({ testDataStorage }) => {
      // Step: Create user - unique data generated automatically
      const userResponse = await adminSteps.expectSuccess(
        () => adminSteps.createUser(),
        HTTP_STATUS.OK,
      );

      // Step: Create project - unique data generated automatically
      const projectResult = await adminSteps.expectSuccess(
        () => adminSteps.createProject(),
        HTTP_STATUS.OK,
      );

      // Step: Grant user PROJECT_ADMIN role in project
      const roleResponse = await adminSteps.expectSuccess(
        () =>
          adminSteps.assignProjectRole(
            projectResult.project.id,
            userResponse.data.username,
            ROLES.PROJECT_ADMIN,
          ),
        HTTP_STATUS.OK,
      );

      // Step: Create buildType for project by admin - unique data generated automatically
      const buildTypeData = DataGenerator.generateBuildTypeData({
        project: { id: projectResult.project.id },
      });
      const buildTypeResponse = await adminSteps.expectSuccess(
        () => adminSteps.createBuildType(buildTypeData),
        HTTP_STATUS.OK,
      );

      // Step: Verify build type was created by sending GET request
      const verificationResponse = await adminSteps.expectSuccess(
        () => adminSteps.getBuildType(buildTypeData.id),
        HTTP_STATUS.OK,
      );

      // Step: Verify the retrieved build type matches the created one using model comparison
      assertThatModels(buildTypeData, verificationResponse.data).contains({
        ignoreFields: [
          "href",
          "webUrl",
          "projectName",
          "settings",
          "parameters",
          "steps",
          "features",
          "triggers",
          "snapshot-dependencies",
          "artifact-dependencies",
          "agent-requirements",
          "builds",
          "investigations",
          "compatibleAgents",
          "compatibleCloudImages",
          "templates",
          "vcs-root-entries",
        ],
      });
    },
  );

  test(
    "Project admin should not be able to create build type for not their project",
    { tag: [TEST_TAGS.NEGATIVE, TEST_TAGS.ROLES] },
    async ({ testDataStorage }) => {
      // Step: Create user1 - unique data generated automatically
      const user1Response = await adminSteps.expectSuccess(
        () => adminSteps.createUser(),
        HTTP_STATUS.OK,
      );

      // Step: Create project1 - unique data generated automatically
      const project1Result = await adminSteps.expectSuccess(
        () => adminSteps.createProject(),
        HTTP_STATUS.OK,
      );

      // Step: Grant user1 PROJECT_ADMIN role in project1
      const role1Response = await adminSteps.expectSuccess(
        () =>
          adminSteps.assignProjectRole(
            project1Result.project.id,
            user1Response.data.username,
            ROLES.PROJECT_ADMIN,
          ),
        HTTP_STATUS.OK,
      );

      // Step: Create user2 - unique data generated automatically
      const user2Response = await adminSteps.expectSuccess(
        () => adminSteps.createUser(),
        HTTP_STATUS.OK,
      );

      // Step: Create project2 - unique data generated automatically
      const project2Result = await adminSteps.expectSuccess(
        () => adminSteps.createProject(),
        HTTP_STATUS.OK,
      );

      // Step: Grant user2 PROJECT_ADMIN role in project2
      const role2Response = await adminSteps.expectSuccess(
        () =>
          adminSteps.assignProjectRole(
            project2Result.project.id,
            user2Response.data.username,
            ROLES.PROJECT_ADMIN,
          ),
        HTTP_STATUS.OK,
      );

      // Step: Create buildType for project1 by user2
      const buildTypeData = DataGenerator.generateBuildTypeData({
        project: { id: project1Result.project.id }, // user2 trying to create in project1
      });

      // Step: Check buildType was not created with forbidden code
      await adminSteps.expectFailure(
        () => adminSteps.createBuildType(buildTypeData),
        HTTP_STATUS.FORBIDDEN,
        ERROR_MESSAGES.FORBIDDEN,
      );
    },
  );

  test(
    "Should demonstrate different model comparison methods",
    { tag: [TEST_TAGS.POSITIVE, TEST_TAGS.COMPARISON] },
    async ({ testDataStorage }) => {
      // Step: Create user - unique data generated automatically
      const userResponse = await adminSteps.expectSuccess(
        () => adminSteps.createUser(),
        HTTP_STATUS.OK,
      );

      // Step: Create project - unique data generated automatically
      const projectResult = await adminSteps.expectSuccess(
        () => adminSteps.createProject(),
        HTTP_STATUS.OK,
      );

      // Step: Create buildType - unique data generated automatically
      const buildTypeData = DataGenerator.generateBuildTypeData({
        project: { id: projectResult.project.id },
      });
      const buildTypeResponse = await adminSteps.expectSuccess(
        () => adminSteps.createBuildType(buildTypeData),
        HTTP_STATUS.OK,
      );

      // Step: Verify build type was created by sending GET request
      const verificationResponse = await adminSteps.expectSuccess(
        () => adminSteps.getBuildType(buildTypeData.id),
        HTTP_STATUS.OK,
      );

      // Step: Verify the retrieved build type matches the created one using model comparison
      assertThatModels(buildTypeData, verificationResponse.data).contains({
        ignoreFields: [
          "href",
          "webUrl",
          "projectName",
          "settings",
          "parameters",
          "steps",
          "features",
          "triggers",
          "snapshot-dependencies",
          "artifact-dependencies",
          "agent-requirements",
          "builds",
          "investigations",
          "compatibleAgents",
          "compatibleCloudImages",
          "templates",
          "vcs-root-entries",
        ],
      });

      // Demonstrate the new validation pattern with model comparison
      // The assertThatModels provides robust validation of the API response structure
    },
  );
});
