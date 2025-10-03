# 📄 PDF Resume Testing Guide

This guide shows you how to test specific PDF resumes and check the JSON results from the Resume Processor API.

## 🚀 Quick Start

### Method 1: Test Any PDF File (Recommended)

```bash
# Test any PDF resume you have
node tests/manual-pdf-test.js /path/to/your/resume.pdf

# Example with existing PDF
node tests/manual-pdf-test.js "tests/sample-resumes/pdf/international/Ивановская Мария.pdf"
```

### Method 2: Run Comprehensive Test Suite

```bash
# Run all PDF tests (tests existing PDFs in the project)
node tests/pdf-test-runner.js

# Run original text-only tests
npm test
```

### Method 3: Direct API Testing

```bash
# Test with curl
curl -X POST https://resume-processor-worker.dev-a96.workers.dev/process-resume \
  -H "Content-Type: application/json" \
  -d '{
    "resume_text": "Your resume text here...",
    "language": "en",
    "options": {
      "flexible_validation": true,
      "include_unmapped": true
    }
  }'
```

## 📁 Available Test PDFs

The project includes several test PDFs organized by category:

### International PDFs

- `tests/sample-resumes/pdf/international/Ивановская Мария.pdf` - Russian resume
- `tests/sample-resumes/pdf/international/Машин Георгий Павлович.pdf` - Russian resume

### Simple PDFs

- `tests/sample-resumes/pdf/simple/sumanprasad_08Jun_30.pdf` - English resume

### Test Directories

- `tests/sample-resumes/pdf/complex/` - Complex layouts (empty - add your own)
- `tests/sample-resumes/pdf/creators/` - Different PDF sources (empty - add your own)
- `tests/sample-resumes/pdf/edge-cases/` - Problem files (empty - add your own)

## 🧪 Step-by-Step Testing Examples

### Example 1: Test Russian PDF Resume

```bash
# Test the Russian resume
node tests/manual-pdf-test.js "tests/sample-resumes/pdf/international/Ивановская Мария.pdf"
```

**Expected Output:**

```
🧪 Testing PDF: tests/sample-resumes/pdf/international/Ивановская Мария.pdf
=====================================

📄 PDF Info:
   - File Size: 245KB
   - Base64 Size: 327KB

🔍 Test 1: Current API (Text Only)
-----------------------------------
   Status: 200
   Success: true
   Message: PDF data cannot be processed as text (expected)

🔍 Test 2: Future PDF API (To Be Implemented)
----------------------------------------------
   Request Body Structure:
   {
     "input_type": "pdf",
     "resume_pdf": {
       "filename": "Ивановская Мария.pdf",
       "content_type": "application/pdf",
       "data": "[base64 data 327KB]"
     },
     "language": "ru",
     "pdf_options": { ... },
     "options": { ... }
   }

   📁 Request template saved to: tests/manual-pdf-request.json

🔍 Test 3: Attempt PDF Processing
----------------------------------
   Status: 404 (Endpoint not implemented yet - expected)

🏁 Manual PDF Test Complete
```

### Example 2: Test English PDF Resume

```bash
# Test the English resume
node tests/manual-pdf-test.js "tests/sample-resumes/pdf/simple/sumanprasad_08Jun_30.pdf"
```

### Example 3: Run Full Test Suite

```bash
# Run comprehensive tests
node tests/pdf-test-runner.js
```

**Expected Output:**

```
🚀 Enhanced PDF Test Suite
===========================
Testing worker at: https://resume-processor-worker.dev-a96.workers.dev

📄 Testing Text Resumes (Baseline)...

✅ PASS senior-backend-engineer.txt: Text processing works

📄 Testing PDF Resumes...

🧪 Testing PDF: Ивановская Мария.pdf

✅ PASS Ивановская Мария.pdf: File size acceptable
   245KB (limit: 10MB)

✅ PASS Ивановская Мария.pdf: Returns valid HTTP status

✅ PASS Ивановская Мария.pdf: PDF endpoint not implemented yet
   Expected during development

📊 Enhanced Test Results Summary
=================================
Total tests: 3
✅ Passed: 3
❌ Failed: 0
Success rate: 100%

🎉 All tests passed!
```

