# 📚 Resume Processor API Documentation

A simple guide for developers to integrate with the Resume Processor API - converts unstructured resume text into structured JSON using AI.

## 🚀 Quick Start

**Base URL:** `https://resume-processor-worker.dev-a96.workers.dev`  
**Authentication:** None required  
**Content-Type:** `application/json`

---

## 📋 API Endpoints

### Process Resume

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

### Health Check

**GET** `/health`

Check API status.

#### Response

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "endpoints": ["/", "/health", "/process-resume"],
  "ai_status": "available"
}
```

---

## 💻 Code Examples

### JavaScript

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

### Python

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

### cURL

```bash
curl -X POST https://resume-processor-worker.dev-a96.workers.dev/process-resume \
  -H "Content-Type: application/json" \
  -d '{
    "resume_text": "JOHN SMITH\nSenior Backend Engineer...",
    "language": "en",
    "options": {"include_unmapped": true}
  }'
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
- `400` - Bad Request (invalid input)
- `422` - AI processing failed
- `429` - Rate limit exceeded
- `500` - Internal server error

**Rate Limiting:** 100 requests per minute per client

---

## 🧪 Test Resume

Use this sample for testing:

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

---

_Last updated: January 2024_
