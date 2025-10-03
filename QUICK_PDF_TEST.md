# 🚀 Quick PDF Testing Guide

**TL;DR:** How to test PDF resumes and check JSON results in 3 simple steps.

## 📋 What You Need

- Node.js installed
- A PDF resume file (or use the existing test files)

## 🎯 3-Step Testing Process

### Step 1: Test Any PDF File

```bash
# Navigate to project directory
cd /path/to/job-resume-data-contract

# Test any PDF resume
node tests/manual-pdf-test.js /path/to/your/resume.pdf

# Or test existing PDFs in the project:
node tests/manual-pdf-test.js "tests/sample-resumes/pdf/international/Ивановская Мария.pdf"
node tests/manual-pdf-test.js "tests/sample-resumes/pdf/simple/sumanprasad_08Jun_30.pdf"
```

### Step 2: Check the Results

The test will show you:

```
🧪 Testing PDF: your-resume.pdf
=====================================

📄 PDF Info:
   - File Size: 109KB
   - Base64 Size: 145KB

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
       "filename": "your-resume.pdf",
       "content_type": "application/pdf",
       "data": "[base64 data 145KB]"
     },
     "language": "en",
     "pdf_options": { ... },
     "options": { ... }
   }

🔍 Test 3: Attempt PDF Processing
----------------------------------
   Status: 404 (Endpoint not implemented yet - expected)

🏁 Manual PDF Test Complete
```

### Step 3: See What JSON Results Look Like

**Current Status:** PDF processing is not yet implemented, but you can see how text resumes work:

```bash
# Test with a text resume to see the JSON output
curl -X POST https://resume-processor-worker.dev-a96.workers.dev/process-resume \
  -H "Content-Type: application/json" \
  -d '{
    "resume_text": "JOHN SMITH\nSenior Software Engineer\n\nEXPERIENCE:\nSoftware Engineer at TechCorp | 2020-2024\n- Built web applications\n- Used Python and JavaScript\n\nSKILLS:\n- Python (Advanced)\n- JavaScript (Expert)\n- React (Proficient)",
    "language": "en",
    "options": {
      "flexible_validation": true,
      "include_unmapped": true
    }
  }' | jq .
```

**Expected JSON Output:**

```json
{
  "success": true,
  "data": {
    "desired_titles": ["Senior Software Engineer"],
    "summary": "Software engineer with experience...",
    "skills": [
      {
        "name": "Python",
        "level": 4,
        "type": "programming_language"
      },
      {
        "name": "JavaScript",
        "level": 5,
        "type": "programming_language"
      },
      {
        "name": "React",
        "level": 3,
        "type": "programming_language"
      }
    ],
    "experience": [
      {
        "employer": "TechCorp",
        "title": "Software Engineer",
        "start": "2020-01",
        "end": "2024-12",
        "description": "Built web applications, used Python and JavaScript"
      }
    ]
  },
  "processing_time_ms": 9392,
  "metadata": {
    "format_detected": "chronological",
    "format_confidence": 0.9
  }
}
```

## 🔍 Understanding the Results

### Current PDF Testing Results

When you test a PDF file, you'll see:

- ✅ **File size check** - Confirms PDF is under 10MB limit
- ✅ **Base64 conversion** - Shows how PDF is encoded for API
- ✅ **Request structure** - Shows the JSON format for PDF processing
- ⚠️ **404 status** - Expected until PDF processing is implemented

### Future PDF Processing (When Implemented)

When PDF processing is available, you'll get:

- ✅ **Text extraction** from PDF files
- ✅ **Structured JSON** with resume data
- ✅ **PDF metadata** (pages, extraction method, etc.)
- ✅ **Multi-language support** (English, Russian, etc.)

## 🧪 Available Test PDFs

The project includes these test files:

```bash
# International resumes
tests/sample-resumes/pdf/international/Doğuş Baran Karadağ.pdf    # Turkish
tests/sample-resumes/pdf/international/Ивановская Мария.pdf       # Russian
tests/sample-resumes/pdf/international/Машин Георгий Павлович.pdf # Russian

# Simple resumes
tests/sample-resumes/pdf/simple/sumanprasad_08Jun_30.pdf          # English
```

## 🚀 Quick Commands

```bash
# Test Russian PDF
node tests/manual-pdf-test.js "tests/sample-resumes/pdf/international/Ивановская Мария.pdf"

# Test English PDF
node tests/manual-pdf-test.js "tests/sample-resumes/pdf/simple/sumanprasad_08Jun_30.pdf"

# Run full test suite
node tests/pdf-test-runner.js

# Test API health
curl https://resume-processor-worker.dev-a96.workers.dev/health
```

## 📊 What the Tests Show

1. **File Processing** - PDF files are read and converted to base64
2. **API Structure** - Shows the exact JSON format for PDF requests
3. **Current Limitations** - PDF processing endpoint returns 404 (not implemented yet)
4. **Future Capabilities** - Request structure ready for when PDF processing is added

## 🔮 Next Steps

When PDF processing is implemented, you'll be able to:

1. **Upload PDF files** directly to the API
2. **Get structured JSON** extracted from PDF content
3. **Process multi-language** PDFs (English, Russian, Turkish, etc.)
4. **Handle complex layouts** and formatting

The testing infrastructure is already in place and ready for when these features become available!

---

**Need more details?** Check the full [PDF_TESTING_GUIDE.md](./PDF_TESTING_GUIDE.md) for comprehensive documentation.
