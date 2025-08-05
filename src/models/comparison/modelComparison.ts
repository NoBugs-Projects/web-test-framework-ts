import { ModelAssertions, ComparisonOptions } from './modelAssertions';

export interface ModelComparisonBuilder {
  match(options?: ComparisonOptions): void;
  contains(options?: ComparisonOptions): void;
  matchesPattern(options?: ComparisonOptions): void;
}

export class ModelComparison {
  private requestData: any;
  private responseData: any;

  constructor(requestData: any, responseData: any) {
    this.requestData = requestData;
    this.responseData = responseData;
  }

  /**
   * Assert that request and response data match exactly
   */
  match(options?: ComparisonOptions): void {
    ModelAssertions.assertEqual(
      this.requestData,
      this.responseData,
      'Request and response data do not match',
      options
    );
  }

  /**
   * Assert that response data contains all fields from request data
   */
  contains(options?: ComparisonOptions): void {
    ModelAssertions.assertContains(
      this.responseData,
      this.requestData,
      'Response does not contain expected request fields',
      options
    );
  }

  /**
   * Assert that response data matches a pattern based on request data
   */
  matchesPattern(options?: ComparisonOptions): void {
    ModelAssertions.assertMatches(
      this.responseData,
      this.requestData,
      'Response does not match expected pattern',
      options
    );
  }

  /**
   * Create a model comparison builder for request and response data
   */
  static assertThatModels(
    requestData: any,
    responseData: any
  ): ModelComparisonBuilder {
    return new ModelComparison(requestData, responseData);
  }
}

/**
 * Convenience function to create model comparison assertions
 */
export function assertThatModels(
  requestData: any,
  responseData: any
): ModelComparisonBuilder {
  return ModelComparison.assertThatModels(requestData, responseData);
}
