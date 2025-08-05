import { test as base } from "@playwright/test";
import { TestDataStorage } from "./testDataStorage";

export interface TestFixtures {
  testDataStorage: TestDataStorage;
}

export const test = base.extend<TestFixtures>({
  testDataStorage: async ({}, use) => {
    const storage = TestDataStorage.getInstance();

    // Clear any existing entities before test
    storage.clear();

    // Use the storage during test
    await use(storage);

    // Clean up all collected entities after test
    await storage.cleanupAll();
  },
});

// Export the original test for cases where we don't need CI detection
export { expect } from "@playwright/test";
