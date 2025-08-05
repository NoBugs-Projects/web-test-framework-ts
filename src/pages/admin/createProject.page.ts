import { Page, Locator } from '@playwright/test';
import { getIPAddress, getPort } from '../../utils/getLocalIpAddress';

export class CreateProject {
  readonly page: Page;
  readonly repositoryUrlInput: Locator;
  readonly proceedButton: Locator;
  readonly projectNameInput: Locator;
  readonly buildTypeNameInput: Locator;
  readonly proceedSecondButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.repositoryUrlInput = page.locator('#url');
    this.proceedButton = page.locator('input[name="createProjectFromUrl"]');
    this.projectNameInput = page.locator('#projectName');
    this.buildTypeNameInput = page.locator('#buildTypeName');
    this.proceedSecondButton = page.locator('input[value="Proceed"]');
    this.errorMessage = page.locator('.error-message');
  }

  async createProjectModeSelector(projectId: string, mode: string) {
    const ipAddress = await getIPAddress();
    const port = await getPort();
    await this.page.goto(
      `http://${ipAddress}:${port}/admin/createObjectMenu.html?projectId=${projectId}&showMode=${mode}`
    );
  }

  async createProject(
    repositoryUrl: string,
    projectNameInput: string,
    buildTypeNameInput: string
  ) {
    await this.repositoryUrlInput.fill(repositoryUrl);
    await this.proceedButton.click();
    await this.projectNameInput.fill(projectNameInput);
    await this.buildTypeNameInput.fill(buildTypeNameInput);
    await this.proceedSecondButton.click();
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
}
