# 📚 Resume Processor API Documentation

A comprehensive guide for developers to integrate with the Resume Processor API - converts unstructured resume text and PDF files into structured JSON using AI.

## 🚀 Quick Start

**Base URL:** `https://resume-processor-worker.dev-a96.workers.dev`  
**Authentication:** None required  
**Content-Type:** `application/json` (text) or `multipart/form-data` (PDF)

---

## 📋 API Endpoints

### Process Resume (Text)

**POST** `/process-resume`

Converts resume text into structured JSON.

#### Request

```json
{
  "resume_text": "JOHN SMITH\nSenior Backend Engineer\n\nPROFESSIONAL SUMMARY:\nExperienced backend engineer with 8+ years...",
  "language": "en",
  "options": {
    "include_unmapped": true,
    "strict_validation": false
  }
}
```

**Parameters:**

- `resume_text` (required): Resume text (min 50 characters)
- `language` (optional): Language code ('en', 'ru', 'de', etc.) - defaults to 'en'
- `options.include_unmapped` (optional): Include unmapped fields in response - defaults to true
- `options.strict_validation` (optional): Fail on validation errors - defaults to false

#### Response

```json
{
  "success": true,
  "data": {
    "desired_titles": ["Senior Backend Engineer", "Staff Engineer"],
    "summary": "Experienced backend engineer with 8+ years building scalable distributed systems.",
    "skills": [
      {
        "name": "Go",
        "level": 5,
        "label": "expert",
        "type": "programming_language"
      },
      {
        "name": "Python",
        "level": 5,
        "label": "expert",
        "type": "programming_language"
      }
    ],
    "experience": [
      {
        "employer": "TechCorp Inc",
        "title": "Senior Software Engineer",
        "start": "2022-03",
        "end": "present",
        "description": "Led development of order processing platform handling 100k+ transactions/day",
        "location": "San Francisco, CA"
      }
    ],
    "location_preference": {
      "type": "remote",
      "preferred_locations": ["San Francisco Bay Area"]
    },
    "schedule": "full_time",
    "salary_expectation": {
      "currency": "USD",
      "min": 150000,
      "max": 180000,
      "periodicity": "year"
    },
    "availability": "2 weeks notice",
    "links": [
      {
        "label": "LinkedIn",
        "url": "https://linkedin.com/in/johnsmith"
      }
    ]
  },
  "unmapped_fields": ["CERTIFICATIONS", "EDUCATION"],
  "errors": [],
  "processing_time_ms": 1250,
  "metadata": {
    "worker_version": "1.0.0",
    "ai_model_used": "@cf/meta/llama-2-7b-chat-int8",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### Process Resume (PDF)

**POST** `/process-resume-pdf`

Converts PDF resume files into structured JSON.

#### Request

**Content-Type:** `multipart/form-data`

**Form Fields:**

- `pdf` (required): PDF file
- `language` (optional): Language code ('en', 'ru', 'de', etc.) - defaults to 'en'
- `flexible_validation` (optional): Allow partial data on validation errors - defaults to 'true'
- `strict_validation` (optional): Fail on validation errors - defaults to 'false'

#### Response

Same structure as text processing, with additional PDF metadata:

```json
{
  "success": true,
  "data": {
    "desired_titles": ["Системный аналитик"],
    "summary": "Системный аналитик уровня Middle с опытом реализации бизнес-процессов...",
    "skills": [
      {
        "name": "UML",
        "level": 3,
        "type": "modeling_language"
      }
    ],
    "experience": [...],
    "location_preference": {...},
    "schedule": "полный день, удаленная работа",
    "availability": "готов к редким командировкам",
    "links": [...]
  },
  "errors": [],
  "unmapped_fields": [],
  "processing_time_ms": 26669,
  "metadata": {
    "worker_version": "1.0.0",
    "ai_model_used": "@cf/meta/llama-2-7b-chat-int8",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "format_detected": "chronological",
    "format_confidence": 0.9
  }
}
```

### Health Check

**GET** `/health`

Check API status.

#### Response

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "endpoints": ["/", "/health", "/process-resume", "/process-resume-pdf"],
  "ai_status": "available"
}
```

---

## 💻 Code Examples

### JavaScript (Text Processing)

```javascript
async function processResume(resumeText) {
  const response = await fetch(
    'https://resume-processor-worker.dev-a96.workers.dev/process-resume',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resume_text: resumeText,
        language: 'en',
        options: { include_unmapped: true },
      }),
    }
  );

  return await response.json();
}

// Usage
const result = await processResume('JOHN SMITH\nSenior Backend Engineer...');
if (result.success) {
  console.log('Extracted:', result.data);
  console.log('Unmapped:', result.unmapped_fields);
}
```

### JavaScript (PDF Processing)

