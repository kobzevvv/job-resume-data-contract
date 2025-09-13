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

# Check that all workflows use Node.js 20
if grep -r "node-version" .github/workflows/ | grep -q "18"; then
  echo "❌ Found Node.js v18 in workflows - update to v20!"
  exit 1
fi

# Validate pnpm setup consistency
PNPM_SETUPS=$(grep -r "pnpm/action-setup" .github/workflows/ | wc -l)
echo "📋 PNPM setups: $PNPM_SETUPS instances"

# Check for mixed package managers (should find no npm commands)
NPM_COMMANDS=$(grep -r "npm ci\|npm install\|npm run" .github/workflows/ | wc -l)
if [ "$NPM_COMMANDS" -gt 0 ]; then
  echo "❌ Found $NPM_COMMANDS npm commands in workflows - convert to pnpm!"
  grep -r "npm ci\|npm install\|npm run" .github/workflows/
  exit 1
else
  echo "✅ No npm commands found in workflows"
fi

echo "✅ Setup validation passed!"
