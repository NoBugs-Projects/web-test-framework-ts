export interface LogLevel {
  ERROR: 0;
  WARN: 1;
  INFO: 2;
  DEBUG: 3;
}

export class Logger {
  private logLevel: number = 2; // INFO by default
  private enableConsole: boolean = true;
  private enableFile: boolean = false;
  private logFile?: string;

  constructor(options?: {
    logLevel?: number;
    enableConsole?: boolean;
    enableFile?: boolean;
    logFile?: string;
  }) {
    if (options?.logLevel !== undefined) this.logLevel = options.logLevel;
    if (options?.enableConsole !== undefined)
      this.enableConsole = options.enableConsole;
    if (options?.enableFile !== undefined) this.enableFile = options.enableFile;
    if (options?.logFile) this.logFile = options.logFile;
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const dataString = data ? `\n${JSON.stringify(data, null, 2)}` : "";
    return `[${timestamp}] ${level}: ${message}${dataString}`;
  }

  private log(
    level: number,
    levelName: string,
    message: string,
    data?: any,
  ): void {
    if (level <= this.logLevel) {
      const formattedMessage = this.formatMessage(levelName, message, data);

      if (this.enableConsole) {
        console.log(formattedMessage);
      }

      if (this.enableFile && this.logFile) {
        // In a real implementation, you would write to file here
        // For now, we'll just use console
        console.log(`[FILE] ${formattedMessage}`);
      }
    }
  }

  error(message: string, data?: any): void {
    this.log(0, "ERROR", message, data);
  }

  warn(message: string, data?: any): void {
    this.log(1, "WARN", message, data);
  }

  info(message: string, data?: any): void {
    this.log(2, "INFO", message, data);
  }

  debug(message: string, data?: any): void {
    this.log(3, "DEBUG", message, data);
  }

  // HTTP request logging
  logRequest(
    method: string,
    url: string,
    data?: any,
    headers?: Record<string, string>,
  ): void {
    this.info(`HTTP ${method} Request`, {
      method,
      url,
      data,
      headers: this.sanitizeHeaders(headers),
    });
  }

  // HTTP response logging
  logResponse(
    status: number,
    data?: any,
    headers?: Record<string, string>,
  ): void {
    const level = status >= 400 ? "error" : status >= 300 ? "warn" : "info";
    this[level](`HTTP Response (${status})`, {
      status,
      data,
      headers: this.sanitizeHeaders(headers),
    });
  }

  // Sanitize headers to remove sensitive information
  private sanitizeHeaders(
    headers?: Record<string, string>,
  ): Record<string, string> {
    if (!headers) return {};

    const sanitized: Record<string, string> = {};
    const sensitiveKeys = [
      "authorization",
      "cookie",
      "x-csrf-token",
      "x-tc-csrf-token",
    ];

    for (const [key, value] of Object.entries(headers)) {
      if (sensitiveKeys.includes(key.toLowerCase())) {
        sanitized[key] = "[REDACTED]";
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  // Set log level
  setLogLevel(level: number): void {
    this.logLevel = level;
  }

  // Enable/disable console logging
  setConsoleLogging(enabled: boolean): void {
    this.enableConsole = enabled;
  }

  // Enable/disable file logging
  setFileLogging(enabled: boolean, logFile?: string): void {
    this.enableFile = enabled;
    if (logFile) this.logFile = logFile;
  }
}