## 📋 Understanding the JSON Results

### Current API Response (Text Processing)

When you test a PDF, the current API will attempt to process it as text. Here's what the JSON response looks like:

```json
{
  "success": true,
  "data": {
    "version": "1.1",
    "desired_titles": ["Software Developer", "Backend Engineer"],
    "summary": "Experienced software developer with 5+ years...",
    "skills": [
      {
        "name": "Python",
        "level": 4,
        "label": "advanced",
        "type": "programming_language"
      },
      "JavaScript",
      "React"
    ],
    "experience": [
      {
        "employer": "TechCorp Inc",
        "title": "Software Engineer",
        "start": "2020-01",
        "end": "present",
        "description": "Developed web applications...",
        "location": "San Francisco, CA"
      }
    ],
    "location_preference": {
      "type": "remote",
      "preferred_locations": ["San Francisco Bay Area", "Remote"]
    },
    "schedule": "full_time",
    "salary_expectation": {
      "currency": "USD",
      "min": 120000,
      "max": 150000,
      "periodicity": "year"
    },
    "availability": "2 weeks notice",
    "links": [
      {
        "label": "LinkedIn",
        "url": "https://linkedin.com/in/johndoe"
      }
    ]
  },
  "unmapped_fields": ["CERTIFICATIONS", "EDUCATION"],
  "errors": [],
  "processing_time_ms": 1250,
  "validation_errors": [],
  "partial_fields": [],
  "metadata": {
    "worker_version": "1.0.0",
    "ai_model_used": "@cf/meta/llama-2-7b-chat-int8",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "format_detected": "chronological",
    "format_confidence": 0.85
  }
}
```

### Future PDF API Response (To Be Implemented)

When PDF processing is implemented, the response will include PDF-specific metadata:

```json
{
  "success": true,
  "data": {
    // ... same resume data structure
  },
  "metadata": {
    "worker_version": "1.0.0",
    "ai_model_used": "@cf/meta/llama-2-7b-chat-int8",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "format_detected": "chronological",
    "format_confidence": 0.85,
    "pdf_pages": 2,
    "pdf_extraction_method": "text_extraction",
    "pdf_has_images": false,
    "pdf_has_tables": true
  }
}
```

## 🔧 Custom Testing

### Test Your Own PDF

1. **Place your PDF** in the `tests/sample-resumes/pdf/` directory:

   ```bash
   # Create appropriate subdirectory
   mkdir -p tests/sample-resumes/pdf/my-resumes/

   # Copy your PDF
   cp /path/to/your/resume.pdf tests/sample-resumes/pdf/my-resumes/
   ```

2. **Test your PDF**:
   ```bash
   node tests/manual-pdf-test.js tests/sample-resumes/pdf/my-resumes/your-resume.pdf
   ```

### Test with Different Languages

```bash
# Test Russian resume with Russian language detection
node tests/manual-pdf-test.js "tests/sample-resumes/pdf/international/Ивановская Мария.pdf"

# The script automatically detects language from filename
# Files with "russian" or "ru-" in name will use language: "ru"
```

### Test with Custom Options

You can modify the test scripts to use different options:

```javascript
// In tests/manual-pdf-test.js, modify the request body:
const pdfRequestBody = {
  input_type: 'pdf',
  resume_pdf: {
    data: pdfBase64,
    filename: pdfPath.split('/').pop(),
    content_type: 'application/pdf',
  },
  language: 'ru', // Force Russian language
  pdf_options: {
    extract_images: true, // Enable image extraction
    preserve_formatting: true,
    ocr_fallback: true, // Enable OCR fallback
  },
  options: {
    include_unmapped: true,
    strict_validation: false,
    flexible_validation: true,
  },
};
```

## 📊 Analyzing Test Results

### Success Indicators

✅ **Good Results:**

- `success: true`
- `processing_time_ms < 30000` (under 30 seconds)
- `data` object contains extracted information
- `format_detected` with high confidence (>0.7)

### Warning Signs

⚠️ **Partial Results:**

- `partial_fields` array contains missing fields
- `validation_errors` with warnings
- `unmapped_fields` contains important sections

### Error Cases

