import { test, expect } from "../../src/utils/testFixtures";
import { SetupPage } from "../../src/pages/setup.page";

test.describe("TeamCity Setup", () => {
  let setupPage: SetupPage;

  test.beforeEach(async ({ page }) => {
    setupPage = new SetupPage(page);
  });

  test("Setup TeamCity server on first start", async ({ page }) => {
    // Navigate to TeamCity setup page
    await setupPage.goToSetupPage();
    
    // Always run the setup process
    await setupPage.setupFirstStart();

  });
}); 