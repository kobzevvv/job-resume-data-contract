# Migration Guide: npm → pnpm

## 1. Install pnpm globally
```bash
npm install -g pnpm
```

## 2. Clean up npm artifacts
```bash
rm -rf node_modules
rm package-lock.json
```

## 3. Install dependencies with pnpm
```bash
pnpm install
```
This creates `pnpm-lock.yaml` instead of `package-lock.json`.

## 4. Update GitHub workflows

### Update existing workflows to use pnpm:
In all your workflow files (`.github/workflows/*.yml`), replace:
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: ${{ env.NODE_VERSION }}
    cache: 'npm'

- name: Install dependencies
  run: npm ci
```

With:
```yaml
- name: Setup pnpm
  uses: pnpm/action-setup@v4
  with:
    version: 8

- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: ${{ env.NODE_VERSION }}
    cache: 'pnpm'

- name: Install dependencies
  run: pnpm install --frozen-lockfile
```

## 5. Update package.json scripts (if needed)
Most scripts work as-is, but you can optionally update:
- `npm run` → `pnpm run` (both work)
- `npm test` → `pnpm test` (both work)

## 6. Test everything
```bash
pnpm run build
pnpm run type-check
pnpm test
```

## 7. Commit changes
```bash
git add .
git commit -m "chore: migrate from npm to pnpm"
```

## Benefits you'll see immediately:
- ✅ Faster installs (2-3x speed improvement)
- ✅ Less disk space usage
- ✅ Stricter dependency resolution (catches phantom dependencies)
- ✅ Better performance in CI/CD

## Rollback if needed:
```bash
rm -rf node_modules pnpm-lock.yaml
npm install
# Revert workflow changes
```
