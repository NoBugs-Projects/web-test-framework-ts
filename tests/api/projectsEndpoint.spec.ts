import { test, expect } from '../../src/utils/testFixtures';
import { AdminSteps } from '../../src/adminSteps/adminSteps';
import { ApiConfig } from '../../src/configs/apiConfig';
import { DataGenerator } from '../../src/generator/dataGenerator';
import { assertThatModels } from '../../src/models/comparison/modelComparison';
import {
  HTTP_STATUS,
  ERROR_MESSAGES,
  TEST_TAGS,
} from '../../src/utils/constants';

test.describe('Project Endpoint Tests', () => {
  let adminSteps: AdminSteps;

  test.beforeEach(async ({ page }) => {
    adminSteps = new AdminSteps(page, { validateResponses: true });
  });

  test(
    'User should be able to create project with valid parent project as _Root',
    { tag: [TEST_TAGS.POSITIVE, TEST_TAGS.CRUD] },
    async ({ testDataStorage }) => {
      // Step: Create project with _Root as parent - unique data generated automatically
      const projectResult = await adminSteps.expectSuccess(
        () =>
          adminSteps.createProject({
            locator: '_Root',
            copyAllAssociatedSettings: true,
          }),
        HTTP_STATUS.OK
      );

      // Step: Verify project was created by sending GET request
      const verificationResponse = await adminSteps.expectSuccess(
        () => adminSteps.getProject(projectResult.project.id),
        HTTP_STATUS.OK
      );

      // Step: Verify the retrieved project matches the created one using model comparison
      assertThatModels(projectResult.request, verificationResponse).contains({
        ignoreFields: [
          'href',
          'webUrl',
          'parentProjectId',
          'parentProject',
          'buildTypes',
          'templates',
          'parameters',
          'vcsRoots',
          'projectFeatures',
          'projects',
          'cloudProfiles',
          'agentPools',
          'builds',
          'investigations',
          'compatibleAgents',
          'compatibleCloudImages',
        ],
      });
    }
  );

  test(
    'User should be able to create nested project in existing project',
    { tag: [TEST_TAGS.POSITIVE, TEST_TAGS.CRUD] },
    async ({ testDataStorage }) => {
      // Step: Create parent project - unique data generated automatically
      const parentProjectResult = await adminSteps.expectSuccess(
        () =>
          adminSteps.createProject({
            locator: '_Root',
            copyAllAssociatedSettings: true,
          }),
        HTTP_STATUS.OK
      );

      // Step: Create nested project in parent project - unique data generated automatically
      const nestedProjectResult = await adminSteps.expectSuccess(
        () =>
          adminSteps.createProject({
            locator: parentProjectResult.project.id,
            copyAllAssociatedSettings: true,
          }),
        HTTP_STATUS.OK
      );

      // Step: Verify nested project was created by sending GET request
      const verificationResponse = await adminSteps.expectSuccess(
        () => adminSteps.getProject(nestedProjectResult.project.id),
        HTTP_STATUS.OK
      );

      // Step: Verify the retrieved nested project matches the created one using model comparison
      assertThatModels(
        nestedProjectResult.request,
        verificationResponse
      ).contains({
        ignoreFields: [
          'href',
          'webUrl',
          'parentProjectId',
          'parentProject',
          'buildTypes',
          'templates',
          'parameters',
          'vcsRoots',
          'projectFeatures',
          'projects',
          'cloudProfiles',
          'agentPools',
          'builds',
          'investigations',
          'compatibleAgents',
          'compatibleCloudImages',
        ],
      });

      // Step: Verify the nested project has the correct parent
      expect(verificationResponse.parentProjectId).toBe(
        parentProjectResult.project.id
      );
    }
  );

  test(
    'User should not be able to create project with non-existing parent project',
    { tag: [TEST_TAGS.NEGATIVE, TEST_TAGS.CRUD] },
    async ({ testDataStorage }) => {
      // Step: Try to create project with invalid parent project ID
      await adminSteps.expectFailure(
        () =>
          adminSteps.createProject({
            locator: 'non_existing_project_id',
            copyAllAssociatedSettings: true,
          }),
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.NOT_FOUND
      );
    }
  );

  test(
    'User should not be able to create project with duplicate ID',
    { tag: [TEST_TAGS.NEGATIVE, TEST_TAGS.CRUD] },
    async ({ testDataStorage }) => {
      // Step: Create first project - unique data generated automatically
      const firstProjectResult = await adminSteps.expectSuccess(
        () =>
          adminSteps.createProject({
            locator: '_Root',
            copyAllAssociatedSettings: true,
          }),
        HTTP_STATUS.OK
      );

      // Step: Try to create second project with same ID
      await adminSteps.expectFailure(
        () =>
          adminSteps.createProject({
            id: firstProjectResult.project.id, // Same ID as first project
            locator: '_Root',
            copyAllAssociatedSettings: true,
          }),
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.ALREADY_USED
      );
    }
  );

  test(
    'User should not be able to create project with duplicate name',
    { tag: [TEST_TAGS.NEGATIVE, TEST_TAGS.CRUD] },
    async ({ testDataStorage }) => {
      // Step: Create first project - unique data generated automatically
      const firstProjectResult = await adminSteps.expectSuccess(
        () =>
          adminSteps.createProject({
            locator: '_Root',
            copyAllAssociatedSettings: true,
          }),
        HTTP_STATUS.OK
      );

      // Step: Try to create second project with same name
      await adminSteps.expectFailure(
        () =>
          adminSteps.createProject({
            name: firstProjectResult.project.name, // Same name as first project
            locator: '_Root',
            copyAllAssociatedSettings: true,
          }),
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.ALREADY_USED
      );
    }
  );
});
