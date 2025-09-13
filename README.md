# 🚀 Resume Processor Worker

A high-performance Cloudflare Worker that converts text resumes into structured JSON using AI. Built following Cloudflare Workers best practices for reliability, performance, and maintainability.

## ✨ Features

- **AI-Powered Extraction**: Uses Cloudflare AI to intelligently parse resume text
- **Schema Validation**: Strict validation against predefined JSON contract
- **Unmapped Field Detection**: Identifies resume sections that couldn't be processed
- **Rate Limiting**: Built-in request throttling to prevent abuse
- **Comprehensive Logging**: Structured logging for monitoring and debugging
- **Health Monitoring**: Status endpoints for system health checks
- **CORS Support**: Ready for cross-origin requests
- **Type Safety**: Full TypeScript implementation with strict typing

## 📚 API Documentation

For external developers integrating with this API, see the comprehensive [API Documentation](API_DOCUMENTATION.md) which includes:

- Complete request/response examples
- Code samples in JavaScript, Python, and cURL
- Data structure specifications
- Error handling guidelines
- Rate limiting information

## 📋 API Endpoints

### `POST /process-resume`

Converts text resume to structured JSON format.

**Request:**

```json
{
  "resume_text": "string (required, min 50 characters)",
  "options": {
    "include_unmapped": "boolean (default: true)",
    "strict_validation": "boolean (default: false)"
  }
}
```

---

**Response:**

```json
{
  "success": "boolean",
  "data": "ResumeData | null",
  "unmapped_fields": "string[]",
  "errors": "string[]",
  "processing_time_ms": "number",
  "metadata": {
    "worker_version": "string",
    "ai_model_used": "string",
    "timestamp": "string"
  }
}
```

### `GET /health`

Health check endpoint for monitoring.

**Response:**

```json
{
  "status": "healthy | unhealthy",
  "timestamp": "string",
  "version": "string",
  "endpoints": "string[]",
  "ai_status": "available | unavailable"
}
```

## 📊 Resume Data Schema

The worker extracts resume information into the following structure:

### Required Fields

- `desired_titles`: Array of target job titles
- `summary`: Professional summary/objective
- `skills`: Array of skills with proficiency levels
- `experience`: Work experience entries

### Optional Fields

- `location_preference`: Work location preferences
- `schedule`: Employment type (full_time, part_time, etc.)
- `salary_expectation`: Salary requirements with currency
- `availability`: When candidate can start
- `links`: Professional links (LinkedIn, GitHub, etc.)

### Example Resume Data

```json
{
  "version": "1.1",
  "desired_titles": ["Senior Backend Engineer", "Data Platform Engineer"],
  "summary": "Backend/data engineer building resilient, scalable services and pipelines.",
  "skills": [
    {
      "name": "Go",
      "level": 4,
      "label": "advanced",
      "type": "programming_language",
      "notes": "4+ yrs prod"
    },
    {
      "name": "PostgreSQL",
      "level": 4,
      "label": "advanced",
      "type": "tool"
    },
    "Docker"
  ],
  "experience": [
    {
      "employer": "Acme Corp",
      "title": "Senior Software Engineer",
      "start": "2022-03",
      "end": "present",
      "description": "Led event-driven order processing platform (~50k msgs/min).",
      "location": "Hybrid — Amsterdam, NL"
    }
  ],
  "location_preference": {
    "type": "remote",
    "preferred_locations": ["EU (CET±1)", "Amsterdam, NL"]
  },
  "schedule": "full_time",
  "salary_expectation": {
    "currency": "EUR",
    "min": 80000,
    "max": 95000,
    "periodicity": "year"
  },
  "availability": "2 weeks notice",
  "links": [
    { "label": "LinkedIn", "url": "https://www.linkedin.com/in/example" },
    { "label": "GitHub", "url": "https://github.com/example" }
  ]
}
```

## 🛠️ Usage Examples

### Basic Usage

```javascript
const response = await fetch(
  'https://resume-processor-worker.example.workers.dev/process-resume',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      resume_text: `
      John Doe
      Senior Software Engineer
      
      EXPERIENCE:
      - Software Engineer at TechCorp (2020-present)
      - Built scalable microservices using Python and Docker
      - Led team of 5 developers on cloud migration project
      
      SKILLS:
      - Python (5+ years)
      - Docker & Kubernetes
      - AWS Services
      - PostgreSQL
    `,
      options: {
        include_unmapped: true,
        strict_validation: false,
      },
    }),
  }
);

const result = await response.json();
console.log(result.data); // Structured resume JSON
console.log(result.unmapped_fields); // Fields that couldn't be extracted
```

### Error Handling

```javascript
try {
  const response = await fetch('/process-resume', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume_text: resumeText }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error(`API Error (${error.code}): ${error.error}`);
    return;
  }

  const result = await response.json();

  if (!result.success) {
    console.error('Processing failed:', result.errors);
    return;
  }

  // Success - use result.data
  console.log('Extracted resume data:', result.data);
} catch (error) {
  console.error('Network error:', error);
}
```

