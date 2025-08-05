import { faker } from '@faker-js/faker';

export interface ValidationRule {
  type:
    | 'string'
    | 'number'
    | 'boolean'
    | 'email'
    | 'url'
    | 'uuid'
    | 'date'
    | 'regex';
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
  required?: boolean;
  custom?: (value: any) => boolean;
}

export interface FieldDefinition {
  name: string;
  type: string;
  validation?: ValidationRule;
  generator?: (field: FieldDefinition) => any;
}

export interface EntityDefinition {
  name: string;
  fields: FieldDefinition[];
}

export class DataGenerator {
  private static getCurrentDateTime(): string {
    return faker.date.recent().toISOString().replace(/[-:.]/g, '');
  }

  /**
   * Generate data for a specific entity type
   */
  static generateDataForEntity(
    entityType: string,
    overrides: Record<string, any> = {}
  ): any {
    switch (entityType.toLowerCase()) {
      case 'project':
        return this.generateProjectData(overrides);
      case 'buildtype':
        return this.generateBuildTypeData(overrides);
      case 'user':
        return this.generateUserData(overrides);
      case 'server':
        return this.generateServerData(overrides);
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }

  /**
   * Generate project data
   */
  static generateProjectData(overrides: Record<string, any> = {}): any {
    const baseData = {
      locator: '_Root',
      name: `${this.getCurrentDateTime()}_${faker.word.adjective()}`,
      id: `${faker.word.adjective()}_${this.getCurrentDateTime()}`,
      copyAllAssociatedSettings: true,
    };

    return { ...baseData, ...overrides };
  }

  /**
   * Generate build type data
   */
  static generateBuildTypeData(overrides: Record<string, any> = {}): any {
    const projectData = this.generateProjectData();

    const baseData = {
      id: `bt_${faker.word.adjective()}_${this.getCurrentDateTime()}`,
      name: `Build_${faker.word.adjective()}_${this.getCurrentDateTime()}`,
      project: {
        id: projectData.id,
      },
    };

    return { ...baseData, ...overrides };
  }

  /**
   * Generate user data
   */
  static generateUserData(overrides: Record<string, any> = {}): any {
    const baseData = {
      username: faker.internet.userName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
    };

    return { ...baseData, ...overrides };
  }

  /**
   * Generate server data
   */
  static generateServerData(overrides: Record<string, any> = {}): any {
    const baseData = {
      version: '2023.11.1 (build 147412)',
      versionMajor: 2023,
      versionMinor: 11,
      buildNumber: '147412',
      buildDate: '20231214T000000+0000',
      internalId: faker.string.uuid(),
      role: 'main_node',
      webUrl: 'http://localhost:8111',
    };

    return { ...baseData, ...overrides };
  }

  /**
   * Generate data based on field definition
   */
  static generateFieldData(field: FieldDefinition): any {
    if (field.generator) {
      return field.generator(field);
    }

    switch (field.type) {
      case 'string':
        return this.generateString(field.validation);
      case 'number':
        return this.generateNumber(field.validation);
      case 'boolean':
        return this.generateBoolean(field.validation);
      case 'email':
        return faker.internet.email();
      case 'url':
        return faker.internet.url();
      case 'uuid':
        return faker.string.uuid();
      case 'date':
        return faker.date.recent().toISOString();
      case 'regex':
        return this.generateByRegex(field.validation?.pattern || '.*');
      default:
        return faker.string.alphanumeric();
    }
  }

  /**
   * Generate string based on validation rules
   */
  private static generateString(validation?: ValidationRule): string {
    if (validation?.pattern) {
      return this.generateByRegex(validation.pattern);
    }

    const minLength = validation?.minLength || 5;
    const maxLength = validation?.maxLength || 20;
    const length = faker.number.int({ min: minLength, max: maxLength });

    return faker.string.alphanumeric(length);
  }

  /**
   * Generate number based on validation rules
   */
  private static generateNumber(validation?: ValidationRule): number {
    const min = validation?.min || 0;
    const max = validation?.max || 1000;
    return faker.number.int({ min, max });
  }

  /**
   * Generate boolean based on validation rules
   */
  private static generateBoolean(validation?: ValidationRule): boolean {
    return faker.datatype.boolean() as boolean;
  }

  /**
   * Generate data by regex pattern
   */
  private static generateByRegex(pattern: string): string {
    // Simple regex pattern generation - in a real implementation, you'd use a proper regex generator
    if (pattern === '^[a-zA-Z][a-zA-Z0-9_]*$') {
      return `${faker.string.alpha(1)}${faker.string.alphanumeric(5)}`;
    }
    if (pattern === '^/app/rest/.*$') {
      return `/app/rest/${faker.word.noun()}`;
    }
    if (pattern === '^http://.*$') {
      return faker.internet.url();
    }

    return faker.string.alphanumeric(10);
  }

  /**
   * Validate generated data against rules
   */
  static validateData(data: any, rules: ValidationRule[]): boolean {
    for (const rule of rules) {
      if (!this.validateField(data, rule)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Validate a single field
   */
  private static validateField(value: any, rule: ValidationRule): boolean {
    if (rule.required && (value === undefined || value === null)) {
      return false;
    }

    if (rule.custom) {
      return !!rule.custom(value);
    }

    switch (rule.type) {
      case 'string':
        return (
          typeof value === 'string' &&
          (!rule.minLength || value.length >= rule.minLength) &&
          (!rule.maxLength || value.length <= rule.maxLength)
        );
      case 'number':
        return (
          typeof value === 'number' &&
          (!rule.min || value >= rule.min) &&
          (!rule.max || value <= rule.max)
        );
      case 'boolean':
        return typeof value === 'boolean';
      case 'email':
        return typeof value === 'string' && value.includes('@');
      case 'url':
        return (
          typeof value === 'string' &&
          (value.startsWith('http://') || value.startsWith('https://'))
        );
      case 'uuid':
        return (
          typeof value === 'string' &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            value
          )
        );
      case 'date':
        return typeof value === 'string' && !isNaN(Date.parse(value));
      case 'regex':
        return typeof value === 'string' && rule.pattern
          ? new RegExp(rule.pattern).test(value)
          : false;
      default:
        return true;
    }
  }
}
