import { Page, Locator } from '@playwright/test';
import { getIPAddress, getPort } from '../../utils/getLocalIpAddress';

export class CreateBuildType {
  readonly page: Page;
  readonly projectSelector: Locator;
  readonly buildTypeNameInput: Locator;
  readonly buildTypeIdInput: Locator;
  readonly createButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.projectSelector = page.locator('#projectId');
    this.buildTypeNameInput = page.locator('#buildTypeName');
    this.buildTypeIdInput = page.locator('#buildTypeId');
    this.createButton = page.locator('input[value="Create"]');
    this.errorMessage = page.locator('.error-message');
  }

  async goToCreateBuildTypePage() {
    const ipAddress = await getIPAddress();
    const port = await getPort();
    await this.page.goto(
      `http://${ipAddress}:${port}/admin/createObjectMenu.html?showMode=createBuildTypeMenu`
    );
  }

  async createBuildType(
    projectId: string,
    buildTypeName: string,
    buildTypeId?: string
  ) {
    // Select project
    await this.projectSelector.selectOption(projectId);

    // Fill build type name
    await this.buildTypeNameInput.fill(buildTypeName);

    // Fill build type ID if provided
    if (buildTypeId) {
      await this.buildTypeIdInput.fill(buildTypeId);
    }

    // Click create button
    await this.createButton.click();
  }

  async isErrorMessageVisible(): Promise<boolean> {
    try {
      await this.errorMessage.waitFor({ timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async getErrorMessageText(): Promise<string> {
    return (await this.errorMessage.textContent()) || '';
  }

  async isSuccessMessageVisible(): Promise<boolean> {
    try {
      await this.page.locator('.success-message').waitFor({ timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}
