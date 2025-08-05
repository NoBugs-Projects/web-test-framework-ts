export interface ApiConfigOptions {
  protocol?: string;
  port?: number;
  timeout?: number;
  retries?: number;
  defaultHeaders?: Record<string, string>;
  auth?: {
    type: 'basic' | 'bearer' | 'token';
    username?: string;
    password?: string;
    token?: string;
  };
}

export class ApiConfig {
  public protocol: string;
  public port: number;
  public timeout: number;
  public retries: number;
  public defaultHeaders: Record<string, string>;
  public auth: ApiConfigOptions['auth'];

  constructor(options: ApiConfigOptions = {}) {
    this.protocol = options.protocol || 'http';
    this.port = options.port || 8111;
    this.timeout = options.timeout || 30000;
    this.retries = options.retries || 3;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.defaultHeaders,
    };
    this.auth = options.auth;
  }

  // Factory method for TeamCity configuration
  static createTeamCityConfig(): ApiConfig {
    return new ApiConfig({
      protocol: 'http',
      port: 8111,
      timeout: 30000,
      retries: 3,
      defaultHeaders: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      auth: {
        type: 'basic',
        username: 'admin',
        password: 'admin',
      },
    });
  }

  // Factory method for custom configuration
  static createCustomConfig(options: ApiConfigOptions): ApiConfig {
    return new ApiConfig(options);
  }

  // Method to update configuration
  updateConfig(options: Partial<ApiConfigOptions>): void {
    if (options.protocol) this.protocol = options.protocol;
    if (options.port) this.port = options.port;
    if (options.timeout) this.timeout = options.timeout;
    if (options.retries) this.retries = options.retries;
    if (options.defaultHeaders)
      this.defaultHeaders = {
        ...this.defaultHeaders,
        ...options.defaultHeaders,
      };
    if (options.auth) this.auth = options.auth;
  }

  // Method to get base URL
  getBaseUrl(host: string): string {
    return `${this.protocol}://${host}:${this.port}`;
  }

  // Method to get auth headers
  getAuthHeaders(): Record<string, string> {
    if (!this.auth) return {};

    switch (this.auth.type) {
      case 'basic':
        if (this.auth.username && this.auth.password) {
          const credentials = Buffer.from(
            `${this.auth.username}:${this.auth.password}`
          ).toString('base64');
          return { Authorization: `Basic ${credentials}` };
        }
        break;
      case 'bearer':
        if (this.auth.token) {
          return { Authorization: `Bearer ${this.auth.token}` };
        }
        break;
      case 'token':
        if (this.auth.token) {
          return { 'X-Token': this.auth.token };
        }
        break;
    }
    return {};
  }
}
