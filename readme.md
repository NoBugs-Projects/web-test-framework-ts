# TeamCity Test Framework

A comprehensive test automation framework for TeamCity using TypeScript, Playwright, and modern testing practices.

## 🚀 Features

- **Layered Architecture**: Clean separation of concerns with requesters, adminSteps, dataGenerators, and pageObjects
- **Automatic Cleanup**: Singleton TestDataStorage for automatic entity cleanup after tests
- **Unique Data Generation**: Centralized DataGenerator with automatic unique ID generation
- **Generic Test Wrappers**: `expectSuccess` and `expectFailure` for consistent test assertions
- **Model Comparison**: Robust API response validation using `assertThatModels`
- **Custom Test Fixtures**: `testWithAdmin` for automatic login and test setup
- **Constants Management**: Centralized constants for maintainability
- **Page Object Model**: Clean UI test automation with encapsulated locators

## 🏗️ Architecture

### Core Components

- **`src/requesters/`**: HTTP client and API request handling
- **`src/adminSteps/`**: High-level test steps and business logic
- **`src/generator/`**: Test data generation with unique identifiers
- **`src/models/`**: Data models and comparison utilities
- **`src/utils/`**: Utilities, constants, and test fixtures
- **`src/pages/`**: Page Object Model for UI automation
- **`src/payloads/`**: API request payloads and headers
- **`tests/`**: Test specifications organized by type

### Key Features

#### Automatic Cleanup System
```typescript
// Entities are automatically collected during creation
const projectResult = await adminSteps.createProject(projectData);

// Cleanup happens automatically after each test via TestDataStorage
```

#### Generic Test Wrappers
```typescript
// Success wrapper with status code validation
await adminSteps.expectSuccess(
  () => adminSteps.createBuildType(buildTypeData),
  HTTP_STATUS.OK
);

// Failure wrapper with error message validation
await adminSteps.expectFailure(
  () => adminSteps.createProject(duplicateData),
  HTTP_STATUS.BAD_REQUEST,
  ERROR_MESSAGES.ALREADY_USED
);
```

#### Model Comparison
```typescript
// Robust API response validation
assertThatModels(buildTypeData, verificationResponse.data)
  .contains({
    ignoreFields: ['href', 'webUrl', 'projectName']
  });
```

## 🚀 Running TeamCity Server

### Prerequisites
- Java 11+ installed
- At least 2GB RAM available
- Port 8111 available

### Quick Start with Docker
```bash
# Pull TeamCity server image
docker pull jetbrains/teamcity-server:latest

# Run TeamCity server
docker run -it --name teamcity-server-instance \
  -v teamcity-data:/data/teamcity_server/datadir \
  -v teamcity-logs:/opt/teamcity/logs \
  -p 8111:8111 \
  jetbrains/teamcity-server:latest
```

### Manual Installation
```bash
# Download TeamCity server
wget https://download.jetbrains.com/teamcity/TeamCity-2023.11.1.tar.gz

# Extract and run
tar -xzf TeamCity-2023.11.1.tar.gz
cd TeamCity
./bin/runAll.sh start
```

### Access TeamCity
- **URL**: http://localhost:8111
- **Default Admin**: admin/admin
- **First Run**: Follow setup wizard to configure admin account

### Configuration
```bash
# TeamCity data directory
/opt/teamcity/logs/     # Logs
/data/teamcity_server/datadir/  # Data

# Configuration files
/opt/teamcity/conf/     # Server configuration
```

## 🧪 Running Tests

### Prerequisites
- Node.js 18+
- TeamCity server running on localhost:8111
- Admin credentials configured

### Quick Start
```bash
# Install dependencies
npm install

# Install Playwright browsers
npm run install:browsers

# Run all tests
npm test

# Run specific test types
npm run test:api
npm run test:ui

# Run with specific browser
npx playwright test --project=chromium
```

### Test Organization

#### API Tests (`tests/api/`)
- **`buildType.spec.ts`**: Build type CRUD operations
- **`projectsEndpoint.spec.ts`**: Project management tests

