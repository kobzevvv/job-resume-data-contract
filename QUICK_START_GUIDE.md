# 🚀 Resume Processor API - Quick Start Guide

**Convert resume text and PDF files into structured JSON data using AI**

## What This API Does

The Resume Processor API takes unstructured resume data (text or PDF files) and converts it into a standardized JSON format with:

- ✅ **Job titles** and career objectives
- ✅ **Professional summary**
- ✅ **Skills** with proficiency levels (1-5 scale)
- ✅ **Work experience** with dates and descriptions
- ✅ **Location preferences** and work schedule
- ✅ **Salary expectations** and availability
- ✅ **Professional links** (LinkedIn, GitHub, etc.)

## Quick Start

**Base URL:** `https://resume-processor-worker.dev-a96.workers.dev`

### 1. Process Text Resume

```bash
curl -X POST https://resume-processor-worker.dev-a96.workers.dev/process-resume \
  -H "Content-Type: application/json" \
  -d '{
    "resume_text": "JOHN SMITH\nSenior Backend Engineer\n\nEXPERIENCE:\nSenior Software Engineer at TechCorp...",
    "language": "en"
  }'
```

### 2. Process PDF Resume

```bash
curl -X POST https://resume-processor-worker.dev-a96.workers.dev/process-resume-pdf \
  -F "pdf=@resume.pdf" \
  -F "language=en"
```

### 3. Check API Health

```bash
curl https://resume-processor-worker.dev-a96.workers.dev/health
```

## Response Format

```json
{
  "success": true,
  "data": {
    "desired_titles": ["Senior Backend Engineer"],
    "summary": "Experienced backend engineer with 8+ years...",
    "skills": [
      {
        "name": "Go",
        "level": 5,
        "type": "programming_language"
      }
    ],
    "experience": [
      {
        "employer": "TechCorp Inc",
        "title": "Senior Software Engineer",
        "start": "2022-03",
        "end": "present",
        "description": "Led development of order processing platform..."
      }
    ],
    "location_preference": {
      "type": "remote",
      "preferred_locations": ["San Francisco Bay Area"]
    },
    "schedule": "full_time",
    "availability": "2 weeks notice",
    "links": [
      {
        "label": "LinkedIn",
        "url": "https://linkedin.com/in/johnsmith"
      }
    ]
  },
  "processing_time_ms": 1250,
  "metadata": {
    "worker_version": "1.0.0",
    "ai_model_used": "@cf/meta/llama-2-7b-chat-int8",
    "timestamp": "2024-10-03T17:49:18.790Z"
  }
}
```

## Supported Languages

- **English** (en) - Default, full support
- **Russian** (ru) - Full support, tested with 89% field coverage
- **German** (de) - Basic support
- **Other languages** - Experimental support

## File Limits

- **Text resumes**: 50KB request size limit
- **PDF files**: No specific limit (processed via PDF.co API)
- **Processing time**: 2-5 seconds (text), 20-30 seconds (PDF)

## Error Handling

| Status | Description          | Solution                               |
| ------ | -------------------- | -------------------------------------- |
| 200    | Success              | ✅ Data processed successfully         |
| 400    | Bad Request          | Check input format and required fields |
| 413    | Payload Too Large    | Reduce text size or use PDF endpoint   |
| 422    | AI Processing Failed | Try with different resume format       |
| 500    | Server Error         | Retry request or contact support       |

## Integration Examples

### JavaScript

```javascript
// Text processing
async function processResume(resumeText) {
  const response = await fetch(
    'https://resume-processor-worker.dev-a96.workers.dev/process-resume',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resume_text: resumeText,
        language: 'en',
      }),
    }
  );
  return await response.json();
}

// PDF processing
async function processResumePDF(pdfFile) {
  const formData = new FormData();
  formData.append('pdf', pdfFile);
  formData.append('language', 'en');

  const response = await fetch(
    'https://resume-processor-worker.dev-a96.workers.dev/process-resume-pdf',
    {
      method: 'POST',
      body: formData,
    }
  );
  return await response.json();
}
```

### Python

```python
import requests

# Text processing
def process_resume(resume_text):
    response = requests.post(
        'https://resume-processor-worker.dev-a96.workers.dev/process-resume',
        json={'resume_text': resume_text, 'language': 'en'}
    )
    return response.json()

# PDF processing
def process_resume_pdf(pdf_file_path):
    with open(pdf_file_path, 'rb') as pdf_file:
        files = {'pdf': pdf_file}
        data = {'language': 'en'}
        response = requests.post(
            'https://resume-processor-worker.dev-a96.workers.dev/process-resume-pdf',
            files=files, data=data
        )
    return response.json()
```

## Test Data

### Sample Text Resume

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

## Performance Metrics

- **Success Rate**: >95% for valid input
- **Field Coverage**: 85-95% for well-formatted resumes
- **Text Processing**: 2-5 seconds
- **PDF Processing**: 20-30 seconds (includes text extraction)
- **Rate Limit**: 100 requests per minute per client

## Support

For technical support or questions:

- Check the full [API Documentation](./API_DOCUMENTATION.md)
- Test with the health endpoint: `/health`
- Verify your input format matches the examples above

---

**Ready to get started?** Try the health check endpoint first, then process your first resume! 🚀
