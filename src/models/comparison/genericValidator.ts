export interface ValidationRule {
  type:
    | "string"
    | "number"
    | "boolean"
    | "object"
    | "array"
    | "required"
    | "optional";
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
  required?: boolean;
  custom?: (value: any) => boolean;
}

export interface FieldValidation {
  [fieldPath: string]: ValidationRule;
}

export class GenericValidator {
  /**
   * Automatically validates any data class based on its structure
   */
  static validateDataClass<T extends Record<string, any>>(
    data: T,
    expectedClass: new () => T,
    options?: {
      ignoreFields?: string[];
      allowExtraFields?: boolean;
      strictTypeChecking?: boolean;
    },
  ): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      missingFields: [],
      extraFields: [],
      typeMismatches: [],
    };

    try {
      // Create an instance of the expected class to get its structure
      const expectedInstance = new expectedClass();
      const expectedKeys = Object.keys(expectedInstance);
      const actualKeys = Object.keys(data as Record<string, any>);

      // Check for missing required fields
      for (const key of expectedKeys) {
        if (!(key in data)) {
          result.missingFields.push(key);
          result.errors.push(`Missing required field: ${key}`);
          result.isValid = false;
        }
      }

      // Check for extra fields (if not allowed)
      if (!options?.allowExtraFields) {
        for (const key of actualKeys) {
          if (
            !expectedKeys.includes(key) &&
            !options?.ignoreFields?.includes(key)
          ) {
            result.extraFields.push(key);
            result.warnings.push(`Extra field found: ${key}`);
          }
        }
      }

      // Validate field types and values
      for (const key of actualKeys) {
        if (
          expectedKeys.includes(key) &&
          !options?.ignoreFields?.includes(key)
        ) {
          const actualValue = (data as any)[key];
          const expectedValue = (expectedInstance as any)[key];

          // Type validation
          const actualType = typeof actualValue;
          const expectedType = typeof expectedValue;

          if (options?.strictTypeChecking && actualType !== expectedType) {
            result.typeMismatches.push({
              field: key,
              expected: expectedType,
              actual: actualType,
            });
            result.errors.push(
              `Type mismatch for ${key}: expected ${expectedType}, got ${actualType}`,
            );
            result.isValid = false;
          }

          // Value validation based on type
          this.validateFieldValue(key, actualValue, expectedValue, result);
        }
      }
    } catch (error) {
      result.errors.push(`Validation error: ${error}`);
      result.isValid = false;
    }

    return result;
  }

  /**
   * Validates a specific field value
   */
  private static validateFieldValue(
    fieldName: string,
    actualValue: any,
    expectedValue: any,
    result: ValidationResult,
  ): void {
    // String validation
    if (typeof expectedValue === "string" && typeof actualValue === "string") {
      if (expectedValue.length > 0 && actualValue.length === 0) {
        result.errors.push(`Field ${fieldName} cannot be empty`);
        result.isValid = false;
      }
    }

    // Object validation
    if (
      typeof expectedValue === "object" &&
      expectedValue !== null &&
      typeof actualValue === "object" &&
      actualValue !== null
    ) {
      if (Array.isArray(expectedValue) !== Array.isArray(actualValue)) {
        result.errors.push(
          `Field ${fieldName}: expected ${Array.isArray(expectedValue) ? "array" : "object"}, got ${Array.isArray(actualValue) ? "array" : "object"}`,
        );
        result.isValid = false;
      }
    }

    // Required field validation
    if (
      expectedValue !== undefined &&
      expectedValue !== null &&
      (actualValue === undefined || actualValue === null)
    ) {
      result.errors.push(`Field ${fieldName} is required but missing`);
      result.isValid = false;
    }
  }

  /**
   * Validates response structure against expected model
   */
  static validateResponse<T>(
    response: any,
    expectedModel: new () => T,
    options?: {
      ignoreFields?: string[];
      allowExtraFields?: boolean;
      strictTypeChecking?: boolean;
    },
  ): ValidationResult {
    if (!response || typeof response !== "object") {
      return {
        isValid: false,
        errors: ["Response is not a valid object"],
        warnings: [],
        missingFields: [],
        extraFields: [],
        typeMismatches: [],
      };
    }

    return this.validateDataClass(response, expectedModel, options);
  }

  /**
   * Quick validation check
   */
  static isValid<T extends Record<string, any>>(
    data: T,
    expectedClass: new () => T,
    options?: {
      ignoreFields?: string[];
      allowExtraFields?: boolean;
      strictTypeChecking?: boolean;
    },
  ): boolean {
    const result = this.validateDataClass(data, expectedClass, options);
    return result.isValid;
  }

  /**
   * Get validation summary
   */
  static getValidationSummary(result: ValidationResult): string {
    const parts = [];

    if (result.errors.length > 0) {
      parts.push(`Errors: ${result.errors.length}`);
    }
    if (result.warnings.length > 0) {
      parts.push(`Warnings: ${result.warnings.length}`);
    }
    if (result.missingFields.length > 0) {
      parts.push(`Missing: ${result.missingFields.length}`);
    }
    if (result.extraFields.length > 0) {
      parts.push(`Extra: ${result.extraFields.length}`);
    }
    if (result.typeMismatches.length > 0) {
      parts.push(`Type mismatches: ${result.typeMismatches.length}`);
    }

    return parts.join(", ") || "No issues found";
  }
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingFields: string[];
  extraFields: string[];
  typeMismatches: {
    field: string;
    expected: string;
    actual: string;
  }[];
}
