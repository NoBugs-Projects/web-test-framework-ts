import { Page, Locator, expect } from "@playwright/test";
import { getIPAddress, getPort } from "../utils/getLocalIpAddress";

export class SetupPage {
  readonly page: Page;
  readonly restoreButton: Locator;
  readonly proceedButton: Locator;
  readonly dbTypeSelect: Locator;
  readonly acceptLicenseCheckbox: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.restoreButton = page.locator("#restoreButton");
    this.proceedButton = page.locator("#proceedButton");
    this.dbTypeSelect = page.locator("#dbType");
    this.acceptLicenseCheckbox = page.locator("#accept");
    this.submitButton = page.locator(".continueBlock > .submitButton");
  }

  async goToSetupPage() {
    const ipAddress = await getIPAddress();
    const port = await getPort();
    await this.page.goto(`http://${ipAddress}:${port}/`);
  }

  /**
   * Setup TeamCity server on first start.
   * This includes accepting license, choosing database type, etc.
   */
  async setupFirstStart() {
    // Wait for restore button to be visible (indicates first start page)
    await expect(this.restoreButton).toBeVisible(); // 8 minutes
    
    // Click proceed button
    await this.proceedButton.click();
    
    // Wait for database type selection to be visible
    await expect(this.dbTypeSelect).toBeVisible(); // 8 minutes
    
    // Click proceed again
    await this.proceedButton.click();
    
    // Wait for accept checkbox to exist and click it (following Java example)
    await expect(this.acceptLicenseCheckbox).toBeAttached({ timeout: 480000 }); // equivalent to should(exist)
    await this.acceptLicenseCheckbox.scrollIntoViewIfNeeded();
    await this.acceptLicenseCheckbox.click();
    
    // Submit the setup
    await this.submitButton.click();
    
  }
} 