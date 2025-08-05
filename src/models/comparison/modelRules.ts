export interface FieldRule {
  type: 'exact' | 'pattern' | 'regex' | 'custom';
  value?: any;
  pattern?: string;
  regex?: RegExp;
  customValidator?: (value: any) => boolean;
  ignoreCase?: boolean;
  optional?: boolean;
}

export interface ModelRules {
  [fieldPath: string]: FieldRule;
}

export class ModelRulesLoader {
  private static rules: ModelRules = {};

  /**
   * Load rules from configuration file
   */
  static loadRules(configPath: string): ModelRules {
    // In a real implementation, this would load from a JSON file
    // For now, we'll use a default configuration
    this.rules = {
      id: {
        type: 'pattern',
        pattern: '^[a-zA-Z][a-zA-Z0-9_]*$',
        optional: false,
      },
      name: {
        type: 'exact',
        optional: false,
      },
      href: {
        type: 'pattern',
        pattern: '^/app/rest/.*$',
        optional: true,
      },
      webUrl: {
        type: 'pattern',
        pattern: '^http://.*$',
        optional: true,
      },
      count: {
        type: 'custom',
        customValidator: (value: any) =>
          typeof value === 'number' && value >= 0,
        optional: true,
      },
      virtual: {
        type: 'exact',
        optional: true,
      },
    };

    return this.rules;
  }

  /**
   * Get rules for a specific field
   */
  static getFieldRule(fieldPath: string): FieldRule | undefined {
    return this.rules[fieldPath];
  }

  /**
   * Add a custom rule
   */
  static addRule(fieldPath: string, rule: FieldRule): void {
    this.rules[fieldPath] = rule;
  }

  /**
   * Remove a rule
   */
  static removeRule(fieldPath: string): void {
    delete this.rules[fieldPath];
  }

  /**
   * Clear all rules
   */
  static clearRules(): void {
    this.rules = {};
  }

  /**
   * Get all rules
   */
  static getAllRules(): ModelRules {
    return { ...this.rules };
  }

  /**
   * Validate a field value against its rule
   */
  static validateField(fieldPath: string, value: any): boolean {
    const rule = this.getFieldRule(fieldPath);
    if (!rule) return true; // No rule means any value is valid

    if (rule.optional && (value === undefined || value === null)) {
      return true;
    }

    switch (rule.type) {
      case 'exact':
        if (rule.value !== undefined) {
          return rule.ignoreCase
            ? String(value).toLowerCase() === String(rule.value).toLowerCase()
            : value === rule.value;
        }
        return true;

      case 'pattern':
        if (rule.pattern) {
          const regex = new RegExp(rule.pattern, rule.ignoreCase ? 'i' : '');
          return regex.test(String(value));
        }
        return true;

      case 'regex':
        if (rule.regex) {
          return rule.regex.test(String(value));
        }
        return true;

      case 'custom':
        if (rule.customValidator) {
          return rule.customValidator(value);
        }
        return true;

      default:
        return true;
    }
  }
}
