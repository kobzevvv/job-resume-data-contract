#!/bin/bash

# Setup script for PR validation system
echo "🚀 Setting up PR Validation System"
echo "=================================="

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Check if GitHub Actions directory exists
if [ ! -d ".github/workflows" ]; then
    echo "📁 Creating .github/workflows directory..."
    mkdir -p .github/workflows
fi

# Check if workflow file exists
if [ -f ".github/workflows/pr-validation.yml" ]; then
    echo "✅ GitHub Actions workflow already exists"
else
    echo "❌ GitHub Actions workflow not found"
    echo "Please ensure .github/workflows/pr-validation.yml exists"
    exit 1
fi

# Check if test files exist
echo "🔍 Checking test files..."

required_files=(
    "tests/minimal-validation-test.js"
    "tests/sample-resumes/minimal-test.txt"
    "PR_VALIDATION_GUIDE.md"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
        exit 1
    fi
done

# Check package.json for test script
if grep -q "test:minimal" package.json; then
    echo "✅ test:minimal script found in package.json"
else
    echo "❌ test:minimal script missing from package.json"
    exit 1
fi

# Test the minimal validation
echo ""
echo "🧪 Testing minimal validation..."
if pnpm run test:minimal; then
    echo "✅ Minimal validation test passed"
else
    echo "❌ Minimal validation test failed"
    echo "Please check your worker URL and deployment"
    exit 1
fi

echo ""
echo "📋 Setup Summary"
echo "================"
echo "✅ GitHub Actions workflow: .github/workflows/pr-validation.yml"
echo "✅ Test script: tests/minimal-validation-test.js"
echo "✅ Test resume: tests/sample-resumes/minimal-test.txt"
echo "✅ Documentation: PR_VALIDATION_GUIDE.md"
echo "✅ Package script: pnpm run test:minimal"
echo "✅ Local test: PASSED"

echo ""
echo "🎉 PR Validation System is ready!"
echo ""
echo "Next steps:"
echo "1. Commit and push your changes"
echo "2. Create a pull request to trigger the validation"
echo "3. Check the PR comments for validation results"
echo ""
echo "To test locally:"
echo "  pnpm run test:minimal"
echo ""
echo "To test health endpoint:"
echo "  pnpm run test:quick"
echo ""
echo "For more information, see PR_VALIDATION_GUIDE.md"
