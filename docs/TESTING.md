# Testing Guide

This document describes the testing infrastructure and how to run tests for Thermi-Nator.

## Overview

Thermi-Nator uses comprehensive automated testing:
- **Backend**: pytest with coverage
- **Frontend**: Vitest + React Testing Library
- **CI/CD**: GitHub Actions workflows

## Backend Testing

### Setup

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### Running Tests

```bash
# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_api.py

# Run with coverage
pytest --cov=app --cov-report=html

# Open coverage report
open htmlcov/index.html
```

### Test Structure

```
backend/tests/
├── __init__.py
├── test_optimization_engine.py  # Unit tests for optimization
├── test_alert_service.py         # Unit tests for alerts
├── test_api.py                    # Integration tests for API
└── conftest.py                    # Shared fixtures (if needed)
```

### Writing Backend Tests

Example unit test:
```python
import pytest
from app.services.my_service import MyService

class TestMyService:
    @pytest.fixture
    def service(self):
        return MyService()

    def test_something(self, service):
        result = service.do_something()
        assert result == expected_value
```

Example async test:
```python
@pytest.mark.asyncio
async def test_async_function():
    result = await some_async_function()
    assert result is not None
```

## Frontend Testing

### Setup

```bash
cd frontend
npm install
```

### Running Tests

```bash
# Run tests in watch mode
npm test

# Run once
npm test -- --run

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage

# Open coverage report
open coverage/index.html
```

### Test Structure

```
frontend/src/
├── components/
│   ├── __tests__/
│   │   └── ThemeToggle.test.tsx
│   └── ThemeToggle.tsx
├── pages/
│   └── __tests__/
│       └── DashboardPage.test.tsx
└── test/
    └── setup.ts  # Test configuration
```

### Writing Frontend Tests

Example component test:
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const { getByRole } = render(<MyComponent />);
    const button = getByRole('button');
    fireEvent.click(button);
    // Assert expected behavior
  });
});
```

## CI/CD Pipeline

### Workflows

**Main CI Pipeline** (`.github/workflows/ci.yml`):
- Runs on push to main/develop
- Backend tests + coverage
- Frontend tests + coverage
- Integration tests
- Security scanning
- Code quality analysis

**Quick Test** (`.github/workflows/test.yml`):
- Runs on all branches
- Fast feedback (<10 minutes)
- Essential tests only

### GitHub Actions Jobs

1. **backend-tests**
   - Python 3.11
   - Install dependencies
   - Run linting (flake8)
   - Run tests with pytest
   - Upload coverage to Codecov

2. **frontend-tests**
   - Node.js 20
   - Install dependencies
   - Type checking (TypeScript)
   - Linting (ESLint)
   - Run tests with Vitest
   - Upload coverage

3. **frontend-build**
   - Verify production build
   - Check bundle size

4. **integration-tests**
   - Start Mosquitto (MQTT broker)
   - Start backend API
   - Test endpoints

5. **security-scan**
   - Trivy vulnerability scanner
   - Upload SARIF results

6. **code-quality**
   - CodeQL analysis
   - Security & quality checks

### Running CI Locally

```bash
# Install act (GitHub Actions runner)
brew install act

# Run workflows locally
act -j backend-tests
act -j frontend-tests
```

## Coverage Goals

- **Backend**: 80%+ code coverage
- **Frontend**: 70%+ code coverage
- **Critical paths**: 100% coverage

### Viewing Coverage

```bash
# Backend
cd backend
pytest --cov=app --cov-report=html
open htmlcov/index.html

# Frontend
cd frontend
npm run test:coverage
open coverage/index.html
```

## Test Categories

### Unit Tests
Test individual functions/classes in isolation.

```python
# Backend
pytest tests/test_optimization_engine.py -m unit

# Frontend
npm test -- src/utils
```

### Integration Tests
Test multiple components working together.

```python
# Backend API tests
pytest tests/test_api.py -m integration
```

### End-to-End Tests
Test complete user flows (future).

## Mocking

### Backend Mocking

```python
from unittest.mock import Mock, AsyncMock, patch

# Mock database
mock_db = Mock()
mock_db.get_data = AsyncMock(return_value={'data': 'value'})

# Patch dependencies
with patch('app.database.get_database', return_value=mock_db):
    # Test code
```

### Frontend Mocking

```typescript
import { vi } from 'vitest';

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: 'value' }),
  })
);

// Mock API module
vi.mock('../api', () => ({
  fetchData: vi.fn(() => Promise.resolve({ data: 'value' })),
}));
```

## Debugging Tests

### Backend

```bash
# Run with debugger
pytest tests/test_api.py -v --pdb

# Stop on first failure
pytest -x

# Show local variables on failure
pytest -l

# Verbose output
pytest -vv
```

### Frontend

```bash
# Run specific test
npm test -- ThemeToggle

# Debug in browser
npm run test:ui

# Show console output
npm test -- --reporter=verbose
```

## Performance Testing

### Backend

```python
@pytest.mark.slow
def test_expensive_operation():
    # Long-running test
    pass

# Skip slow tests
pytest -m "not slow"
```

### Frontend

```typescript
// Measure render time
it('renders quickly', () => {
  const start = performance.now();
  render(<LargeComponent />);
  const end = performance.now();
  expect(end - start).toBeLessThan(100); // ms
});
```

## Continuous Integration

### Pull Request Checks

All PRs must pass:
- ✅ All tests passing
- ✅ Code coverage maintained
- ✅ No linting errors
- ✅ Type checking passes
- ✅ Build succeeds
- ✅ Security scan clean

### Pre-commit Hooks

```bash
# Install pre-commit hooks
pip install pre-commit
pre-commit install

# Run manually
pre-commit run --all-files
```

## Troubleshooting

### Tests fail locally but pass in CI

- Check Python/Node versions match CI
- Clear caches: `rm -rf __pycache__ .pytest_cache node_modules/.cache`
- Reinstall dependencies

### Import errors in tests

- Ensure `__init__.py` files exist in test directories
- Check PYTHONPATH: `export PYTHONPATH="${PYTHONPATH}:./backend"`

### Frontend tests timeout

- Increase timeout in vitest.config.ts:
  ```typescript
  testTimeout: 10000, // 10 seconds
  ```

### Coverage not updating

- Delete `.coverage` and `htmlcov/` directories
- Run with `--cov-report=html:htmlcov --cov-append`

## Best Practices

1. **Write tests first** (TDD when possible)
2. **Test behavior, not implementation**
3. **Keep tests fast** (<1s per test)
4. **Use descriptive test names**
5. **One assertion per test** (when practical)
6. **Mock external dependencies**
7. **Test edge cases and errors**
8. **Maintain test code quality**

## Resources

- [pytest documentation](https://docs.pytest.org/)
- [Vitest documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [GitHub Actions](https://docs.github.com/actions)

---

**Next Steps:**
- Add E2E tests with Playwright
- Implement mutation testing
- Add performance benchmarks
- Visual regression testing
