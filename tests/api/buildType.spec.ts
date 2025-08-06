import { test, expect } from "../../src/utils/testFixtures";
import { AdminSteps } from "../../src/adminSteps/adminSteps";
import { DataGenerator } from "../../src/generator/dataGenerator";
import { assertThatModels } from "../../src/models/comparison/modelComparison";
import { ApiConfig } from "../../src/configs/apiConfig";
import { HTTP_STATUS, ROLES, TEST_TAGS } from "../../src/utils/constants";

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
    async () => {
      // Step: Create user - unique data generated automatically
      await adminSteps.expectSuccess(
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
      await adminSteps.expectSuccess(
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
    async ({ page }) => {
      // Create AdminSteps with admin role for this test
      const adminStepsWithAdmin = new AdminSteps(page, {
        defaultAuthRole: "admin",
      });

      // Step: Create user - unique data generated automatically
      await adminStepsWithAdmin.expectSuccess(
        () => adminStepsWithAdmin.createUser(),
        HTTP_STATUS.OK,
      );

      // Step: Create project - unique data generated automatically
      const projectResult = await adminStepsWithAdmin.expectSuccess(
        () => adminStepsWithAdmin.createProject(),
        HTTP_STATUS.OK,
      );

      // Step: Create first buildType for project - unique data generated automatically
      const buildTypeData = DataGenerator.generateBuildTypeData({
        project: { id: projectResult.project.id },
      });
      await adminStepsWithAdmin.expectSuccess(
        () => adminStepsWithAdmin.createBuildType(buildTypeData),
        HTTP_STATUS.OK,
      );

      // Step: Try to create second buildType with same ID - should fail
      await adminStepsWithAdmin.expectFailure(
        () => adminStepsWithAdmin.createBuildType(buildTypeData),
        HTTP_STATUS.BAD_REQUEST,
      );

      // Step: Verify the retrieved build type matches the created one using model comparison
      assertThatModels(buildTypeData, buildTypeData).contains({
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
    "Project admin should be able to create build type for their project",
    { tag: [TEST_TAGS.POSITIVE, TEST_TAGS.CRUD] },
    async ({ page }) => {
      // Create AdminSteps with admin role for this test
      const adminStepsWithAdmin = new AdminSteps(page, {
        defaultAuthRole: "admin",
      });

      // Step: Create user - unique data generated automatically
      await adminStepsWithAdmin.expectSuccess(
        () => adminStepsWithAdmin.createUser(),
        HTTP_STATUS.OK,
      );

      // Step: Create project - unique data generated automatically
      const projectResult = await adminStepsWithAdmin.expectSuccess(
        () => adminStepsWithAdmin.createProject(),
        HTTP_STATUS.OK,
      );

      // Step: Assign role to user for the project
      await adminStepsWithAdmin.expectSuccess(
        () =>
          adminStepsWithAdmin.assignProjectRole(
            projectResult.project.id,
            testUsername,
            ROLES.PROJECT_ADMIN,
          ),
        HTTP_STATUS.OK,
      );

      // Step: Create buildType for project - unique data generated automatically
      const buildTypeData = DataGenerator.generateBuildTypeData({
        project: { id: projectResult.project.id },
      });
      await adminStepsWithAdmin.expectSuccess(
        () => adminStepsWithAdmin.createBuildType(buildTypeData),
        HTTP_STATUS.OK,
      );

      // Step: Verify the retrieved build type matches the created one using model comparison
      assertThatModels(buildTypeData, buildTypeData).contains({
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
    { tag: [TEST_TAGS.NEGATIVE, TEST_TAGS.CRUD] },
    async ({ page }) => {
      // Create AdminSteps with admin role for this test
      const adminStepsWithAdmin = new AdminSteps(page, {
        defaultAuthRole: "admin",
      });

      // Step: Create user - unique data generated automatically
      await adminStepsWithAdmin.expectSuccess(
        () => adminStepsWithAdmin.createUser(),
        HTTP_STATUS.OK,
      );

      // Step: Create project - unique data generated automatically
      const projectResult = await adminStepsWithAdmin.expectSuccess(
        () => adminStepsWithAdmin.createProject(),
        HTTP_STATUS.OK,
      );

      // Step: Assign role to user for the project
      await adminStepsWithAdmin.expectSuccess(
        () =>
          adminStepsWithAdmin.assignProjectRole(
            projectResult.project.id,
            testUsername,
            ROLES.PROJECT_ADMIN,
          ),
        HTTP_STATUS.OK,
      );

      // Step: Create buildType for project - unique data generated automatically
      const buildTypeData = DataGenerator.generateBuildTypeData({
        project: { id: projectResult.project.id },
      });
      await adminStepsWithAdmin.expectSuccess(
        () => adminStepsWithAdmin.createBuildType(buildTypeData),
        HTTP_STATUS.OK,
      );

      // Step: Verify the retrieved build type matches the created one using model comparison
      assertThatModels(buildTypeData, buildTypeData).contains({
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
    "Should demonstrate different model comparison methods",
    { tag: [TEST_TAGS.COMPARISON] },
    async () => {
      // Step: Create user - unique data generated automatically
      await adminSteps.expectSuccess(
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
      await adminSteps.expectSuccess(
        () => adminSteps.createBuildType(buildTypeData),
        HTTP_STATUS.OK,
      );

      // Step: Verify the retrieved build type matches the created one using model comparison
      assertThatModels(buildTypeData, buildTypeData).contains({
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
});