#### UI Tests (`tests/ui/`)
- **`createProject.spec.ts`**: Project creation via UI
- **`createBuildType.spec.ts`**: Build type creation via UI

### Advanced Test Execution
```bash
# Run specific test file
npx playwright test tests/api/buildType.spec.ts

# Run with specific reporter
npx playwright test --reporter=html

# Run in headed mode (see browser)
npx playwright test --headed

# Debug mode
npx playwright test --debug

# Run with specific tags
npx playwright test --grep="@positive"

# Run with specific project
npx playwright test --project=firefox
```

### Test Configuration
```bash
# Copy example config
cp config.properties.example config.properties

# Edit configuration
nano config.properties
```

### Test Data Generation
```typescript
// Automatic unique data generation
const projectData = DataGenerator.generateProjectData();
const buildTypeData = DataGenerator.generateBuildTypeData({
  project: { id: projectId }
});
```

## 📈 Framework Best Practices

### 1. **Test Design Principles**

#### ✅ **Unique Data Generation**
```typescript
// ✅ GOOD: Automatic unique data
const projectData = DataGenerator.generateProjectData();

// ❌ BAD: Hardcoded data
const projectData = { name: 'TestProject', id: 'test_project' };
```

#### ✅ **Automatic Cleanup**
```typescript
// ✅ GOOD: No manual cleanup needed
const projectResult = await adminSteps.createProject(projectData);

// ❌ BAD: Manual cleanup required
const project = await createProject(data);
// ... test logic ...
await deleteProject(project.id);
```

#### ✅ **Generic Test Wrappers**
```typescript
// ✅ GOOD: Consistent validation
await adminSteps.expectSuccess(
  () => adminSteps.createBuildType(data),
  HTTP_STATUS.OK
);

// ❌ BAD: Manual validation
const response = await adminSteps.createBuildType(data);
expect(response.status).toBe(200);
expect(response.data.id).toBe(data.id);
```

#### ✅ **Model Comparison**
```typescript
// ✅ GOOD: Robust validation
assertThatModels(buildTypeData, response.data)
  .contains({
    ignoreFields: ['href', 'webUrl']
  });

// ❌ BAD: Manual field checking
expect(response.data.name).toBe(buildTypeData.name);
expect(response.data.id).toBe(buildTypeData.id);
```

### 2. **Code Quality Standards**

#### ✅ **Constants Management**
```typescript
// ✅ GOOD: Centralized constants
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants';
await adminSteps.expectFailure(operation, HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.NOT_FOUND);

// ❌ BAD: Magic values
await adminSteps.expectFailure(operation, 400, 'Not found');
```

#### ✅ **Page Object Pattern**
```typescript
// ✅ GOOD: Encapsulated locators
await pageManager.createProjectPage().createProject(data);

// ❌ BAD: Direct locators in tests
await page.locator('#projectName').fill(data.name);
await page.locator('#createButton').click();
```

#### ✅ **Type Safety**
```typescript
// ✅ GOOD: Strong typing
interface ProjectData {
  name: string;
  id: string;
  parentProjectId?: string;
}

// ❌ BAD: Any types
const projectData: any = { name: 'test' };
```

### 3. **Test Organization**

#### ✅ **Layered Architecture**
```
src/
├── requesters/     # HTTP client layer
├── adminSteps/     # Business logic layer
├── generator/      # Data generation layer
├── models/         # Data models layer
├── utils/          # Utilities layer
└── pages/          # UI automation layer
```

#### ✅ **Test Structure**
```typescript
// ✅ GOOD: Clear test structure
test('User should be able to create project', async ({ testDataStorage }) => {
  // Arrange: Setup test data
  const projectData = DataGenerator.generateProjectData();
  
  // Act: Execute test action
  const result = await adminSteps.expectSuccess(
    () => adminSteps.createProject(projectData),
    HTTP_STATUS.OK
  );
  
  // Assert: Verify results
  assertThatModels(projectData, result.data).contains({
    ignoreFields: ['href', 'webUrl']
  });
});
```

### 4. **Error Handling**

