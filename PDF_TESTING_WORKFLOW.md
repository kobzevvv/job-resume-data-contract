# 🧪 Test-Driven PDF Development Workflow

This guide outlines the iterative test-driven development process for implementing PDF resume processing.

## 🚀 Quick Start

### 1. Manual Testing (Do This First!)

```bash
# Test with any PDF file you have
node tests/manual-pdf-test.js /path/to/your/resume.pdf

# Or run without arguments to see instructions
node tests/manual-pdf-test.js
```

### 2. Enhanced Test Suite

```bash
# Run comprehensive PDF tests
node tests/pdf-test-runner.js

# Run original text-only tests
npm test
```

## 📁 Test Data Organization

```
tests/
├── sample-resumes/
│   ├── *.txt                           # Original text resumes (✅ existing)
│   └── pdf/                           # PDF test collection
│       ├── simple/                    # Basic PDF resumes
│       │   ├── senior-backend-engineer.pdf    # Convert from .txt
│       │   ├── junior-frontend-developer.pdf  # New test case
│       │   └── marketing-manager.pdf          # Different domain
│       ├── complex/                   # Advanced layouts
│       │   ├── multi-column-design.pdf       # 2-column layout
│       │   ├── with-images-charts.pdf        # Graphics content
│       │   └── fancy-template.pdf            # Creative design
│       ├── international/             # Multi-language
│       │   ├── russian-it-specialist.pdf     # Convert from .txt
│       │   ├── german-engineer.pdf           # New language
│       │   └── spanish-designer.pdf          # Another language
│       ├── edge-cases/               # Problem files
│       │   ├── password-protected.pdf        # Security test
│       │   ├── corrupted-file.pdf            # Error handling
│       │   ├── scanned-resume.pdf            # OCR required
│       │   └── very-large-file.pdf           # Size limit test
│       └── creators/                 # Different PDF sources
│           ├── word-export.pdf               # Microsoft Word
│           ├── latex-generated.pdf           # LaTeX/Academic
│           ├── canva-template.pdf            # Design tool
│           └── google-docs-export.pdf        # Google Docs
├── expected-outputs/
│   └── pdf/                          # PDF-specific expected results
│       ├── senior-backend-engineer-pdf.json
│       └── russian-it-specialist-pdf.json
└── manual-pdf-request.json           # Generated request template
```

## 🔄 Development Workflow

### Phase 1: Setup Test Data (Week 1)

1. **Create Test PDFs** (Priority Order):

   ```bash
   # High Priority (Do First)
   ✅ Convert senior-backend-engineer.txt → PDF
   ✅ Convert russian-it-specialist.txt → PDF
   ✅ Create simple-frontend-dev.pdf (new test case)

   # Medium Priority
   📄 Download from Canva/LinkedIn (realistic templates)
   📄 Export from Word/Google Docs (common formats)

   # Low Priority (Edge Cases)
   🚫 Password-protected PDF
   📊 PDF with charts/graphics
   📄 Scanned resume (image-based)
   ```

2. **Test Current System**:

   ```bash
   # Verify baseline text processing works
   npm test

   # Test manual PDF upload (will fail gracefully)
   node tests/manual-pdf-test.js tests/sample-resumes/pdf/simple/senior-backend-engineer.pdf
   ```

### Phase 2: Implement PDF Processing (Week 2-3)

1. **Add PDF Dependencies**:

   ```bash
   npm install pdf-parse @types/pdf-parse
   ```

2. **Implement Core Components**:
   - [ ] `src/pdf-processor.ts` - PDF text extraction
   - [ ] `src/input-handler.ts` - Input type detection
   - [ ] Enhance `src/types.ts` - Add PDF types
   - [ ] Update `src/index.ts` - Add PDF endpoints

3. **Test Each Component**:

   ```bash
   # After each implementation step
   node tests/pdf-test-runner.js

   # Test specific PDF
   node tests/manual-pdf-test.js path/to/specific/resume.pdf
   ```

### Phase 3: Iterative Improvement (Week 4+)

