# PR Validation Guide

## Overview

This project includes a GitHub Actions workflow that automatically validates resume extraction functionality on every pull request. The validation runs on Cloudflare Workers and tests minimal resume text to ensure work dates and job titles are extracted correctly.

## What Gets Tested

### Core Validations

- ✅ **Resume Processing**: Basic endpoint functionality
- ✅ **Job Title Extraction**: "engineer", "developer", etc.
- ✅ **Work Experience**: At least 1 experience entry
- ✅ **Start Dates**: YYYY-MM or YYYY format
- ✅ **End Dates**: Including "present" keyword
- ✅ **Employer Names**: Company names extracted
- ✅ **Job Titles in Experience**: Position titles

### Test Resume Examples

```
"Software Engineer at TechCorp from 2020-01 to 2023-12. Currently Senior Developer at StartupXYZ since 2024-01."
```

## How It Works

### 1. GitHub Actions Workflow

- **Trigger**: Pull requests to `main`/`master` branches
- **Files**: Changes to `src/`, `tests/`, `package.json`, `wrangler.toml`
- **Runner**: Ubuntu latest with Node.js 20

### 2. Validation Steps

1. **Setup**: Install dependencies, build project
2. **Quality Checks**: TypeScript, ESLint, formatting
3. **Minimal Resume Test**: Test simple resume extraction
4. **Health Check**: Verify worker endpoint accessibility
5. **PR Comment**: Post results to pull request

### 3. Test Execution

The workflow runs these commands:

```bash
pnpm install
pnpm run build
pnpm run type-check
pnpm run lint:check
pnpm run test:minimal
pnpm run test:quick
```

## Running Tests Locally

### Quick Test

```bash
# Test minimal resume extraction
pnpm run test:minimal

# Test health endpoint
pnpm run test:quick
```

### Full Test Suite

```bash
# All tests
pnpm run test:all

# Individual components
pnpm run test          # Full resume tests
pnpm run test:pdf      # PDF processing tests
```

## Configuration

### Environment Variables

Set these in GitHub repository settings:

- `WORKER_URL`: Your deployed Cloudflare Worker URL
  - Default: `https://resume-processor-worker.dev-a96.workers.dev`

### Customizing Tests

#### Adding New Test Cases

Edit `tests/minimal-validation-test.js`:

```javascript
const testCases = [
  {
    name: 'Your test name',
    resume: 'Your minimal resume text here',
  },
];
```

#### Modifying Validations

Update the validation logic in the same file:

```javascript
{
  name: 'Your Validation',
  test: () => {
    // Your validation logic
    return {
      passed: true/false,
      details: 'What was found',
      expected: 'What was expected'
    };
  }
}
```

## Expected Output

### Successful Validation

```
🧪 Testing Minimal Resume Extraction
=====================================

📄 Test Resume: "Software Engineer at TechCorp from 2020-01 to 2023-12..."

✅ Resume processed successfully

🔍 Running Validation Tests:

✅ PASS Job Titles Extraction
   Found titles: Software Engineer, Senior Developer
   Expected: Should contain "engineer" or "developer"

✅ PASS Work Experience Entries
   Found 2 experience entries
   Expected: At least 1 work experience entry

✅ PASS Start Dates Extraction
   Start dates: 2020-01, 2024-01
   Expected: Should have dates in YYYY-MM or YYYY format

✅ PASS End Dates Extraction
   End dates: 2023-12, present
   Expected: Should have end dates (including "present")

📊 Test Results Summary
=======================
Total tests: 6
✅ Passed: 6
❌ Failed: 0
Success rate: 100%

🎉 All tests passed! Resume extraction working correctly.
```

### Failed Validation

```
❌ FAIL Job Titles Extraction
   Found titles:
   Expected: Should contain "engineer" or "developer"

❌ FAIL Start Dates Extraction
   Start dates:
   Expected: Should have dates in YYYY-MM or YYYY format

📊 Test Results Summary
=======================
Total tests: 6
✅ Passed: 4
❌ Failed: 2
Success rate: 67%

❌ Some tests failed. Check the extraction logic.
```

## Troubleshooting

### Common Issues

#### Worker Not Accessible

```
❌ Test failed with error: fetch failed
```

**Solution**: Check `WORKER_URL` environment variable or worker deployment

#### No Experience Extracted

```
❌ FAIL Work Experience Entries
   Found 0 experience entries
```

**Solution**: Check AI processing logic or resume text format

#### Date Format Issues

```
❌ FAIL Start Dates Extraction
   Start dates: 2020, 2024
   Expected: Should have dates in YYYY-MM or YYYY format
```

**Solution**: Update date parsing logic in AI processor

### Debug Mode

Add debug logging to see full response:

```javascript
console.log('📋 Full Extracted Data:');
console.log(JSON.stringify(data.data, null, 2));
```

## Integration with CI/CD

### Pre-commit Hooks

Add to `.husky/pre-commit`:

```bash
#!/bin/sh
pnpm run test:minimal
```

### Deployment Pipeline

```yaml
# .github/workflows/deploy.yml
- name: Run validation tests
  run: pnpm run test:minimal
- name: Deploy to Cloudflare
  run: pnpm run deploy
```

## Best Practices

### Test Resume Design

- **Keep it minimal**: Single line or short paragraph
- **Include key elements**: Job title, company, dates
- **Use clear formats**: "from YYYY-MM to YYYY-MM"
- **Test edge cases**: "present", missing dates, multiple positions

### Validation Logic

- **Be specific**: Test exact field extractions
- **Handle variations**: Different date formats, job titles
- **Provide context**: Clear error messages with expected vs actual
- **Test incrementally**: One validation per test case

### Maintenance

- **Update regularly**: Add new test cases as features evolve
- **Monitor results**: Check PR comments for validation status
- **Refine tests**: Adjust based on real-world resume formats
- **Document changes**: Update this guide when modifying tests

## Contributing

When adding new resume extraction features:

1. **Add test cases** to `tests/minimal-validation-test.js`
2. **Update validations** to cover new fields
3. **Test locally** with `pnpm run test:minimal`
4. **Create PR** to trigger automated validation
5. **Review results** in PR comments
6. **Update documentation** if needed

This ensures that resume extraction remains reliable and accurate across all changes.