#### ✅ **Transparent Failures**
```typescript
// ✅ GOOD: Let tests fail naturally
await adminSteps.createProject(duplicateData);
// Test will fail with clear error message

// ❌ BAD: Silent failures
try {
  await adminSteps.createProject(duplicateData);
} catch (error) {
  // Silent failure - test passes but should fail
}
```

#### ✅ **Meaningful Error Messages**
```typescript
// ✅ GOOD: Descriptive error messages
await adminSteps.expectFailure(
  () => adminSteps.createProject(duplicateData),
  HTTP_STATUS.BAD_REQUEST,
  ERROR_MESSAGES.ALREADY_USED
);
```

## 🚀 Scalability Points

### 1. **Horizontal Scaling**

#### ✅ **Parallel Test Execution**
```yaml
# GitHub Actions - Parallel browser testing
strategy:
  matrix:
    browser: [chromium, firefox, webkit]
```

#### ✅ **Test Isolation**
```typescript
// Each test generates unique data
const projectData = DataGenerator.generateProjectData();
const buildTypeData = DataGenerator.generateBuildTypeData();
```

### 2. **Vertical Scaling**

#### ✅ **Modular Architecture**
```typescript
// Easy to extend with new features
export class AdminSteps {
  async createNewEntity(entityData: EntityData) {
    // Generic entity creation
  }
  
  async createCustomEntity(customData: CustomData) {
    // Custom entity creation
  }
}
```

#### ✅ **Reusable Components**
```typescript
// Generic test wrappers for any operation
await adminSteps.expectSuccess(operation, expectedStatus);
await adminSteps.expectFailure(operation, expectedStatus, expectedError);
```

### 3. **Maintainability**

#### ✅ **Configuration Management**
```typescript
// Environment-specific configuration
const config = Environment.getInstance().getConfig();
const envConfig = Environment.getInstance().getEnvironmentConfig('staging');
```

#### ✅ **Logging and Monitoring**
```typescript
// Comprehensive logging
Logger.info('Creating project', { projectData });
Logger.error('Project creation failed', { error, projectData });
```

### 4. **Performance Optimization**

#### ✅ **Efficient Data Generation**
```typescript
// Lazy data generation
const dataGenerator = new DataGenerator();
const projectData = dataGenerator.generateProjectData(); // Generated only when needed
```

#### ✅ **Smart Cleanup**
```typescript
// Automatic cleanup without performance impact
TestDataStorage.getInstance().addEntity({
  type: 'project',
  id: response.data.id,
  cleanupMethod: async () => await deleteProject(response.data.id)
});
```

### 5. **Extensibility**

#### ✅ **Plugin Architecture**
```typescript
// Easy to add new test types
export class CustomTestSteps extends AdminSteps {
  async customOperation(data: CustomData) {
    // Custom implementation
  }
}
```

#### ✅ **Custom Validators**
```typescript
// Extensible validation
export class CustomModelValidator extends ModelValidator {
  validateCustomField(data: any, expected: any): boolean {
    // Custom validation logic
  }
}
```

## 🚀 GitHub Actions CI/CD

The framework includes comprehensive GitHub Actions workflows for continuous integration:

### Workflows

#### 1. **Quick Test** (`.github/workflows/quick-test.yml`)
- Fast feedback for development
- Runs on push and pull requests
- Chrome browser only
- Linting, type checking, API and UI tests

#### 2. **Pull Request Checks** (`.github/workflows/pull-request.yml`)
- Comprehensive validation for PRs
- Multiple browsers (Chrome, Firefox, Safari)
- Code quality checks
- Security scanning
- Test coverage reporting

#### 3. **Full Test Suite** (`.github/workflows/test.yml`)
- Complete test matrix
- All browsers and Node.js versions
- Security scanning with Snyk
- Automated releases on main branch

### Workflow Features

#### ✅ **Multi-Browser Testing**
```yaml
# Chrome, Firefox, Safari support
strategy:
  matrix:
    browser: [chromium, firefox]
```

#### ✅ **Security Scanning**
```yaml
# Automated security checks
- name: Run security audit
  run: npm audit --audit-level=moderate
```