### Health Check

```javascript
const healthResponse = await fetch('/health');
const health = await healthResponse.json();

if (health.status === 'healthy') {
  console.log('Service is operational');
} else {
  console.warn('Service issues detected');
}
```

## 🚀 Deployment

### Prerequisites

- Node.js 18+
- Cloudflare account with Workers enabled
- Wrangler CLI installed

### Setup

```bash
# Clone and install dependencies
npm install

# Set up Wrangler authentication
wrangler login

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:prod
```

### Environment Configuration

```toml
# wrangler.toml
name = "resume-processor-worker"
main = "src/index.ts"
compatibility_date = "2024-09-01"

[vars]
ENVIRONMENT = "production"

[[ai]]
binding = "AI"
```

## 🔧 Development

### Local Development

```bash
# Start development server
npm run dev

# Test locally
curl -X POST http://localhost:8787/process-resume \
  -H "Content-Type: application/json" \
  -d '{"resume_text": "Your resume text here..."}'

# Health check
curl http://localhost:8787/health
```

### Testing

```bash
# Type checking
npm run type-check

# Run tests (when implemented)
npm test
```

## 📈 Performance & Limits

### Request Limits

- **Max Request Size**: 50KB
- **Rate Limiting**: 100 requests per minute per client
- **Processing Time**: Typically 2-5 seconds
- **AI Timeout**: 30 seconds maximum

### Response Times

- **Health Check**: ~50ms
- **Resume Processing**: 2-5 seconds (depending on resume length)
- **Error Responses**: ~10ms

### Caching

- No caching implemented (each request processes fresh)
- Consider implementing edge caching for repeated requests

## 🔒 Security

### Input Validation

- JSON schema validation
- Request size limits
- Content type enforcement
- Sanitization of logged data

### Rate Limiting

- IP-based request throttling
- Configurable limits per environment
- Automatic cleanup of rate limit data

### Data Privacy

- No resume data is stored permanently
- Sensitive information sanitized in logs
- CORS configured for cross-origin access

## 🐛 Error Codes

| Code                    | Status | Description                       |
| ----------------------- | ------ | --------------------------------- |
| `INVALID_CONTENT_TYPE`  | 400    | Request must be JSON              |
| `INVALID_JSON`          | 400    | Malformed JSON in request         |
| `MISSING_RESUME_TEXT`   | 400    | resume_text field required        |
| `RESUME_TEXT_TOO_SHORT` | 400    | Resume text too short (<50 chars) |
| `PAYLOAD_TOO_LARGE`     | 413    | Request exceeds size limit        |
| `AI_PROCESSING_FAILED`  | 422    | AI couldn't extract data          |
| `RATE_LIMIT_EXCEEDED`   | 429    | Too many requests                 |
| `NOT_FOUND`             | 404    | Endpoint not found                |
| `INTERNAL_ERROR`        | 500    | Server error                      |

## 🎯 Integration Examples

### React/TypeScript

```typescript
interface ProcessResumeResponse {
  success: boolean;
  data: ResumeData | null;
  unmapped_fields: string[];
  errors: string[];
  processing_time_ms: number;
}

async function processResume(
  resumeText: string
): Promise<ProcessResumeResponse> {
  const response = await fetch('/process-resume', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume_text: resumeText }),
  });

  return await response.json();
}
```

### Python

```python
import requests
import json

def process_resume(resume_text: str) -> dict:
    response = requests.post(
        'https://resume-processor-worker.example.workers.dev/process-resume',
        headers={'Content-Type': 'application/json'},
        json={'resume_text': resume_text}
    )
    return response.json()

# Usage
result = process_resume(resume_text)
if result['success']:
    resume_data = result['data']
else:
    print(f"Processing failed: {result['errors']}")
```

### Node.js

```javascript
const axios = require('axios');

async function processResume(resumeText) {
  try {
    const response = await axios.post('/process-resume', {
      resume_text: resumeText,
      options: { include_unmapped: true },
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('API Error:', error.response.data);
    }
    throw error;
  }
}
```

## 📊 Monitoring

### Logs

The worker uses structured JSON logging:

```json
{
  "level": "info",
  "message": "Resume processing completed",
  "timestamp": "2024-09-12T10:30:00.000Z",
  "worker": "resume-processor",
  "success": true,
  "processing_time_ms": 3240,
  "errors_count": 0
}
```

### Metrics to Monitor

- Request volume and response times
- Success/failure rates
- AI processing times
- Rate limit hits
- Error distribution

## 🤝 Contributing

1. Follow TypeScript strict mode
2. Add proper error handling
3. Include structured logging
4. Update tests for new features
5. Follow the established code patterns

## 📝 License

This project is private and proprietary.

---

**Need help?** Check the health endpoint or review the error codes above for troubleshooting.