**Daily Development Cycle**:

```bash
# 1. Make code changes
code src/pdf-processor.ts

# 2. Test locally
pnpm run build

# 3. Deploy to staging
pnpm run deploy:staging

# 4. Run comprehensive tests
WORKER_URL=https://your-staging-worker.dev.workers.dev node tests/pdf-test-runner.js

# 5. Test specific edge cases
node tests/manual-pdf-test.js tests/sample-resumes/pdf/edge-cases/corrupted-file.pdf

# 6. Compare PDF vs Text results
# (Built into pdf-test-runner.js)

# 7. Analyze failures and iterate
```

## 📊 Test Success Criteria

### Phase 1 Targets (Basic PDF Support)

- [ ] ✅ 90%+ success rate on simple PDFs (Word/Google Docs exports)
- [ ] ✅ Graceful error handling for unsupported PDFs
- [ ] ✅ PDF vs Text comparison >70% similarity
- [ ] ✅ Processing time <30 seconds for typical resumes

### Phase 2 Targets (Production Ready)

- [ ] ✅ 95%+ success rate on simple + complex PDFs
- [ ] ✅ Multi-language support (English + Russian)
- [ ] ✅ Edge case handling (password, corruption, size limits)
- [ ] ✅ PDF vs Text comparison >80% similarity

### Phase 3 Targets (Advanced Features)

- [ ] ✅ OCR fallback for scanned PDFs
- [ ] ✅ Layout preservation for complex designs
- [ ] ✅ Batch processing for multiple PDFs
- [ ] ✅ Real-time processing metrics

## 🐛 Debugging Workflow

### Common Issues & Solutions

1. **PDF Text Extraction Fails**:

   ```bash
   # Check PDF structure
   node tests/manual-pdf-test.js problematic.pdf

   # Compare with working PDFs
   diff expected-output.json actual-output.json
   ```

2. **Processing Timeout**:

   ```bash
   # Test with smaller PDFs first
   # Check PDF complexity (pages, images, embedded fonts)
   ```

3. **Low Similarity Scores**:
   ```bash
   # Review extraction quality
   # Check text formatting differences
   # Validate skill/title matching logic
   ```

## 📈 Progress Tracking

### Test Commands Summary

```bash
# Development cycle commands
npm test                           # Baseline text tests
node tests/manual-pdf-test.js     # Manual PDF testing
node tests/pdf-test-runner.js     # Full PDF test suite

# Deployment testing
WORKER_URL=staging-url npm test              # Test staging
WORKER_URL=production-url npm test          # Test production

# Performance testing
time node tests/pdf-test-runner.js          # Measure test duration
```

### Success Metrics Dashboard

| Phase | Simple PDFs | Complex PDFs | Edge Cases | Text Similarity | Avg Processing Time |
| ----- | ----------- | ------------ | ---------- | --------------- | ------------------- |
| 1     | 90% ✅      | 0% ⏳        | 0% ⏳      | 70% ✅          | <30s ✅             |
| 2     | 95% ⏳      | 80% ⏳       | 60% ⏳     | 80% ⏳          | <20s ⏳             |
| 3     | 98% ⏳      | 90% ⏳       | 80% ⏳     | 85% ⏳          | <15s ⏳             |

## 🎯 Next Steps

1. **Immediate Actions** (This Week):
   - [ ] Run `node tests/manual-pdf-test.js` to understand current API structure
   - [ ] Convert 2-3 existing text resumes to PDF format
   - [ ] Create `tests/sample-resumes/pdf/simple/` directory structure

2. **Development Planning** (Next Week):
   - [ ] Review PDF processing library options
   - [ ] Design API endpoints for PDF input
   - [ ] Implement basic PDF text extraction

3. **Continuous Testing**:
   - [ ] Add PDF test to CI/CD pipeline
   - [ ] Set up automated PDF vs Text comparison
   - [ ] Monitor processing performance metrics

---

**Ready to Start?** Run this command to begin:

```bash
node tests/manual-pdf-test.js
```
