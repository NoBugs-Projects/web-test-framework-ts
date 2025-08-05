/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNSUPPORTED_MEDIA_TYPE: 415,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * Common Error Messages
 */
export const ERROR_MESSAGES = {
  ALREADY_USED: "already used",
  FORBIDDEN: "Forbidden",
  UNAUTHORIZED: "Unauthorized",
  NOT_FOUND: "Not Found",
  BAD_REQUEST: "Bad Request",
} as const;

/**
 * Test Tags
 */
export const TEST_TAGS = {
  POSITIVE: "@positive",
  NEGATIVE: "@negative",
  CRUD: "@crud",
  ROLES: "@roles",
  COMPARISON: "@comparison",
} as const;

/**
 * Entity Types for cleanup
 */
export const ENTITY_TYPES = {
  PROJECT: "project",
  BUILD_TYPE: "buildType",
  USER: "user",
} as const;

/**
 * Role Types
 */
export const ROLES = {
  PROJECT_ADMIN: "PROJECT_ADMIN",
  PROJECT_DEVELOPER: "PROJECT_DEVELOPER",
  PROJECT_VIEWER: "PROJECT_VIEWER",
} as const;

/**
 * UI Constants
 */
export const UI_CONSTANTS = {
  ROOT_PROJECT: "_Root",
  CREATE_PROJECT_MENU: "createProjectMenu",
  CREATE_BUILD_TYPE_MENU: "createBuildTypeMenu",
  SAMPLE_REPOSITORY_URL: "https://github.com/AlexPshe/spring-core-for-qa",
} as const;

/**
 * Admin Credentials
 */
export const ADMIN_CREDENTIALS = {
  USERNAME: "admin",
  PASSWORD: "admin",
} as const;