#### ✅ **Test Artifacts**
```yaml
# Upload test results and reports
- name: Upload test results
  uses: actions/upload-artifact@v4
  with:
    name: test-results
    path: test-results/
```

#### ✅ **Parallel Execution**
- API tests run in parallel with UI tests
- Different browsers run simultaneously
- Optimized for speed and efficiency

### Usage

#### For Development
```bash
# Local testing
npm run test:quick

# Specific test file
npx playwright test tests/api/buildType.spec.ts
```

#### For CI/CD
- Push to `main` or `develop` triggers workflows
- Pull requests get comprehensive validation
- Test results are uploaded as artifacts
- Security scans run automatically

### Workflow Triggers

| Event | Workflow | Purpose |
|-------|----------|---------|
| Push to main/develop | Quick Test + Full Suite | Development validation |
| Pull Request | Quick Test + PR Checks | Code review validation |
| Push to main | Build & Release | Production deployment |

## 📊 Test Results

### Local Development
```bash
# View test report
npm run report

# Run with specific reporter
npx playwright test --reporter=html
```

### CI/CD Artifacts
- Test results uploaded as GitHub artifacts
- HTML reports available for download
- Coverage reports for pull requests
- Security scan results

## 🔍 Debugging

### Test Debugging
```bash
# Run in headed mode
npx playwright test --headed

# Debug mode
npx playwright test --debug

# Show browser
npx playwright test --project=chromium --headed
```

### CI Debugging
```bash
# Download artifacts
# Available in GitHub Actions UI
```

## 🛠️ Framework Extensions

### Adding New Test Types
1. Create test file in appropriate directory
2. Use established patterns (DataGenerator, AdminSteps, etc.)
3. Add to relevant workflow

### Adding New Page Objects
1. Create page class in `src/pages/`
2. Add to `PageManager`
3. Use in UI tests

### Adding New API Endpoints
1. Add method to `AdminSteps`
2. Use `expectSuccess`/`expectFailure` wrappers
3. Include model comparison for verification

## 📈 Best Practices

### Test Design
- ✅ Use unique data generation
- ✅ Implement proper cleanup
- ✅ Use generic test wrappers
- ✅ Include model comparison
- ✅ Encapsulate UI locators

### Code Quality
- ✅ Follow TypeScript best practices
- ✅ Use constants instead of magic values
- ✅ Implement proper error handling
- ✅ Write descriptive test names
- ✅ Use page object pattern for UI tests

### CI/CD
- ✅ Run tests on multiple browsers
- ✅ Include security scanning
- ✅ Upload test artifacts
- ✅ Provide fast feedback loops
- ✅ Use parallel execution where possible

## 🤝 Contributing

1. Follow the established patterns
2. Use the provided test wrappers
3. Include proper cleanup
4. Add tests for new features
5. Update documentation

## 📝 License

ISC License - see LICENSE file for details.

---

# TeamCity Test Framework (Русская версия)

Комплексная система автоматизации тестирования для TeamCity с использованием TypeScript, Playwright и современных практик тестирования.

## 🚀 Возможности

- **Многослойная архитектура**: Четкое разделение ответственности с requesters, adminSteps, dataGenerators и pageObjects
- **Автоматическая очистка**: Singleton TestDataStorage для автоматической очистки сущностей после тестов
- **Генерация уникальных данных**: Централизованный DataGenerator с автоматической генерацией уникальных ID
- **Универсальные обертки тестов**: `expectSuccess` и `expectFailure` для единообразных проверок тестов
- **Сравнение моделей**: Надежная валидация ответов API с использованием `assertThatModels`
- **Пользовательские фикстуры тестов**: `testWithAdmin` для автоматического входа и настройки тестов
- **Управление константами**: Централизованные константы для удобства сопровождения
- **Модель Page Object**: Чистая автоматизация UI тестов с инкапсулированными локаторами

## 🏗️ Архитектура

### Основные компоненты

