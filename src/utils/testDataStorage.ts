export interface TestEntity {
  type: 'project' | 'buildType' | 'user';
  id: string;
  name?: string;
  username?: string;
  cleanupMethod: () => Promise<void>;
}

export class TestDataStorage {
  private static instance: TestDataStorage;
  private entities: TestEntity[] = [];

  private constructor() {}

  static getInstance(): TestDataStorage {
    if (!TestDataStorage.instance) {
      TestDataStorage.instance = new TestDataStorage();
    }
    return TestDataStorage.instance;
  }

  /**
   * Add an entity to the storage for automatic cleanup
   */
  addEntity(entity: TestEntity): void {
    this.entities.push(entity);
  }

  /**
   * Get all entities of a specific type
   */
  getEntitiesByType(type: TestEntity['type']): TestEntity[] {
    return this.entities.filter((entity) => entity.type === type);
  }

  /**
   * Get all stored entities
   */
  getAllEntities(): TestEntity[] {
    return [...this.entities];
  }

  /**
   * Clean up all stored entities
   */
  async cleanupAll(): Promise<void> {
    const cleanupPromises = this.entities.map(async (entity) => {
      try {
        await entity.cleanupMethod();
      } catch (error) {
        console.warn(`Failed to cleanup ${entity.type} ${entity.id}:`, error);
      }
    });

    await Promise.all(cleanupPromises);
    this.entities = [];
  }

  /**
   * Clean up entities of a specific type
   */
  async cleanupByType(type: TestEntity['type']): Promise<void> {
    const entitiesToCleanup = this.entities.filter(
      (entity) => entity.type === type
    );
    const cleanupPromises = entitiesToCleanup.map(async (entity) => {
      try {
        await entity.cleanupMethod();
      } catch (error) {
        console.warn(`Failed to cleanup ${entity.type} ${entity.id}:`, error);
      }
    });

    await Promise.all(cleanupPromises);
    this.entities = this.entities.filter((entity) => entity.type !== type);
  }

  /**
   * Clear the storage without cleanup (for test setup)
   */
  clear(): void {
    this.entities = [];
  }

  /**
   * Get storage statistics
   */
  getStats(): { total: number; byType: Record<string, number> } {
    const byType: Record<string, number> = {};
    this.entities.forEach((entity) => {
      byType[entity.type] = (byType[entity.type] || 0) + 1;
    });

    return {
      total: this.entities.length,
      byType,
    };
  }
}
