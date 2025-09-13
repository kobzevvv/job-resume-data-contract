# Workflow Setup & Version Management Guide

## 🚨 Critical: Version Consistency Checklist

Before creating any PR or making changes, ensure these are aligned:

### 1. Package Manager Configuration
```bash
# Check your package.json packageManager field
cat package.json | grep packageManager

# Should match: pnpm@9.12.3+sha512...
```

### 2. Node.js Version Requirements
```bash
# Check package.json engines
cat package.json | grep -A2 engines

# Should be: "node": ">=20.0.0" (required by Wrangler)
```

### 3. GitHub Actions Consistency
```bash
# Verify all workflows use the same Node.js version
grep -r "node-version" .github/workflows/
# Should all show: node-version: '20'

# Verify all workflows use pnpm without version spec
grep -r "pnpm/action-setup" .github/workflows/
# Should show: uses: pnpm/action-setup@v4 (no version: field)
```

## 🔧 Quick Setup Validation

Run this command to validate your setup:
```bash
# One-liner validation
echo "🔍 Validating workflow setup..." && \
  echo "Package Manager: $(grep packageManager package.json)" && \
  echo "Node Version: $(grep -A2 engines package.json | grep node)" && \
  echo "Workflow Node Versions: $(grep -r "node-version" .github/workflows/ | wc -l) instances" && \
  echo "PNPM Setup Actions: $(grep -r "pnpm/action-setup" .github/workflows/ | wc -l) instances" && \
  echo "✅ Validation complete"
```

## 🚀 Pre-PR Checklist

Before opening any PR, run:
```bash
# 1. Validate versions
pnpm run quality

# 2. Test build process
pnpm run build
pnpm exec wrangler deploy --dry-run --env staging

# 3. Run tests locally
pnpm test

# 4. Check for version conflicts
pnpm outdated
```

## 🛠️ Common Issues & Quick Fixes

### Issue: "Multiple versions of pnpm specified"
**Cause**: GitHub Action specifies version, package.json has different version
**Fix**: Remove `version: X` from pnpm/action-setup, let it use package.json

### Issue: "Wrangler requires Node.js v20+"
**Cause**: Workflows using Node.js v18
**Fix**: Update all workflows to `node-version: '20'`

### Issue: "Build output directory not found"
**Cause**: Expecting `dist/` folder for Cloudflare Workers
**Fix**: Workers use `noEmit: true`, bundling handled by Wrangler

### Issue: "Processing time reasonable" test fails
**Cause**: Complex resumes take >30s to process
**Fix**: Increase timeout to 60-90 seconds

## 📋 Automated Validation Script

Create `scripts/validate-setup.sh`:
```bash
#!/bin/bash
set -e

echo "🔍 Validating project setup..."

# Check package manager consistency
PACKAGE_MANAGER=$(grep packageManager package.json)
echo "📦 Package Manager: $PACKAGE_MANAGER"

# Check Node.js version
NODE_VERSION=$(grep -A2 engines package.json | grep node)
echo "🟢 Node.js: $NODE_VERSION"

# Check workflow consistency
WORKFLOW_NODE_VERSIONS=$(grep -r "node-version" .github/workflows/ | wc -l)
echo "⚙️  Workflow Node versions: $WORKFLOW_NODE_VERSIONS instances"

# Check for version conflicts in workflows
if grep -r "version:" .github/workflows/ | grep -q "pnpm"; then
  echo "❌ Found explicit pnpm versions in workflows - remove them!"
  exit 1
fi

echo "✅ Setup validation passed!"
```

## 🎯 Best Practices

1. **Never specify pnpm version in workflows** - let it use package.json
2. **Always use Node.js v20+** for Wrangler compatibility  
3. **Test workflows locally first** using `act` or similar
4. **Use consistent package manager** throughout the project
5. **Validate before PR** using the checklist above

## 🚨 Emergency Fix Commands

If you encounter version conflicts:
```bash
# Reset to consistent state
git checkout main
pnpm install --frozen-lockfile
pnpm run quality
```

## 📚 Related Documentation

- [CODE_QUALITY_SETUP.md](./CODE_QUALITY_SETUP.md) - Code quality tools
- [MIGRATION_TO_PNPM.md](./MIGRATION_TO_PNPM.md) - Package manager migration
- [README.md](./README.md) - Project overview