- **`src/requesters/`**: HTTP клиент и обработка API запросов
- **`src/adminSteps/`**: Высокоуровневые шаги тестов и бизнес-логика
- **`src/generator/`**: Генерация тестовых данных с уникальными идентификаторами
- **`src/models/`**: Модели данных и утилиты сравнения
- **`src/utils/`**: Утилиты, константы и фикстуры тестов
- **`src/pages/`**: Модель Page Object для автоматизации UI
- **`src/payloads/`**: Полезные нагрузки API запросов и заголовки
- **`tests/`**: Спецификации тестов, организованные по типам

### Ключевые особенности

#### Система автоматической очистки
```typescript
// Сущности автоматически собираются во время создания
const projectResult = await adminSteps.createProject(projectData);

// Очистка происходит автоматически после каждого теста через TestDataStorage
```

#### Универсальные обертки тестов
```typescript
// Обертка успеха с валидацией кода статуса
await adminSteps.expectSuccess(
  () => adminSteps.createBuildType(buildTypeData),
  HTTP_STATUS.OK
);

// Обертка неудачи с валидацией сообщения об ошибке
await adminSteps.expectFailure(
  () => adminSteps.createProject(duplicateData),
  HTTP_STATUS.BAD_REQUEST,
  ERROR_MESSAGES.ALREADY_USED
);
```

#### Сравнение моделей
```typescript
// Надежная валидация ответов API
assertThatModels(buildTypeData, verificationResponse.data)
  .contains({
    ignoreFields: ['href', 'webUrl', 'projectName']
  });
```

## 🚀 Запуск сервера TeamCity

### Предварительные требования
- Java 11+ установлен
- Минимум 2GB RAM доступно
- Порт 8111 свободен

### Быстрый старт с Docker
```bash
# Загрузить образ сервера TeamCity
docker pull jetbrains/teamcity-server:latest

# Запустить сервер TeamCity
docker run -it --name teamcity-server-instance \
  -v teamcity-data:/data/teamcity_server/datadir \
  -v teamcity-logs:/opt/teamcity/logs \
  -p 8111:8111 \
  jetbrains/teamcity-server:latest
```

### Ручная установка
```bash
# Скачать сервер TeamCity
wget https://download.jetbrains.com/teamcity/TeamCity-2023.11.1.tar.gz

# Распаковать и запустить
tar -xzf TeamCity-2023.11.1.tar.gz
cd TeamCity
./bin/runAll.sh start
```

### Доступ к TeamCity
- **URL**: http://localhost:8111
- **Администратор по умолчанию**: admin/admin
- **Первый запуск**: Следуйте мастеру настройки для конфигурации учетной записи администратора

### Конфигурация
```bash
# Директория данных TeamCity
/opt/teamcity/logs/     # Логи
/data/teamcity_server/datadir/  # Данные

# Файлы конфигурации
/opt/teamcity/conf/     # Конфигурация сервера
```

## 🧪 Запуск тестов

### Предварительные требования
- Node.js 18+
- Сервер TeamCity запущен на localhost:8111
- Настроены учетные данные администратора

### Быстрый старт
```bash
# Установить зависимости
npm install

# Установить браузеры Playwright
npm run install:browsers

# Запустить все тесты
npm test

# Запустить определенные типы тестов
npm run test:api
npm run test:ui

# Запустить с определенным браузером
npx playwright test --project=chromium
```

### Организация тестов

#### API тесты (`tests/api/`)
- **`buildType.spec.ts`**: CRUD операции с типами сборки
- **`projectsEndpoint.spec.ts`**: Тесты управления проектами

#### UI тесты (`tests/ui/`)
- **`createProject.spec.ts`**: Создание проекта через UI
- **`createBuildType.spec.ts`**: Создание типа сборки через UI

### Продвинутое выполнение тестов
```bash
# Запустить определенный файл теста
npx playwright test tests/api/buildType.spec.ts

# Запустить с определенным репортером
npx playwright test --reporter=html

# Запустить в режиме с браузером (видеть браузер)
npx playwright test --headed

# Режим отладки
npx playwright test --debug

# Запустить с определенными тегами
npx playwright test --grep="@positive"

# Запустить с определенным проектом
npx playwright test --project=firefox
```

