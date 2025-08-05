import { Page } from "@playwright/test";
import { getIPAddress, getPort } from "../utils/getLocalIpAddress";

export class ProjectsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goTofavoriteProjectsPage() {
    const ipAddress = await getIPAddress();
    const port = await getPort();
    await this.page.goto(`http://${ipAddress}:${port}/favorite/projects`);
  }
  async findProjectByName(projectName: string) {
    try {
      await this.page
        .locator(`text="${projectName}"`)
        .first()
        .waitFor({ timeout: 5000 });
      return true;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return false;
    }
  }
}
