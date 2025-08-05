import { testWithAdmin, expect } from "../../src/utils/testAnnotations";
import { AdminSteps } from "../../src/adminSteps/adminSteps";
import { DataGenerator } from "../../src/generator/dataGenerator";
import {
  HTTP_STATUS,
  TEST_TAGS,
  UI_CONSTANTS,
} from "../../src/utils/constants";

testWithAdmin.describe("UI Build Type Creation Tests", () => {
  let adminSteps: AdminSteps;
  let testProjectId: string;

  testWithAdmin.beforeEach(async ({ page }) => {
    adminSteps = new AdminSteps(page, { validateResponses: true });
  });

  testWithAdmin(
    "User should be able to create build type via UI",
    { tag: [TEST_TAGS.POSITIVE, TEST_TAGS.CRUD] },
    async ({ pageManager }) => {
      // Step: Create a test project first (needed for build type creation)
      const projectResult = await adminSteps.expectSuccess(
        () =>
          adminSteps.createProject({
            locator: UI_CONSTANTS.ROOT_PROJECT,
            copyAllAssociatedSettings: true,
          }),
        HTTP_STATUS.OK,
      );
      testProjectId = projectResult.project.id;

      // Step: Generate unique build type data using DataGenerator
      const buildTypeData = DataGenerator.generateBuildTypeData({
        project: { id: testProjectId },
      });

      // Step: Open Create Build Type Page
      await pageManager.createBuildTypePage().goToCreateBuildTypePage();

      // Step: Create build type via UI
      await pageManager
        .createBuildTypePage()
        .createBuildType(testProjectId, buildTypeData.name, buildTypeData.id);

      // Step: Verify build type was created by checking API
      const buildTypeResponse = await adminSteps.expectSuccess(
        () => adminSteps.getBuildType(buildTypeData.id),
        HTTP_STATUS.OK,
      );

      // Step: Verify build type name matches
      expect(buildTypeResponse.data.name).toBe(buildTypeData.name);
      expect(buildTypeResponse.data.id).toBe(buildTypeData.id);

      // Step: Verify success message appears on UI
      const isSuccessVisible = await pageManager
        .createBuildTypePage()
        .isSuccessMessageVisible();
      expect(isSuccessVisible).toBe(true);
    },
  );

  testWithAdmin(
    "User should not be able to create build type without name",
    { tag: [TEST_TAGS.NEGATIVE, TEST_TAGS.CRUD] },
    async ({ pageManager }) => {
      // Step: Create a test project first (needed for build type creation)
      const projectResult = await adminSteps.expectSuccess(
        () =>
          adminSteps.createProject({
            locator: UI_CONSTANTS.ROOT_PROJECT,
            copyAllAssociatedSettings: true,
          }),
        HTTP_STATUS.OK,
      );
      testProjectId = projectResult.project.id;

      // Step: Generate unique build type ID using DataGenerator
      const buildTypeData = DataGenerator.generateBuildTypeData({
        project: { id: testProjectId },
      });

      // Step: Open Create Build Type Page
      await pageManager.createBuildTypePage().goToCreateBuildTypePage();

      // Step: Try to create build type without name
      await pageManager.createBuildTypePage().createBuildType(
        testProjectId,
        "", // Empty build type name
        buildTypeData.id,
      );

      // Step: Verify error message appears
      const isErrorVisible = await pageManager
        .createBuildTypePage()
        .isErrorMessageVisible();
      expect(isErrorVisible).toBe(true);

      // Step: Optionally verify specific error message text
      // const errorText = await pageManager.createBuildTypePage().getErrorMessageText();
      // expect(errorText).toContain('Build type name must not be empty');
    },
  );

  testWithAdmin(
    "User should not be able to create build type with duplicate ID",
    { tag: [TEST_TAGS.NEGATIVE, TEST_TAGS.CRUD] },
    async ({ pageManager }) => {
      // Step: Create a test project first (needed for build type creation)
      const projectResult = await adminSteps.expectSuccess(
        () =>
          adminSteps.createProject({
            locator: UI_CONSTANTS.ROOT_PROJECT,
            copyAllAssociatedSettings: true,
          }),
        HTTP_STATUS.OK,
      );
      testProjectId = projectResult.project.id;

      // Step: Generate unique build type data using DataGenerator
      const buildTypeData = DataGenerator.generateBuildTypeData({
        project: { id: testProjectId },
      });

      // Step: Create first build type via API
      await adminSteps.expectSuccess(
        () => adminSteps.createBuildType(buildTypeData),
        HTTP_STATUS.OK,
      );

      // Step: Open Create Build Type Page
      await pageManager.createBuildTypePage().goToCreateBuildTypePage();

      // Step: Try to create second build type with same ID
      await pageManager.createBuildTypePage().createBuildType(
        testProjectId,
        "Different Name", // Different name but same ID
        buildTypeData.id, // Same ID as first build type
      );

      // Step: Verify error message appears
      const isErrorVisible = await pageManager
        .createBuildTypePage()
        .isErrorMessageVisible();
      expect(isErrorVisible).toBe(true);

      // Step: Optionally verify specific error message text
      // const errorText = await pageManager.createBuildTypePage().getErrorMessageText();
      // expect(errorText).toContain('already used');
    },
  );
});
