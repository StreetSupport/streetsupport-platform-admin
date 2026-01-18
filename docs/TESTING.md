# Testing Documentation

This document describes the Test-Driven Development (TDD) methodology and testing infrastructure for the Street Support Admin and API projects.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Testing Philosophy](#testing-philosophy)
3. [Admin Project Testing](#admin-project-testing)
4. [API Project Testing](#api-project-testing)
5. [ESLint Configuration](#eslint-configuration)
6. [CI/CD Pipeline Integration](#cicd-pipeline-integration)
7. [Commands Reference](#commands-reference)
8. [Related Files](#related-files)

---

## Overview

Both Admin and API projects have testing infrastructure configured with:
- **Jest** - Test runner and assertion library
- **ESLint** - Code quality and style enforcement
- **CI/CD Integration** - Tests must pass before merging

### Current Status

| Project | Test Framework | Test Status | ESLint |
|---------|---------------|-------------|--------|
| Admin | Jest + React Testing Library | Smoke test configured | Configured |
| API | Jest | Smoke test configured | Configured |

> **Note**: Currently, only smoke tests are implemented. The infrastructure is ready for comprehensive test suites.

---

## Testing Philosophy

### TDD Approach

1. **Write test first** - Define expected behaviour before implementation
2. **Run test (it fails)** - Verify the test catches missing functionality
3. **Implement feature** - Write minimal code to pass the test
4. **Run test (it passes)** - Verify implementation is correct
5. **Refactor** - Improve code quality while maintaining passing tests

### Test Types

| Type | Scope | Speed | When to Use |
|------|-------|-------|-------------|
| **Unit Tests** | Single function/component | Fast | Business logic, utilities |
| **Integration Tests** | Multiple modules | Medium | API endpoints, component interactions |
| **E2E Tests** | Full application | Slow | Critical user journeys |

### Testing Priorities

1. **Critical paths** - Authentication, form submissions
2. **Business logic** - Validation, calculations
3. **API endpoints** - Request/response handling
4. **UI components** - User interactions

---

## Admin Project Testing

### Framework Setup

- **Jest** - Test runner
- **React Testing Library** - Component testing
- **@testing-library/jest-dom** - DOM matchers

### Configuration File

**`jest.config.js`** (or similar):
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
  ],
};
```

### Test Directory Structure

```
src/
└── tests/
    ├── smoke.test.ts           # Basic smoke test
    ├── components/             # Component tests (to be added)
    │   ├── Button.test.tsx
    │   └── BannerCard.test.tsx
    ├── hooks/                  # Hook tests (to be added)
    │   └── useAuthorization.test.ts
    └── utils/                  # Utility tests (to be added)
        └── validation.test.ts
```

### Current Smoke Test

**`src/tests/smoke.test.ts`**:
```typescript
describe('Admin app smoke test', () => {
  it('passes basic truthiness check', () => {
    expect(true).toBe(true);
  });
});
```

### Example Component Test

```typescript
// src/tests/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies variant classes correctly', () => {
    render(<Button variant="primary">Primary</Button>);
    expect(screen.getByText('Primary')).toHaveClass('btn-primary');
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByText('Disabled')).toBeDisabled();
  });
});
```

### Example Hook Test

```typescript
// src/tests/hooks/useAuthorization.test.ts
import { renderHook } from '@testing-library/react';
import { useAuthorization } from '@/hooks/useAuthorization';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        authClaims: {
          roles: ['SuperAdmin'],
          specificClaims: []
        }
      }
    },
    status: 'authenticated'
  })
}));

describe('useAuthorization', () => {
  it('returns authorized for SuperAdmin', () => {
    const { result } = renderHook(() => useAuthorization({
      allowedRoles: ['CityAdmin'],
      requiredPage: '/banners'
    }));
    
    expect(result.current.isAuthorized).toBe(true);
  });
});
```

### Running Admin Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test -- src/tests/smoke.test.ts
```

---

## API Project Testing

### Framework Setup

- **Jest** - Test runner
- **supertest** - HTTP assertion library (recommended)

### Configuration File

**`jest.config.js`**:
```javascript
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js', '**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

### Test Directory Structure

```
tests/
├── smoke.test.js              # Basic smoke test
├── controllers/               # Controller tests (to be added)
│   ├── bannerController.test.js
│   └── userController.test.js
├── middleware/                # Middleware tests (to be added)
│   └── authMiddleware.test.js
├── services/                  # Service tests (to be added)
│   └── emailService.test.js
└── utils/                     # Utility tests (to be added)
    └── encryption.test.js
```

### Current Smoke Test

**`tests/smoke.test.js`**:
```javascript
describe('API app smoke test', () => {
  it('passes basic truthiness check', () => {
    expect(true).toBe(true);
  });
});
```

### Example Controller Test

```typescript
// tests/controllers/bannerController.test.ts
import request from 'supertest';
import app from '../src/app';
import Banner from '../src/models/bannerModel';

// Mock authentication middleware
jest.mock('../src/middleware/authMiddleware', () => ({
  authenticate: (req, res, next) => {
    req.user = { _id: 'test-user-id', AuthClaims: ['SuperAdmin'] };
    next();
  },
  requireRole: () => (req, res, next) => next()
}));