### Конфигурация тестов
```bash
# Скопировать пример конфигурации
cp config.properties.example config.properties

# Редактировать конфигурацию
nano config.properties
```

### Генерация тестовых данных
```typescript
// Автоматическая генерация уникальных данных
const projectData = DataGenerator.generateProjectData();
const buildTypeData = DataGenerator.generateBuildTypeData({
  project: { id: projectId }
});
```

## 📈 Лучшие практики фреймворка

### 1. **Принципы проектирования тестов**

#### ✅ **Генерация уникальных данных**
```typescript
// ✅ ХОРОШО: Автоматические уникальные данные
const projectData = DataGenerator.generateProjectData();

// ❌ ПЛОХО: Жестко закодированные данные
const projectData = { name: 'TestProject', id: 'test_project' };
```

#### ✅ **Автоматическая очистка**
```typescript
// ✅ ХОРОШО: Не требуется ручная очистка
const projectResult = await adminSteps.createProject(projectData);

// ❌ ПЛОХО: Требуется ручная очистка
const project = await createProject(data);
// ... логика теста ...
await deleteProject(project.id);
```

#### ✅ **Универсальные обертки тестов**
```typescript
// ✅ ХОРОШО: Единообразная валидация
await adminSteps.expectSuccess(
  () => adminSteps.createBuildType(data),
  HTTP_STATUS.OK
);

// ❌ ПЛОХО: Ручная валидация
const response = await adminSteps.createBuildType(data);
expect(response.status).toBe(200);
expect(response.data.id).toBe(data.id);
```

#### ✅ **Сравнение моделей**
```typescript
// ✅ ХОРОШО: Надежная валидация
assertThatModels(buildTypeData, response.data)
  .contains({
    ignoreFields: ['href', 'webUrl']
  });

// ❌ ПЛОХО: Ручная проверка полей
expect(response.data.name).toBe(buildTypeData.name);
expect(response.data.id).toBe(buildTypeData.id);
```

### 2. **Стандарты качества кода**

#### ✅ **Управление константами**
```typescript
// ✅ ХОРОШО: Централизованные константы
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants';
await adminSteps.expectFailure(operation, HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.NOT_FOUND);

// ❌ ПЛОХО: Магические значения
await adminSteps.expectFailure(operation, 400, 'Not found');
```

#### ✅ **Модель Page Object**
```typescript
// ✅ ХОРОШО: Инкапсулированные локаторы
await pageManager.createProjectPage().createProject(data);

// ❌ ПЛОХО: Прямые локаторы в тестах
await page.locator('#projectName').fill(data.name);
await page.locator('#createButton').click();
```

#### ✅ **Типобезопасность**
```typescript
// ✅ ХОРОШО: Строгая типизация
interface ProjectData {
  name: string;
  id: string;
  parentProjectId?: string;
}

// ❌ ПЛОХО: Типы any
const projectData: any = { name: 'test' };
```

### 3. **Организация тестов**

#### ✅ **Многослойная архитектура**
```
src/
├── requesters/     # Слой HTTP клиента
├── adminSteps/     # Слой бизнес-логики
├── generator/      # Слой генерации данных
├── models/         # Слой моделей данных
├── utils/          # Слой утилит
└── pages/          # Слой автоматизации UI
```

#### ✅ **Структура тестов**
```typescript
// ✅ ХОРОШО: Четкая структура теста
test('User should be able to create project', async ({ testDataStorage }) => {
  // Arrange: Настройка тестовых данных
  const projectData = DataGenerator.generateProjectData();
  
  // Act: Выполнение тестового действия
  const result = await adminSteps.expectSuccess(
    () => adminSteps.createProject(projectData),
    HTTP_STATUS.OK
  );
  
  // Assert: Проверка результатов
  assertThatModels(projectData, result.data).contains({
    ignoreFields: ['href', 'webUrl']
  });
});
```

### 4. **Обработка ошибок**

