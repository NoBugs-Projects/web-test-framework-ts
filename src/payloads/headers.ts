import { Page } from "@playwright/test";
import { getAuthTokenWithSuperuser } from "../utils/generateAuthToken";

export const headers = async (page: Page) => {
  const authToken = await getAuthTokenWithSuperuser({ page });
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-TC-CSRF-TOKEN": authToken ? authToken : "Could not retreive token",
  };
};
