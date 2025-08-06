import { Page } from "@playwright/test";

export const headers = async (page: Page) => {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
  };
};