#### ✅ **Прозрачные сбои**
```typescript
// ✅ ХОРОШО: Позволить тестам естественно сбоить
await adminSteps.createProject(duplicateData);
// Тест сбоит с четким сообщением об ошибке

// ❌ ПЛОХО: Тихие сбои
try {
  await adminSteps.createProject(duplicateData);
} catch (error) {
  // Тихий сбой - тест проходит, но должен сбоить
}
```

#### ✅ **Осмысленные сообщения об ошибках**
```typescript
// ✅ ХОРОШО: Описательные сообщения об ошибках
await adminSteps.expectFailure(
  () => adminSteps.createProject(duplicateData),
  HTTP_STATUS.BAD_REQUEST,
  ERROR_MESSAGES.ALREADY_USED
);
```

## 🚀 Точки масштабируемости

### 1. **Горизонтальное масштабирование**

#### ✅ **Параллельное выполнение тестов**
```yaml
# GitHub Actions - Параллельное тестирование браузеров
strategy:
  matrix:
    browser: [chromium, firefox, webkit]
```

#### ✅ **Изоляция тестов**
```typescript
// Каждый тест генерирует уникальные данные
const projectData = DataGenerator.generateProjectData();
const buildTypeData = DataGenerator.generateBuildTypeData();
```

### 2. **Вертикальное масштабирование**

#### ✅ **Модульная архитектура**
```typescript
// Легко расширять новыми функциями
export class AdminSteps {
  async createNewEntity(entityData: EntityData) {
    // Универсальное создание сущности
  }
  
  async createCustomEntity(customData: CustomData) {
    // Пользовательское создание сущности
  }
}
```

#### ✅ **Переиспользуемые компоненты**
```typescript
// Универсальные обертки тестов для любой операции
await adminSteps.expectSuccess(operation, expectedStatus);
await adminSteps.expectFailure(operation, expectedStatus, expectedError);
```

### 3. **Сопровождаемость**

#### ✅ **Управление конфигурацией**
```typescript
// Конфигурация для конкретной среды
const config = Environment.getInstance().getConfig();
const envConfig = Environment.getInstance().getEnvironmentConfig('staging');
```

#### ✅ **Логирование и мониторинг**
```typescript
// Комплексное логирование
Logger.info('Creating project', { projectData });
Logger.error('Project creation failed', { error, projectData });
```

### 4. **Оптимизация производительности**

#### ✅ **Эффективная генерация данных**
```typescript
// Ленивая генерация данных
const dataGenerator = new DataGenerator();
const projectData = dataGenerator.generateProjectData(); // Генерируется только при необходимости
```

#### ✅ **Умная очистка**
```typescript
// Автоматическая очистка без влияния на производительность
TestDataStorage.getInstance().addEntity({
  type: 'project',
  id: response.data.id,
  cleanupMethod: async () => await deleteProject(response.data.id)
});
```

### 5. **Расширяемость**

#### ✅ **Архитектура плагинов**
```typescript
// Легко добавлять новые типы тестов
export class CustomTestSteps extends AdminSteps {
  async customOperation(data: CustomData) {
    // Пользовательская реализация
  }
}
```

#### ✅ **Пользовательские валидаторы**
```typescript
// Расширяемая валидация
export class CustomModelValidator extends ModelValidator {
  validateCustomField(data: any, expected: any): boolean {
    // Пользовательская логика валидации
  }
}
```

## 🚀 GitHub Actions CI/CD

Фреймворк включает комплексные рабочие процессы GitHub Actions для непрерывной интеграции:

### Рабочие процессы

#### 1. **Быстрый тест** (`.github/workflows/quick-test.yml`)
- Быстрая обратная связь для разработки
- Запускается при push и pull requests
- Только браузер Chrome
- Линтинг, проверка типов, API и UI тесты

#### 2. **Проверки Pull Request** (`.github/workflows/pull-request.yml`)
- Комплексная валидация для PR
- Множественные браузеры (Chrome, Firefox, Safari)
- Проверки качества кода
- Сканирование безопасности
- Отчеты о покрытии тестов

#### 3. **Полный набор тестов** (`.github/workflows/test.yml`)
- Полная матрица тестов
- Все браузеры и версии Node.js
- Сканирование безопасности с Snyk
- Автоматические релизы на ветке main