❌ **Failed Results:**

- `success: false`
- `errors` array contains error messages
- `data: null`
- High processing times (>60 seconds)

### Example Analysis

```json
{
  "success": true,
  "data": {
    "desired_titles": ["Software Engineer"],
    "skills": ["Python", "JavaScript"]
    // Missing: summary, experience, location_preference
  },
  "partial_fields": ["summary", "experience", "location_preference"],
  "validation_errors": [
    {
      "field": "experience",
      "error": "missing",
      "suggestion": "Add an 'Experience' section with your previous positions",
      "severity": "warning"
    }
  ],
  "metadata": {
    "format_detected": "chronological",
    "format_confidence": 0.6
  }
}
```

**Analysis:** The resume was partially processed. Skills and job titles were extracted, but experience and summary sections are missing. The confidence score (0.6) indicates moderate extraction quality.

## 🛠️ Troubleshooting

### Common Issues

1. **"PDF endpoint not implemented yet"**
   - **Cause:** PDF processing is not yet implemented in the API
   - **Solution:** This is expected. The API currently processes PDFs as text only.

2. **"File size too large"**
   - **Cause:** PDF exceeds 10MB limit
   - **Solution:** Compress the PDF or use a smaller file

3. **"PDF data cannot be processed as text"**
   - **Cause:** PDF contains images or complex formatting
   - **Solution:** This is expected behavior until OCR is implemented

4. **"Processing timeout"**
   - **Cause:** Large or complex PDF
   - **Solution:** Try with a simpler PDF or wait for PDF processing implementation

### Debug Mode

Enable detailed logging by setting environment variables:

```bash
# Enable debug mode
DEBUG=true node tests/manual-pdf-test.js your-resume.pdf

# Use different worker URL for testing
WORKER_URL=https://your-staging-worker.dev.workers.dev node tests/manual-pdf-test.js your-resume.pdf
```

### Check API Health

```bash
# Test API health
curl https://resume-processor-worker.dev-a96.workers.dev/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "endpoints": ["/", "/health", "/process-resume"],
  "ai_status": "available"
}
```

## 📈 Performance Testing

### Measure Processing Time

```bash
# Time the test execution
time node tests/manual-pdf-test.js your-resume.pdf

# Example output:
real    0m2.345s
user    0m1.234s
sys     0m0.111s
```

### Test Multiple PDFs

```bash
# Test all PDFs in a directory
for pdf in tests/sample-resumes/pdf/international/*.pdf; do
  echo "Testing: $pdf"
  node tests/manual-pdf-test.js "$pdf"
  echo "---"
done
```

### Batch Testing

```bash
# Run comprehensive test suite with timing
time node tests/pdf-test-runner.js
```

## 🔮 Future PDF Processing

When PDF processing is implemented, you'll be able to:

1. **Extract text from PDFs** automatically
2. **Process images and tables** in PDFs
3. **Handle complex layouts** (multi-column, etc.)
4. **Use OCR for scanned PDFs**
5. **Preserve formatting** information

The current testing infrastructure is already set up to support these features when they become available.

## 📚 Additional Resources

- **API Documentation:** [API_REQUEST_FORMAT_GUIDE.md](./API_REQUEST_FORMAT_GUIDE.md)
- **Testing Workflow:** [PDF_TESTING_WORKFLOW.md](./PDF_TESTING_WORKFLOW.md)
- **Russian Examples:** [RUSSIAN_RESUME_EXAMPLES.md](./RUSSIAN_RESUME_EXAMPLES.md)
- **Schema Definition:** [resume_data_contract/resume_data_schema.json](./resume_data_contract/resume_data_schema.json)

## 🆘 Getting Help

If you encounter issues:

1. **Check the health endpoint** first: `curl https://resume-processor-worker.dev-a96.workers.dev/health`
2. **Verify your PDF file** is valid and not corrupted
3. **Check file size** (should be under 10MB)
4. **Review the test output** for specific error messages
5. **Try with a simpler PDF** to isolate the issue

---

**Ready to test?** Start with this command:

```bash
node tests/manual-pdf-test.js tests/sample-resumes/pdf/international/Ивановская Мария.pdf
```