```javascript
async function processResumePDF(pdfFile) {
  const formData = new FormData();
  formData.append('pdf', pdfFile);
  formData.append('language', 'en');
  formData.append('flexible_validation', 'true');

  const response = await fetch(
    'https://resume-processor-worker.dev-a96.workers.dev/process-resume-pdf',
    {
      method: 'POST',
      body: formData,
    }
  );

  return await response.json();
}

// Usage
const fileInput = document.getElementById('pdfFile');
const pdfFile = fileInput.files[0];
const result = await processResumePDF(pdfFile);
if (result.success) {
  console.log('Extracted:', result.data);
  console.log('Processing time:', result.processing_time_ms + 'ms');
}
```

### Python (Text Processing)

```python
import requests

def process_resume(resume_text):
    response = requests.post(
        'https://resume-processor-worker.dev-a96.workers.dev/process-resume',
        json={
            'resume_text': resume_text,
            'language': 'en',
            'options': {'include_unmapped': True}
        }
    )
    return response.json()

# Usage
result = process_resume("JOHN SMITH\nSenior Backend Engineer...")
if result['success']:
    print('Extracted:', result['data'])
    print('Unmapped:', result['unmapped_fields'])
```

### Python (PDF Processing)

```python
import requests

def process_resume_pdf(pdf_file_path):
    with open(pdf_file_path, 'rb') as pdf_file:
        files = {'pdf': pdf_file}
        data = {
            'language': 'en',
            'flexible_validation': 'true'
        }
        response = requests.post(
            'https://resume-processor-worker.dev-a96.workers.dev/process-resume-pdf',
            files=files,
            data=data
        )
    return response.json()

# Usage
result = process_resume_pdf('resume.pdf')
if result['success']:
    print('Extracted:', result['data'])
    print('Processing time:', result['processing_time_ms'], 'ms')
```

### cURL (Text Processing)

```bash
curl -X POST https://resume-processor-worker.dev-a96.workers.dev/process-resume \
  -H "Content-Type: application/json" \
  -d '{
    "resume_text": "JOHN SMITH\nSenior Backend Engineer...",
    "language": "en",
    "options": {"include_unmapped": true}
  }'
```

### cURL (PDF Processing)

```bash
curl -X POST https://resume-processor-worker.dev-a96.workers.dev/process-resume-pdf \
  -F "pdf=@resume.pdf" \
  -F "language=en" \
  -F "flexible_validation=true"
```

---

## 📊 Data Structure

### Required Fields

- `desired_titles`: Array of job titles
- `summary`: Professional summary
- `skills`: Array of skills with levels (1-5: Basic to Expert)
- `experience`: Array of work experience

### Optional Fields

- `location_preference`: Work location preferences
- `schedule`: Work schedule (full_time, part_time, etc.)
- `salary_expectation`: Salary expectations with currency
- `availability`: Availability information
- `links`: Professional links (LinkedIn, GitHub, etc.)

### Skill Levels

- 1 = Basic
- 2 = Limited
- 3 = Proficient
- 4 = Advanced
- 5 = Expert

---

## ⚠️ Error Handling

**Common HTTP Status Codes:**

- `200` - Success
- `400` - Bad Request (invalid input, missing file)
- `413` - Payload Too Large (request exceeds 50KB limit)
- `422` - AI processing failed
- `429` - Rate limit exceeded
- `500` - Internal server error

**Rate Limiting:** 100 requests per minute per client

**File Size Limits:**

- Text resumes: 50KB request size limit
- PDF files: No specific limit (processed via PDF.co API)

**Supported Languages:**

- English (en) - Default
- Russian (ru) - Full support
- German (de) - Basic support
- Other languages - Experimental support

---

## 🧪 Test Examples

### Test Resume (Text)

Use this sample for testing text processing:

```
JOHN SMITH
Senior Backend Engineer

PROFESSIONAL SUMMARY:
Experienced backend engineer with 8+ years building scalable distributed systems.

EXPERIENCE:
Senior Software Engineer | TechCorp Inc | March 2022 - Present
- Led development of order processing platform handling 100k+ transactions/day
- Built microservices architecture using Go, Docker, and Kubernetes

SKILLS:
- Programming Languages: Go (Expert), Python (Expert), SQL (Advanced)
- Frameworks: Django, Flask, Gin, Echo
- Databases: PostgreSQL (Expert), MySQL (Advanced), Redis (Advanced)

LOOKING FOR:
Senior Backend Engineer positions
Available for remote work
Salary expectation: $150,000 - $180,000 USD per year
```

### Test Resume (Russian PDF)

The API has been tested with Russian PDF resumes and achieves 89% field coverage. Sample Russian resume structure:

```
МАШИН ГЕОРГИЙ ПАВЛОВИЧ
Системный аналитик

ОПЫТ РАБОТЫ:
• Системный аналитик | InProject | 2022-01 - 2025-06
• Интеграция CRM с внешними сервисами
• Разработка технических требований к REST API

НАВЫКИ:
• UML (Уровень: 3)
• BPMN (Уровень: 3)
• SQL (Уровень: 3)
• Agile (Уровень: 3)
```

### Performance Metrics

- **Text Processing**: 2-5 seconds
- **PDF Processing**: 20-30 seconds (includes text extraction)
- **Field Coverage**: 85-95% for well-formatted resumes
- **Success Rate**: >95% for valid input

---

_Last updated: October 2024_