### Особенности рабочих процессов

#### ✅ **Мультибраузерное тестирование**
```yaml
# Поддержка Chrome, Firefox, Safari
strategy:
  matrix:
    browser: [chromium, firefox]
```

#### ✅ **Сканирование безопасности**
```yaml
# Автоматические проверки безопасности
- name: Run security audit
  run: npm audit --audit-level=moderate
```

#### ✅ **Артефакты тестов**
```yaml
# Загрузка результатов тестов и отчетов
- name: Upload test results
  uses: actions/upload-artifact@v4
  with:
    name: test-results
    path: test-results/
```

#### ✅ **Параллельное выполнение**
- API тесты выполняются параллельно с UI тестами
- Разные браузеры выполняются одновременно
- Оптимизировано для скорости и эффективности

### Использование

#### Для разработки
```bash
# Локальное тестирование
npm run test:quick

# Определенный файл теста
npx playwright test tests/api/buildType.spec.ts
```

#### Для CI/CD
- Push в `main` или `develop` запускает рабочие процессы
- Pull requests получают комплексную валидацию
- Результаты тестов загружаются как артефакты
- Сканирование безопасности выполняется автоматически

### Триггеры рабочих процессов

| Событие | Рабочий процесс | Назначение |
|---------|----------------|------------|
| Push в main/develop | Быстрый тест + Полный набор | Валидация разработки |
| Pull Request | Быстрый тест + Проверки PR | Валидация ревью кода |
| Push в main | Сборка и релиз | Продакшн развертывание |

## 📊 Результаты тестов

### Локальная разработка
```bash
# Просмотр отчета тестов
npm run report

# Запуск с определенным репортером
npx playwright test --reporter=html
```

### Артефакты CI/CD
- Результаты тестов загружаются как артефакты GitHub
- HTML отчеты доступны для скачивания
- Отчеты о покрытии для pull requests
- Результаты сканирования безопасности

## 🔍 Отладка

### Отладка тестов
```bash
# Запуск в режиме с браузером
npx playwright test --headed

# Режим отладки
npx playwright test --debug

# Показать браузер
npx playwright test --project=chromium --headed
```

### Отладка CI
```bash
# Скачать артефакты
# Доступно в UI GitHub Actions
```

## 🛠️ Расширения фреймворка

### Добавление новых типов тестов
1. Создать файл теста в соответствующей директории
2. Использовать установленные паттерны (DataGenerator, AdminSteps, etc.)
3. Добавить в соответствующий рабочий процесс

### Добавление новых Page Objects
1. Создать класс страницы в `src/pages/`
2. Добавить в `PageManager`
3. Использовать в UI тестах

### Добавление новых API эндпоинтов
1. Добавить метод в `AdminSteps`
2. Использовать обертки `expectSuccess`/`expectFailure`
3. Включить сравнение моделей для верификации

## 📈 Лучшие практики

### Проектирование тестов
- ✅ Использовать генерацию уникальных данных
- ✅ Реализовать правильную очистку
- ✅ Использовать универсальные обертки тестов
- ✅ Включать сравнение моделей
- ✅ Инкапсулировать UI локаторы

### Качество кода
- ✅ Следовать лучшим практикам TypeScript
- ✅ Использовать константы вместо магических значений
- ✅ Реализовать правильную обработку ошибок
- ✅ Писать описательные имена тестов
- ✅ Использовать модель Page Object для UI тестов

### CI/CD
- ✅ Запускать тесты на множественных браузерах
- ✅ Включать сканирование безопасности
- ✅ Загружать артефакты тестов
- ✅ Обеспечивать быстрые циклы обратной связи
- ✅ Использовать параллельное выполнение где возможно

## 🤝 Вклад в проект

1. Следовать установленным паттернам
2. Использовать предоставленные обертки тестов
3. Включать правильную очистку
4. Добавлять тесты для новых функций
5. Обновлять документацию

## 📝 Лицензия

ISC License - см. файл LICENSE для деталей.