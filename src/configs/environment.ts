import PropertiesReader from "properties-reader";
import path from "path";

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
}

export class Environment {
  private static instance: Environment;
  private config!: EnvironmentConfig;
  private properties: any;

  private constructor() {
    this.loadConfig();
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
    };
  }

  private getBaseUrlForEnvironment(isCI: boolean): string {
    if (isCI) {
      // In CI environment, use the HOST environment variable if available
      const host = process.env.HOST;
      if (host) {
        return `http://${host}:8111`;
      }
      // Fallback to localhost if HOST is not set
      return "http://localhost:8111";
    }

    // In local environment, use the configured base URL
    return this.properties.get("base.url") || "http://192.168.0.19:8111";
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
