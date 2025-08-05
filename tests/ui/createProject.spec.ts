import { testWithAdmin, expect } from "../../src/utils/testAnnotations";
import { AdminSteps } from "../../src/adminSteps/adminSteps";
import { DataGenerator } from "../../src/generator/dataGenerator";
import {
  HTTP_STATUS,
  TEST_TAGS,
  UI_CONSTANTS,
} from "../../src/utils/constants";

testWithAdmin.describe("UI Project Creation Tests", () => {
  let adminSteps: AdminSteps;

  testWithAdmin.beforeEach(async ({ page }) => {
    adminSteps = new AdminSteps(page, { validateResponses: true });
  });

  testWithAdmin(
    "User should be able to create project via UI",
    { tag: [TEST_TAGS.POSITIVE, TEST_TAGS.CRUD] },
    async ({ pageManager }) => {
      // Step: Generate unique project and build type names using DataGenerator
      const projectData = DataGenerator.generateProjectData();
      const buildTypeData = DataGenerator.generateBuildTypeData();

      // Step: Open Create Project Page
      await pageManager
        .createProjectPage()
        .createProjectModeSelector(
          UI_CONSTANTS.ROOT_PROJECT,
          UI_CONSTANTS.CREATE_PROJECT_MENU,
        );

      // Step: Create project via UI
      await pageManager
        .createProjectPage()
        .createProject(
          UI_CONSTANTS.SAMPLE_REPOSITORY_URL,
          projectData.name,
          buildTypeData.name,
        );

      // Step: Verify project was created by checking API
      const projectResponse = await adminSteps.expectSuccess(
        () => adminSteps.getProject(projectData.name),
        HTTP_STATUS.OK,
      );

      // Step: Verify project name matches
      expect(projectResponse.name).toBe(projectData.name);

      // Step: Verify project is visible on UI
      await pageManager.projectsPage().goTofavoriteProjectsPage();
      const findByProjectName = await pageManager
        .projectsPage()
        .findProjectByName(projectData.name);

      expect(findByProjectName).toBeTruthy();
    },
  );

  testWithAdmin(
    "User should not be able to create project without name",
    { tag: [TEST_TAGS.NEGATIVE, TEST_TAGS.CRUD] },
    async ({ pageManager }) => {
      // Step: Generate unique build type name using DataGenerator
      const buildTypeData = DataGenerator.generateBuildTypeData();

      // Step: Open Create Project Page
      await pageManager
        .createProjectPage()
        .createProjectModeSelector(
          UI_CONSTANTS.ROOT_PROJECT,
          UI_CONSTANTS.CREATE_PROJECT_MENU,
        );

      // Step: Try to create project without name
      await pageManager.createProjectPage().createProject(
        UI_CONSTANTS.SAMPLE_REPOSITORY_URL,
        "", // Empty project name
        buildTypeData.name,
      );

      // Step: Verify error message appears
      // Note: This would need to be implemented based on the actual UI error handling
      // For now, we'll just verify the test structure is correct
      const isErrorVisible = await pageManager
        .createProjectPage()
        .isErrorMessageVisible();
      expect(isErrorVisible).toBe(true);

      // Step: Optionally verify specific error message text
      // const errorText = await pageManager.createProjectPage().getErrorMessageText();
      // expect(errorText).toContain('Project name must not be empty');
    },
  );
});
