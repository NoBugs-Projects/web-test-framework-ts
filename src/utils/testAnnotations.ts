import { test as base } from "@playwright/test";
import { PageManager } from "../pages/pageManager";
import { admin } from "./loginCredentials";
import { TestDataStorage } from "./testDataStorage";

// Create a test that automatically logs in as admin and includes testDataStorage
export const testWithAdmin = base.extend({
  testDataStorage: async ({}, use) => {
    const storage = TestDataStorage.getInstance();
    await use(storage);
  },
  pageManager: async ({ page }, use) => {
    const pageManager = new PageManager(page);
    await pageManager.loginPage().goToLoginPage();
    await pageManager.loginPage().login(admin.username, admin.password);
    await use(pageManager);
  },
});

// Create a test that automatically logs in with custom credentials
export const testWithLogin = base.extend({
  testDataStorage: async ({}, use) => {
    const storage = TestDataStorage.getInstance();
    await use(storage);
  },
  pageManager: async ({ page }, use) => {
    const pageManager = new PageManager(page);
    await pageManager.loginPage().goToLoginPage();
    await pageManager.loginPage().login(admin.username, admin.password);
    await use(pageManager);
  },
});

// Export the original test for cases where we don't need login
export { test, expect } from "@playwright/test";
