import PropertiesReader from "properties-reader";
import path from "path";

export type AuthRole = "superuser" | "admin" | "user";

export interface AuthCredentials {
  username?: string;
  password?: string;
  token?: string;
}

export interface EnvironmentConfig {
  baseUrl: string;
  apiVersion: string;
  timeout: number;
  retries: number;
  logLevel: "error" | "warn" | "info" | "debug";
  enableLogging: boolean;
  enableFileLogging: boolean;
  logFilePath?: string;
  isCI: boolean;
  defaultAuthRole: AuthRole;
}

export class Environment {
  private static instance: Environment;
  private config!: EnvironmentConfig;
  private properties: any;
  private authCredentials: Map<AuthRole, AuthCredentials> = new Map();

  private constructor() {
    this.loadConfig();
    this.loadAuthCredentials();
  }

  static getInstance(): Environment {
    if (!Environment.instance) {
      Environment.instance = new Environment();
    }
    return Environment.instance;
  }

  private loadConfig(): void {
    try {
      this.properties = PropertiesReader(
        path.join(process.cwd(), "config.properties"),
      );
    } catch {
      console.warn("Could not load config.properties, using defaults");
      this.properties = {};
    }

    // Detect CI environment
    const isCI =
      process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";

    this.config = {
      baseUrl: this.getBaseUrlForEnvironment(isCI),
      apiVersion: this.properties.get("api.version") || "v1",
      timeout: parseInt(this.properties.get("timeout")) || 30000,
      retries: parseInt(this.properties.get("retries")) || 3,
      logLevel:
        (this.properties.get("log.level") as
          | "error"
          | "warn"
          | "info"
          | "debug") || "info",
      enableLogging: this.properties.get("enable.logging") !== "false",
      enableFileLogging: this.properties.get("enable.file.logging") === "true",
      logFilePath: this.properties.get("log.file.path"),
      isCI: isCI,
      defaultAuthRole: (this.properties.get("default.auth.role") as AuthRole) || "superuser",
    };
  }

  private loadAuthCredentials(): void {
    try {
      const fs = require('fs');
      const configPath = path.join(process.cwd(), "config.properties");
      const configContent = fs.readFileSync(configPath, 'utf8');
      
      // Load superuser credentials
      const superuserTokenMatch = configContent.match(/^superuser\.token=(.+)$/m);
      if (superuserTokenMatch) {
        this.authCredentials.set("superuser", {
          token: superuserTokenMatch[1].trim()
        });
      }

      // Load admin credentials
      const adminUsernameMatch = configContent.match(/^admin\.username=(.+)$/m);
      const adminPasswordMatch = configContent.match(/^admin\.password=(.+)$/m);
      if (adminUsernameMatch && adminPasswordMatch) {
        this.authCredentials.set("admin", {
          username: adminUsernameMatch[1].trim(),
          password: adminPasswordMatch[1].trim()
        });
      }

      // Load user credentials (if configured)
      const userUsernameMatch = configContent.match(/^user\.username=(.+)$/m);
      const userPasswordMatch = configContent.match(/^user\.password=(.+)$/m);
      if (userUsernameMatch && userPasswordMatch) {
        this.authCredentials.set("user", {
          username: userUsernameMatch[1].trim(),
          password: userPasswordMatch[1].trim()
        });
      }
    } catch (error) {
      console.warn("Could not load authentication credentials:", error);
    }
  }

  private getBaseUrlForEnvironment(isCI: boolean): string {
    let baseUrl: string;
    if (isCI) {
      // In CI environment, use the HOST environment variable if available
      const host = process.env.HOST;
      console.log(`CI Environment - HOST env var: ${host}`);
      if (host) {
        baseUrl = `http://${host}:8111`;
        console.log(`Using HOST env var for baseUrl: ${baseUrl}`);
      } else {
        // Fallback to localhost if HOST is not set
        baseUrl = "http://localhost:8111";
        console.log(`HOST env var not found, using localhost: ${baseUrl}`);
      }
    } else {
      // In local environment, use the configured base URL
      baseUrl = this.properties.get("base.url") || "http://192.168.0.19:8111";
      console.log(`Local environment baseUrl: ${baseUrl}`);
    }

    return baseUrl;
  }

  /**
   * Get authentication credentials for a specific role
   */
  getAuthCredentials(role: AuthRole): AuthCredentials | undefined {
    return this.authCredentials.get(role);
  }

  /**
   * Get the default authentication role
   */
  getDefaultAuthRole(): AuthRole {
    return this.config.defaultAuthRole;
  }

  /**
   * Check if a role is available
   */
  hasAuthRole(role: AuthRole): boolean {
    return this.authCredentials.has(role);
  }

  /**
   * Get available authentication roles
   */
  getAvailableAuthRoles(): AuthRole[] {
    return Array.from(this.authCredentials.keys());
  }

  /**
   * Build authenticated URL for a specific role
   */
  getAuthenticatedUrl(role: AuthRole = this.config.defaultAuthRole): string {
    const credentials = this.getAuthCredentials(role);
    if (!credentials) {
      throw new Error(`No authentication credentials found for role: ${role}`);
    }

    const baseUrl = this.config.baseUrl;
    console.log(`Building authenticated URL for role ${role}, baseUrl: ${baseUrl}`);
    
    if (role === "superuser" && credentials.token) {
      // Use token-based authentication in URL
      const url = new URL(baseUrl);
      const authenticatedUrl = `${url.protocol}//:${credentials.token}@${url.host}`;
      console.log(`Superuser authenticated URL: ${authenticatedUrl}`);
      return authenticatedUrl;
    } else if (credentials.username && credentials.password) {
      // Use basic authentication in URL
      const url = new URL(baseUrl);
      const authenticatedUrl = `${url.protocol}//${credentials.username}:${credentials.password}@${url.host}`;
      console.log(`Admin/User authenticated URL: ${authenticatedUrl}`);
      return authenticatedUrl;
    } else {
      throw new Error(`Incomplete credentials for role: ${role}`);
    }
  }

  getConfig(): EnvironmentConfig {
    return { ...this.config };
  }

  getBaseUrl(): string {
    return this.config.baseUrl;
  }

  getApiUrl(): string {
    return `${this.config.baseUrl}/app/rest`;
  }

  getTimeout(): number {
    return this.config.timeout;
  }

  getRetries(): number {
    return this.config.retries;
  }

  getLogLevel(): string {
    return this.config.logLevel;
  }

  isLoggingEnabled(): boolean {
    return this.config.enableLogging;
  }

  isFileLoggingEnabled(): boolean {
    return this.config.enableFileLogging;
  }

  getLogFilePath(): string | undefined {
    return this.config.logFilePath;
  }

  isCI(): boolean {
    return this.config.isCI;
  }

  // Method to update config at runtime
  updateConfig(updates: Partial<EnvironmentConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  // Method to get environment-specific config
  getEnvironmentConfig(env: string): EnvironmentConfig {
    const envPrefix = `${env}.`;
    const envConfig: EnvironmentConfig = { ...this.config };

    // Override with environment-specific values
    const envBaseUrl = this.properties.get(`${envPrefix}base.url`);
    if (envBaseUrl) envConfig.baseUrl = envBaseUrl;

    const envTimeout = this.properties.get(`${envPrefix}timeout`);
    if (envTimeout) envConfig.timeout = parseInt(envTimeout);

    return envConfig;
  }
}
