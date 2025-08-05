import { Page, Locator, expect } from "@playwright/test";
import { getIPAddress, getPort } from "../utils/getLocalIpAddress";

export class LoginPage {
  readonly page: Page;
  readonly userNameField: Locator;
  readonly passwordField: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.userNameField = page.locator("#username");
    this.passwordField = page.locator("#password");
    this.loginButton = page.getByRole("button", { name: "Log in" });
  }

  async goToLoginPage() {
    const ipAddress = await getIPAddress();
    const port = await getPort();
    await this.page.goto(`http://${ipAddress}:${port}/login.html`);
  }

  /**
   * Log in to the system.
   *
   * @param {String} userName the username to log in with
   * @param {String} password the password to log in with
   */
  async login(userName: string, password: string) {
    await this.userNameField.fill(userName);
    await this.passwordField.fill(password);
    await this.loginButton.click();
    await expect(this.page.locator('span:text("New project...")')).toBeVisible({
      timeout: 10000,
    });
  }
}