describe('Banner Controller', () => {
  beforeEach(async () => {
    await Banner.deleteMany({});
  });

  describe('GET /api/banners', () => {
    it('returns empty array when no banners', async () => {
      const res = await request(app)
        .get('/api/banners')
        .set('Authorization', 'Bearer test-token');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });

    it('returns banners for location', async () => {
      await Banner.create({
        Title: 'Test Banner',
        TemplateType: 'giving-campaign',
        LocationSlug: 'manchester',
        // ... other required fields
      });

      const res = await request(app)
        .get('/api/banners?location=manchester')
        .set('Authorization', 'Bearer test-token');
      
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].Title).toBe('Test Banner');
    });
  });

  describe('POST /api/banners', () => {
    it('creates banner with valid data', async () => {
      const bannerData = {
        Title: 'New Banner',
        TemplateType: 'giving-campaign',
        LocationSlug: 'manchester',
        // ... other required fields
      };

      const res = await request(app)
        .post('/api/banners')
        .set('Authorization', 'Bearer test-token')
        .send(bannerData);
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('returns 400 for invalid data', async () => {
      const res = await request(app)
        .post('/api/banners')
        .set('Authorization', 'Bearer test-token')
        .send({ Title: '' }); // Missing required fields
      
      expect(res.status).toBe(400);
    });
  });
});
```

### Example Middleware Test

```typescript
// tests/middleware/authMiddleware.test.ts
import { authenticate } from '../src/middleware/authMiddleware';
import User from '../src/models/userModel';

jest.mock('../src/models/userModel');

describe('Authentication Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  it('returns 401 if no authorization header', async () => {
    await authenticate(mockReq, mockRes, mockNext);
    
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 401 if user not found', async () => {
    mockReq.headers.authorization = 'Bearer valid-token';
    (User.findOne as jest.Mock).mockResolvedValue(null);
    
    await authenticate(mockReq, mockRes, mockNext);
    
    expect(mockRes.status).toHaveBeenCalledWith(401);
  });

  it('calls next() for valid user', async () => {
    mockReq.headers.authorization = 'Bearer valid-token';
    (User.findOne as jest.Mock).mockResolvedValue({
      _id: 'user-id',
      IsActive: true,
    });
    
    await authenticate(mockReq, mockRes, mockNext);
    
    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.user).toBeDefined();
  });
});
```

### Running API Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test -- tests/smoke.test.js
```

---

## ESLint Configuration

### Admin ESLint

**Configuration File**: `eslint.config.mjs` or `.eslintrc.js`

```javascript
// eslint.config.mjs (Next.js 15 style)
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Custom rules
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];

export default eslintConfig;
```

### API ESLint

**Configuration File**: `.eslintrc.json` or `eslint.config.js`

```json
{
  "env": {
    "node": true,
    "es2021": true,
    "jest": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

### Running ESLint

```bash
# Admin - Run linting
npm run lint

# Admin - Fix auto-fixable issues
npm run lint:fix

# API - Run linting
npm run lint

# API - Fix auto-fixable issues
npm run lint:fix
```

---

## CI/CD Pipeline Integration

### GitHub Actions Workflow

Tests and linting are enforced via GitHub Actions before merging.

**Workflow Stages**:

```yaml
# .github/workflows/test.yml
name: Test and Lint

on:
  pull_request:
    branches: [staging, main]
  push:
    branches: [staging, main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run ESLint
        run: npm run lint
      
      - name: Run tests
        run: npm run test
      
      - name: Build
        run: npm run build
```

### Branch Protection Rules

**Required checks before merge**:
1. ✅ ESLint passes
2. ✅ All tests pass
3. ✅ Build succeeds

**If any check fails**:
- PR cannot be merged
- Developer must fix issues
- Re-run checks after fixes

### Merge Requirements

| Branch | Required Checks | Approvals |
|--------|-----------------|-----------|
| `staging` | Tests + Lint | 1 approval |
| `main` | Tests + Lint | 1 approval |

---

## Commands Reference

### Admin Commands

| Command | Description |
|---------|-------------|
| `npm run test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |

### API Commands

| Command | Description |
|---------|-------------|
| `npm run test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |

---

## Related Files

### Admin Side

| File | Description |
|------|-------------|
| `jest.config.js` | Jest configuration |
| `jest.setup.js` | Test setup and global mocks |
| `eslint.config.mjs` | ESLint configuration |
| `src/tests/` | Test files directory |
| `package.json` | Test scripts |

### API Side

| File | Description |
|------|-------------|
| `jest.config.js` | Jest configuration |
| `.eslintrc.json` | ESLint configuration |
| `tests/` | Test files directory |
| `package.json` | Test scripts |

### CI/CD

| File | Description |
|------|-------------|
| `.github/workflows/test.yml` | Test workflow (if exists) |
| `.github/workflows/deploy.yml` | Deploy workflow with tests |

---

## Future Test Coverage Goals

### Priority Areas for Testing

1. **Authentication flow** - Login, logout, session management
2. **RBAC middleware** - Role-based access control
3. **Form validation** - Zod schema validation
4. **API endpoints** - All CRUD operations
5. **File uploads** - Azure Blob Storage integration
6. **Cron jobs** - Scheduled task execution

### Recommended Test Coverage

| Area | Target Coverage |
|------|-----------------|
| Utilities | 90%+ |
| Business Logic | 85%+ |
| API Endpoints | 80%+ |
| Components | 70%+ |
| Integration | Key paths |
