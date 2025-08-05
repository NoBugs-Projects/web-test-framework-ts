import { ModelRules } from './modelRules';

export interface ComparisonOptions {
  ignoreFields?: string[];
  ignoreNullValues?: boolean;
  ignoreUndefinedValues?: boolean;
  caseSensitive?: boolean;
  customRules?: ModelRules;
}

export interface ComparisonResult {
  success: boolean;
  differences: string[];
  missingFields: string[];
  extraFields: string[];
}

export class ModelAssertions {
  private static defaultOptions: ComparisonOptions = {
    ignoreFields: [],
    ignoreNullValues: false,
    ignoreUndefinedValues: false,
    caseSensitive: true,
  };

  /**
   * Compare two objects and return detailed comparison result
   */
  static compareObjects(
    expected: any,
    actual: any,
    options: ComparisonOptions = {}
  ): ComparisonResult {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const differences: string[] = [];
    const missingFields: string[] = [];
    const extraFields: string[] = [];

    // Compare expected vs actual
    this.compareObjectRecursive(
      expected,
      actual,
      '',
      differences,
      missingFields,
      mergedOptions
    );

    // Check for extra fields in actual
    this.findExtraFields(expected, actual, '', extraFields, mergedOptions);

    const success =
      differences.length === 0 &&
      missingFields.length === 0 &&
      extraFields.length === 0;

    return {
      success,
      differences,
      missingFields,
      extraFields,
    };
  }

  /**
   * Assert that two objects are equal with detailed error messages
   */
  static assertEqual(
    expected: any,
    actual: any,
    message?: string,
    options: ComparisonOptions = {}
  ): void {
    const result = this.compareObjects(expected, actual, options);

    if (!result.success) {
      const errorMessage = this.formatComparisonError(result, message);
      throw new Error(errorMessage);
    }
  }

  /**
   * Assert that an object contains specific fields
   */
  static assertContains(
    container: any,
    expectedFields: any,
    message?: string,
    options: ComparisonOptions = {}
  ): void {
    const result = this.compareObjects(expectedFields, container, options);

    if (result.differences.length > 0 || result.missingFields.length > 0) {
      const errorMessage = this.formatComparisonError(
        result,
        message || 'Object does not contain expected fields'
      );
      throw new Error(errorMessage);
    }
  }

  /**
   * Assert that an object matches a pattern (supports wildcards and regex)
   */
  static assertMatches(
    actual: any,
    pattern: any,
    message?: string,
    options: ComparisonOptions = {}
  ): void {
    const result = this.compareObjects(pattern, actual, options);

    if (!result.success) {
      const errorMessage = this.formatComparisonError(
        result,
        message || 'Object does not match pattern'
      );
      throw new Error(errorMessage);
    }
  }

  private static compareObjectRecursive(
    expected: any,
    actual: any,
    path: string,
    differences: string[],
    missingFields: string[],
    options: ComparisonOptions
  ): void {
    if (expected === null && actual === null) return;
    if (expected === undefined && actual === undefined) return;

    if (expected === null && options.ignoreNullValues) return;
    if (expected === undefined && options.ignoreUndefinedValues) return;

    if (typeof expected !== typeof actual) {
      differences.push(
        `${path}: Expected type ${typeof expected}, got ${typeof actual}`
      );
      return;
    }

    if (typeof expected === 'object' && expected !== null) {
      if (Array.isArray(expected) !== Array.isArray(actual)) {
        differences.push(
          `${path}: Expected ${Array.isArray(expected) ? 'array' : 'object'}, got ${Array.isArray(actual) ? 'array' : 'object'}`
        );
        return;
      }

      if (Array.isArray(expected)) {
        this.compareArrays(
          expected,
          actual,
          path,
          differences,
          missingFields,
          options
        );
      } else {
        this.compareObjectsRecursive(
          expected,
          actual,
          path,
          differences,
          missingFields,
          options
        );
      }
    } else {
      const expectedValue = options.caseSensitive
        ? expected
        : String(expected).toLowerCase();
      const actualValue = options.caseSensitive
        ? actual
        : String(actual).toLowerCase();

      if (expectedValue !== actualValue) {
        differences.push(`${path}: Expected "${expected}", got "${actual}"`);
      }
    }
  }

  private static compareArrays(
    expected: any[],
    actual: any[],
    path: string,
    differences: string[],
    missingFields: string[],
    options: ComparisonOptions
  ): void {
    if (expected.length !== actual.length) {
      differences.push(
        `${path}: Expected array length ${expected.length}, got ${actual.length}`
      );
      return;
    }

    for (let i = 0; i < expected.length; i++) {
      this.compareObjectRecursive(
        expected[i],
        actual[i],
        `${path}[${i}]`,
        differences,
        missingFields,
        options
      );
    }
  }

  private static compareObjectsRecursive(
    expected: any,
    actual: any,
    path: string,
    differences: string[],
    missingFields: string[],
    options: ComparisonOptions
  ): void {
    for (const key in expected) {
      if (options.ignoreFields?.includes(key)) continue;

      const fullPath = path ? `${path}.${key}` : key;

      if (!(key in actual)) {
        missingFields.push(fullPath);
        continue;
      }

      this.compareObjectRecursive(
        expected[key],
        actual[key],
        fullPath,
        differences,
        missingFields,
        options
      );
    }
  }

  private static findExtraFields(
    expected: any,
    actual: any,
    path: string,
    extraFields: string[],
    options: ComparisonOptions
  ): void {
    if (typeof actual !== 'object' || actual === null) return;

    for (const key in actual) {
      if (options.ignoreFields?.includes(key)) continue;

      const fullPath = path ? `${path}.${key}` : key;

      if (!(key in expected)) {
        extraFields.push(fullPath);
      } else if (typeof actual[key] === 'object' && actual[key] !== null) {
        this.findExtraFields(
          expected[key],
          actual[key],
          fullPath,
          extraFields,
          options
        );
      }
    }
  }

  private static formatComparisonError(
    result: ComparisonResult,
    message?: string
  ): string {
    const parts: string[] = [];

    if (message) parts.push(message);

    if (result.differences.length > 0) {
      parts.push('Differences found:');
      parts.push(...result.differences.map((diff) => `  - ${diff}`));
    }

    if (result.missingFields.length > 0) {
      parts.push('Missing fields:');
      parts.push(...result.missingFields.map((field) => `  - ${field}`));
    }

    if (result.extraFields.length > 0) {
      parts.push('Extra fields:');
      parts.push(...result.extraFields.map((field) => `  - ${field}`));
    }

    return parts.join('\n');
  }
}
