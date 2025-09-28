# 🔗 API Request Format Guide for External Services

This guide provides comprehensive documentation for external services to integrate with the Resume Processor API.

## 📋 Quick Reference

**Base URL:** `https://resume-processor-worker.dev-a96.workers.dev`  
**Authentication:** None required  
**Content-Type:** `application/json`  
**Rate Limit:** 100 requests per minute per client

## 🆕 What's New in v2.0

### Enhanced Error Handling

- **Partial Results**: Get partial data instead of complete failures when some fields are missing
- **Specific Validation Errors**: Detailed field-level errors with actionable suggestions
- **Flexible Validation**: Configurable validation that allows partial success

### New Endpoints

- **Streaming Processing**: `/process-resume-stream` for long-running operations
- **Batch Processing**: `/process-resume-batch` for processing multiple resumes
- **Enhanced Main Endpoint**: Improved `/process-resume` with new options

### Advanced Features

- **Format Detection**: Automatic detection of resume format (chronological, functional, hybrid)
- **Fallback Extraction**: Alternative patterns when primary extraction fails
- **Enhanced Russian Support**: Better Russian language processing with skill level mapping
- **Progress Tracking**: Real-time progress updates for long operations

---

## 🚀 API Endpoints

### 1. Process Resume

**POST** `/process-resume`

Converts unstructured resume text into structured JSON format with enhanced error handling and partial results support.

### 2. Process Resume Stream

**POST** `/process-resume-stream`

Processes resume with streaming response format for long-running operations.

### 3. Process Resume Batch

**POST** `/process-resume-batch`

Processes multiple resumes in a single request with configurable concurrency.

### 4. Health Check

**GET** `/health`

Check API status and availability.

---

## 📝 Request Format

### Process Resume Request

```json
{
  "resume_text": "string (required, min 50 chars)",
  "language": "string (optional, ISO 639-1 code)",
  "options": {
    "include_unmapped": "boolean (optional, default: true)",
    "strict_validation": "boolean (optional, default: false)",
    "flexible_validation": "boolean (optional, default: true)",
    "callback_url": "string (optional, for progress callbacks)",
    "callback_secret": "string (optional, for callback authentication)"
  }
}
```

#### Required Fields

- **`resume_text`** (string, required)
  - Minimum length: 50 characters
  - The raw resume text to be processed
  - Can be plain text, formatted text, or extracted from PDFs

#### Optional Fields

- **`language`** (string, optional)
  - ISO 639-1 language code (e.g., 'en', 'ru', 'de', 'fr', 'es')
  - Default: 'en' (English)
  - Supported languages: English, Russian, German, French, Spanish, and more

- **`options.include_unmapped`** (boolean, optional)
  - Default: `true`
  - When `true`, returns fields that couldn't be mapped to the schema
  - Useful for debugging and understanding what data was found

- **`options.strict_validation`** (boolean, optional)
  - Default: `false`
  - When `true`, returns errors for validation failures
  - When `false`, returns warnings but still processes the resume

- **`options.flexible_validation`** (boolean, optional)
  - Default: `true`
  - When `true`, returns partial results with missing fields marked as `partial_fields`
  - When `false`, returns `null` data if any required fields are missing
  - Enables fallback extraction patterns for incomplete resumes

- **`options.callback_url`** (string, optional)
  - URL to receive progress updates during processing
  - Must be HTTPS endpoint that accepts POST requests
  - Used for long-running operations

- **`options.callback_secret`** (string, optional)
  - Secret token for authenticating callback requests
  - Included in callback request headers as `X-Callback-Secret`

---

## 📤 Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    "version": "1.1",
    "desired_titles": ["Senior Backend Engineer", "Data Engineer"],
    "summary": "Experienced backend engineer with 8+ years...",
    "skills": [
      {
        "name": "Go",
        "level": 5,
        "label": "expert",
        "type": "programming_language",
        "notes": "4+ years production experience"
      },
      {
        "name": "Python",
        "level": 4,
        "label": "advanced",
        "type": "programming_language"
      },
      "Docker" // Backward compatibility: plain string skills
    ],
    "experience": [
      {
        "employer": "TechCorp Inc",
        "title": "Senior Software Engineer",
        "start": "2022-03",
        "end": "present",
        "description": "Led development of order processing platform...",
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
      "min": 150000,
      "max": 180000,
      "periodicity": "year"
    },
    "availability": "2 weeks notice",
    "links": [
      {
        "label": "LinkedIn",
        "url": "https://linkedin.com/in/johnsmith"
      },
      {
        "label": "GitHub",
        "url": "https://github.com/johnsmith"
      }
    ]
  },
  "unmapped_fields": ["CERTIFICATIONS", "EDUCATION"],
  "errors": [],
  "processing_time_ms": 1250,
  "validation_errors": [
    {
      "field": "skills",
      "error": "missing",
      "suggestion": "Add a 'Skills' section listing your technical and soft skills",
      "severity": "warning"
    }
  ],
  "partial_fields": ["skills"],
  "metadata": {
    "worker_version": "1.0.0",
    "ai_model_used": "@cf/meta/llama-2-7b-chat-int8",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "format_detected": "chronological",
    "format_confidence": 0.85
  }
}
```

### Error Response

```json
{
  "success": false,
  "data": null,
  "unmapped_fields": [],
  "errors": ["Resume text must be at least 50 characters"],
  "processing_time_ms": 45,
  "metadata": {
    "worker_version": "1.0.0",
    "ai_model_used": "@cf/meta/llama-2-7b-chat-int8",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## 📡 Streaming Endpoint

### Process Resume Stream Request

```json
{
  "resume_text": "string (required, min 50 chars)",
  "language": "string (optional, ISO 639-1 code)",
  "stream_id": "string (optional, will be generated if not provided)",
  "options": {
    "flexible_validation": "boolean (optional, default: true)",
    "strict_validation": "boolean (optional, default: false)",
    "callback_url": "string (optional)",
    "callback_secret": "string (optional)"
  }
}
```

### Process Resume Stream Response

```json
{
  "stream_id": "stream_1642248600000_abc123def",
  "status": "completed",
  "progress_percentage": 100,
  "current_step": "completed",
  "estimated_completion_time": 1500,
  "result": {
    "success": true,
    "data": {
      /* ResumeData object */
    },
    "unmapped_fields": ["education"],
    "errors": [],
    "validation_errors": [],
    "partial_fields": [],
    "processing_time_ms": 1200,
    "metadata": {
      "worker_version": "1.0.0",
      "ai_model_used": "@cf/meta/llama-2-7b-chat-int8",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "format_detected": "chronological",
      "format_confidence": 0.9
    }
  }
}
```

## 📦 Batch Processing Endpoint

### Process Resume Batch Request

```json
{
  "resumes": [
    {
      "id": "resume_1",
      "resume_text": "string (required, min 50 chars)",
      "language": "string (optional)",
      "options": {
        "flexible_validation": "boolean (optional, default: true)",
        "strict_validation": "boolean (optional, default: false)"
      }
    },
    {
      "id": "resume_2",
      "resume_text": "string (required, min 50 chars)",
      "language": "ru"
    }
  ],
  "options": {
    "max_concurrency": "number (optional, default: 5, max: 10)",
    "callback_url": "string (optional)",
    "callback_secret": "string (optional)"
  }
}
```

### Process Resume Batch Response

```json
{
  "batch_id": "batch_1642248600000_xyz789abc",
  "status": "completed",
  "total_resumes": 2,
  "completed_count": 2,
  "failed_count": 0,
  "estimated_completion_time": 3500,
  "results": [
    {
      "id": "resume_1",
      "status": "completed",
      "result": {
        "success": true,
        "data": {
          /* ResumeData object */
        },
        "unmapped_fields": [],
        "errors": [],
        "validation_errors": [],
        "partial_fields": [],
        "processing_time_ms": 0,
        "metadata": {
          /* metadata object */
        }
      }
    },
    {
      "id": "resume_2",
      "status": "completed",
      "result": {
        /* ResumeData object */
      }
    }
  ]
}
```

---

## 🎯 Key Use Cases & Examples

### 1. Processing Partial/Incomplete Resumes

**Use Case**: You have a resume that's missing some sections but want to extract what's available.

```bash
curl -X POST "https://resume-processor-worker.dev-a96.workers.dev/process-resume" \
  -H "Content-Type: application/json" \
  -d '{
    "resume_text": "John Doe\nSoftware Developer\nLooking for: Senior Developer\n\nSkills: Python, JavaScript, React",
    "options": {
      "flexible_validation": true
    }
  }'
```

**Response**: Returns partial data with `partial_fields` indicating missing sections:

```json
{
  "success": true,
  "data": {
    "desired_titles": ["Senior Developer"],
    "skills": ["Python", "JavaScript", "React"],
    "partial_fields": ["summary", "experience"]
  },
  "validation_errors": [
    {
      "field": "experience",
      "error": "missing",
      "suggestion": "Add an 'Experience' section with your previous positions",
      "severity": "warning"
    }
  ]
}
```

### 2. Batch Processing Multiple Resumes

**Use Case**: Process multiple resumes efficiently in a single request.

```bash
curl -X POST "https://resume-processor-worker.dev-a96.workers.dev/process-resume-batch" \
  -H "Content-Type: application/json" \
  -d '{
    "resumes": [
      {
        "id": "resume_1",
        "resume_text": "Full resume text here...",
        "language": "en"
      },
      {
        "id": "resume_2",
        "resume_text": "Полный текст резюме здесь...",
        "language": "ru"
      }
    ],
    "options": {
      "max_concurrency": 5
    }
  }'
```

**Response**: Batch processing results with individual resume statuses:

```json
{
  "batch_id": "batch_1642248600000_xyz789",
  "status": "completed",
  "total_resumes": 2,
  "completed_count": 2,
  "failed_count": 0,
  "results": [
    {
      "id": "resume_1",
      "status": "completed",
      "result": {
        /* processed resume data */
      }
    }
  ]
}
```

### 3. Russian Resume Processing

**Use Case**: Process Russian resumes with enhanced language support.

```bash
curl -X POST "https://resume-processor-worker.dev-a96.workers.dev/process-resume" \
  -H "Content-Type: application/json" \
  -d '{
    "resume_text": "Иван Петров\nПрограммист\nНавыки: Python (эксперт), Java (продвинутый)",
    "language": "ru",
    "options": {
      "flexible_validation": true
    }
  }'
```

**Response**: Enhanced Russian processing with skill level detection:

```json
{
  "data": {
    "skills": [
      {
        "name": "Python",
        "level": 5,
        "type": "programming_language"
      },
      {
        "name": "Java",
        "level": 4,
        "type": "programming_language"
      }
    ]
  },
  "metadata": {
    "format_detected": "chronological",
    "format_confidence": 0.9
  }
}
```

### 4. Streaming for Long Operations

**Use Case**: Get progress updates for long-running resume processing.

```bash
curl -X POST "https://resume-processor-worker.dev-a96.workers.dev/process-resume-stream" \
  -H "Content-Type: application/json" \
  -d '{
    "resume_text": "Very long resume text...",
    "options": {
      "callback_url": "https://your-app.com/callback",
      "callback_secret": "your-secret-token"
    }
  }'
```

**Response**: Streaming response with progress tracking:

```json
{
  "stream_id": "stream_1642248600000_abc123",
  "status": "completed",
  "progress_percentage": 100,
  "current_step": "completed",
  "result": {
    /* final processed data */
  }
}
```

---

## 📋 Migration Guide for Existing Users

### What Changed in v2.0

#### 1. Enhanced Response Format

**Before (v1.0):**

```json
{
  "success": true,
  "data": {
    /* resume data or null */
  },
  "errors": ["generic error messages"],
  "unmapped_fields": ["field1", "field2"]
}
```

**After (v2.0):**

```json
{
  "success": true,
  "data": {
    /* resume data with partial_fields */
  },
  "validation_errors": [
    {
      "field": "experience",
      "error": "missing",
      "suggestion": "Add an 'Experience' section...",
      "severity": "warning"
    }
  ],
  "partial_fields": ["experience"],
  "metadata": {
    "format_detected": "chronological",
    "format_confidence": 0.9
  }
}
```

#### 2. New Request Options

```json
{
  "resume_text": "...",
  "options": {
    "flexible_validation": true, // NEW: Enable partial results
    "callback_url": "...", // NEW: Progress callbacks
    "callback_secret": "..." // NEW: Callback authentication
  }
}
```

#### 3. Backward Compatibility

- ✅ **Existing API calls continue to work unchanged**
- ✅ **Default behavior**: `flexible_validation: true` (enables partial results)
- ✅ **Legacy response fields**: Still included for compatibility

### Migration Steps

#### For Existing Integrations

1. **No immediate changes required** - existing code continues to work
2. **Optional**: Add `flexible_validation: true` to get partial results
3. **Optional**: Handle new `validation_errors` and `partial_fields` in responses

#### For New Integrations

1. **Use new endpoints**: `/process-resume-stream` and `/process-resume-batch`
2. **Enable flexible validation**: Set `flexible_validation: true`
3. **Handle enhanced responses**: Process `validation_errors` and `partial_fields`

---

## 🔧 Integration Examples

### JavaScript/Node.js

#### Basic Resume Processing with Enhanced Features

```javascript
async function processResume(resumeText, language = 'en', options = {}) {
  const response = await fetch(
    'https://resume-processor-worker.dev-a96.workers.dev/process-resume',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resume_text: resumeText,
        language: language,
        options: {
          flexible_validation: true, // Enable partial results
          strict_validation: false,
          include_unmapped: true,
          ...options,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

// Example usage with partial resume
try {
  const result = await processResume(
    'JOHN SMITH\nSoftware Engineer\nLooking for: Senior Developer\n\nSkills: Python, JavaScript, React',
    'en',
    { flexible_validation: true }
  );

  if (result.success) {
    console.log('Extracted data:', result.data);
    console.log('Partial fields:', result.partial_fields);
    console.log('Validation errors:', result.validation_errors);
    console.log('Format detected:', result.metadata?.format_detected);
  } else {
    console.error('Processing failed:', result.errors);
  }
} catch (error) {
  console.error('Request failed:', error.message);
}
```

#### Batch Processing

```javascript
async function processBatchResumes(resumes) {
  const response = await fetch(
    'https://resume-processor-worker.dev-a96.workers.dev/process-resume-batch',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resumes: resumes,
        options: {
          max_concurrency: 5,
        },
      }),
    }
  );

  return await response.json();
}

// Example batch processing
const batchResult = await processBatchResumes([
  {
    id: 'resume_1',
    resume_text: 'Full resume text...',
    language: 'en',
  },
  {
    id: 'resume_2',
    resume_text: 'Полный текст резюме...',
    language: 'ru',
  },
]);

console.log('Batch ID:', batchResult.batch_id);
console.log('Completed:', batchResult.completed_count);
console.log('Results:', batchResult.results);
```

#### Streaming Processing

```javascript
async function processResumeStream(resumeText, callbackUrl = null) {
  const response = await fetch(
    'https://resume-processor-worker.dev-a96.workers.dev/process-resume-stream',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resume_text: resumeText,
        options: {
          flexible_validation: true,
          callback_url: callbackUrl,
          callback_secret: 'your-secret-token',
        },
      }),
    }
  );

  return await response.json();
}

// Example streaming processing
const streamResult = await processResumeStream('Very long resume text...');
console.log('Stream ID:', streamResult.stream_id);
console.log('Progress:', streamResult.progress_percentage + '%');
console.log('Status:', streamResult.status);
```

### Python

#### Basic Resume Processing with Enhanced Features

```python
import requests
import json

def process_resume(resume_text, language='en', options=None):
    """
    Process resume text and return structured data with enhanced features

    Args:
        resume_text (str): The resume text to process
        language (str): Language code (default: 'en')
        options (dict): Processing options

    Returns:
        dict: API response with structured resume data
    """
    if options is None:
        options = {}

    url = 'https://resume-processor-worker.dev-a96.workers.dev/process-resume'

    payload = {
        'resume_text': resume_text,
        'language': language,
        'options': {
            'flexible_validation': True,  # Enable partial results
            'strict_validation': False,
            'include_unmapped': True,
            **options
        }
    }

    try:
        response = requests.post(
            url,
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        return {
            'success': False,
            'errors': [f'Request failed: {str(e)}'],
            'data': None
        }

# Example usage with partial resume
result = process_resume(
    'JOHN SMITH\nSoftware Engineer\nLooking for: Senior Developer\n\nSkills: Python, JavaScript, React',
    language='en',
    options={'flexible_validation': True}
)

if result['success']:
    print('Extracted data:', result['data'])
    print('Partial fields:', result.get('partial_fields', []))
    print('Validation errors:', result.get('validation_errors', []))
    print('Format detected:', result.get('metadata', {}).get('format_detected'))
else:
    print('Processing failed:', result['errors'])
```

#### Batch Processing

```python
def process_batch_resumes(resumes, max_concurrency=5):
    """
    Process multiple resumes in a single request

    Args:
        resumes (list): List of resume objects with id, resume_text, language
        max_concurrency (int): Maximum concurrent processing (default: 5)

    Returns:
        dict: Batch processing results
    """
    url = 'https://resume-processor-worker.dev-a96.workers.dev/process-resume-batch'

    payload = {
        'resumes': resumes,
        'options': {
            'max_concurrency': max_concurrency
        }
    }

    try:
        response = requests.post(
            url,
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=60
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        return {
            'success': False,
            'errors': [f'Request failed: {str(e)}']
        }

# Example batch processing
batch_result = process_batch_resumes([
    {
        'id': 'resume_1',
        'resume_text': 'Full resume text...',
        'language': 'en'
    },
    {
        'id': 'resume_2',
        'resume_text': 'Полный текст резюме...',
        'language': 'ru'
    }
])

print('Batch ID:', batch_result['batch_id'])
print('Completed:', batch_result['completed_count'])
print('Results:', batch_result['results'])
```

#### Streaming Processing

```python
def process_resume_stream(resume_text, callback_url=None):
    """
    Process resume with streaming response

    Args:
        resume_text (str): The resume text to process
        callback_url (str): Optional callback URL for progress updates

    Returns:
        dict: Streaming response with progress tracking
    """
    url = 'https://resume-processor-worker.dev-a96.workers.dev/process-resume-stream'

    payload = {
        'resume_text': resume_text,
        'options': {
            'flexible_validation': True,
            'callback_url': callback_url,
            'callback_secret': 'your-secret-token'
        }
    }

    try:
        response = requests.post(
            url,
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=60
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        return {
            'success': False,
            'errors': [f'Request failed: {str(e)}']
        }

# Example streaming processing
stream_result = process_resume_stream('Very long resume text...')
print('Stream ID:', stream_result['stream_id'])
print('Progress:', stream_result['progress_percentage'], '%')
print('Status:', stream_result['status'])

# Usage
result = process_resume(
    "JOHN SMITH\nSenior Backend Engineer\n\nPROFESSIONAL SUMMARY:\nExperienced backend engineer...",
    language='en',
    options={'include_unmapped': True}
)

if result['success']:
    print("Extracted data:", result['data'])
    print("Unmapped fields:", result['unmapped_fields'])
else:
    print("Processing failed:", result['errors'])
```

### PHP

```php
<?php
function processResume($resumeText, $language = 'en', $options = []) {
    $url = 'https://resume-processor-worker.dev-a96.workers.dev/process-resume';

    $payload = [
        'resume_text' => $resumeText,
        'language' => $language,
        'options' => array_merge([
            'include_unmapped' => true,
            'strict_validation' => false
        ], $options)
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        return [
            'success' => false,
            'errors' => ["HTTP error: $httpCode"],
            'data' => null
        ];
    }

    return json_decode($response, true);
}

// Usage
$result = processResume(
    "JOHN SMITH\nSenior Backend Engineer\n\nPROFESSIONAL SUMMARY:\nExperienced backend engineer...",
    'en',
    ['include_unmapped' => true]
);

if ($result['success']) {
    echo "Extracted data: " . json_encode($result['data'], JSON_PRETTY_PRINT);
    echo "Unmapped fields: " . json_encode($result['unmapped_fields']);
} else {
    echo "Processing failed: " . json_encode($result['errors']);
}
?>
```

### cURL

```bash
#!/bin/bash

# Basic request
curl -X POST https://resume-processor-worker.dev-a96.workers.dev/process-resume \
  -H "Content-Type: application/json" \
  -d '{
    "resume_text": "JOHN SMITH\nSenior Backend Engineer\n\nPROFESSIONAL SUMMARY:\nExperienced backend engineer with 8+ years building scalable distributed systems.",
    "language": "en",
    "options": {
      "include_unmapped": true,
      "strict_validation": false
    }
  }'

# With file input
curl -X POST https://resume-processor-worker.dev-a96.workers.dev/process-resume \
  -H "Content-Type: application/json" \
  -d "{
    \"resume_text\": \"$(cat resume.txt | sed 's/"/\\"/g')\",
    \"language\": \"en\",
    \"options\": {
      \"include_unmapped\": true
    }
  }"
```

### TypeScript/Cloudflare Workers

```typescript
// Types for the API
interface ProcessResumeRequest {
  resume_text: string;
  language?: string;
  options?: {
    include_unmapped?: boolean;
    strict_validation?: boolean;
  };
}

interface Skill {
  name: string;
  level: 1 | 2 | 3 | 4 | 5;
  label?: 'basic' | 'limited' | 'proficient' | 'advanced' | 'expert';
  type?:
    | 'programming_language'
    | 'spoken_language'
    | 'framework'
    | 'tool'
    | 'domain'
    | 'methodology'
    | 'soft_skill'
    | 'other';
  notes?: string;
}

interface Experience {
  employer?: string;
  title: string;
  start: string; // YYYY-MM format
  end?: string | 'present' | 'Present' | null;
  description: string;
  location?: string;
}

interface LocationPreference {
  type?: 'remote' | 'hybrid' | 'onsite';
  preferred_locations?: string[];
}

interface SalaryExpectation {
  currency: string;
  min?: number;
  max?: number;
  periodicity: 'year' | 'month' | 'day' | 'hour' | 'project';
  notes?: string;
}

interface Link {
  label: string;
  url: string;
}

interface ResumeData {
  version?: string;
  desired_titles: string[];
  summary: string;
  skills: (Skill | string)[];
  experience: Experience[];
  location_preference?: LocationPreference;
  schedule?:
    | 'full_time'
    | 'part_time'
    | 'contract'
    | 'freelance'
    | 'internship'
    | 'temporary';
  salary_expectation?: SalaryExpectation;
  availability?: string;
  links?: Link[];
}

interface ProcessResumeResponse {
  success: boolean;
  data: ResumeData | null;
  unmapped_fields: string[];
  errors: string[];
  processing_time_ms: number;
  metadata?: {
    worker_version: string;
    ai_model_used: string;
    timestamp: string;
  };
}

// Main function for processing resumes
async function processResume(
  resumeText: string,
  language: string = 'en',
  options: ProcessResumeRequest['options'] = {}
): Promise<ProcessResumeResponse> {
  const url =
    'https://resume-processor-worker.dev-a96.workers.dev/process-resume';

  const requestBody: ProcessResumeRequest = {
    resume_text: resumeText,
    language,
    options: {
      include_unmapped: true,
      strict_validation: false,
      ...options,
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ProcessResumeResponse = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      data: null,
      unmapped_fields: [],
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      processing_time_ms: 0,
    };
  }
}

// Cloudflare Worker example
export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Route handling
    switch (url.pathname) {
      case '/process-resume':
        return await handleProcessResume(request);

      case '/health':
        return new Response(
          JSON.stringify({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'resume-processor-client',
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );

      default:
        return new Response('Not Found', { status: 404 });
    }
  },
};

async function handleProcessResume(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const body = (await request.json()) as ProcessResumeRequest;

    // Validate required fields
    if (!body.resume_text || body.resume_text.trim().length < 50) {
      return new Response(
        JSON.stringify({
          success: false,
          errors: [
            'resume_text is required and must be at least 50 characters',
          ],
          data: null,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Process the resume
    const result = await processResume(
      body.resume_text,
      body.language || 'en',
      body.options
    );

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 422,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        errors: ['Invalid request body'],
        data: null,
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Usage example in a Cloudflare Worker
async function exampleUsage() {
  const result = await processResume(
    `JOHN SMITH
Senior Backend Engineer

PROFESSIONAL SUMMARY:
Experienced backend engineer with 8+ years building scalable distributed systems.

EXPERIENCE:
Senior Software Engineer | TechCorp Inc | March 2022 - Present
- Led development of order processing platform handling 100k+ transactions/day
- Built microservices architecture using Go, Docker, and Kubernetes

SKILLS:
- Go (Expert)
- Python (Advanced)
- Docker (Proficient)`,
    'en',
    { include_unmapped: true }
  );

  if (result.success && result.data) {
    console.log('Extracted titles:', result.data.desired_titles);
    console.log('Skills found:', result.data.skills.length);
    console.log('Experience entries:', result.data.experience.length);
    console.log('Unmapped fields:', result.unmapped_fields);
  } else {
    console.error('Processing failed:', result.errors);
  }
}

// Environment interface for Cloudflare Workers
interface Env {
  // Add your environment variables here
  API_KEY?: string;
  // Add other bindings as needed
}
```

### Go

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "time"
)

type ProcessResumeRequest struct {
    ResumeText string                 `json:"resume_text"`
    Language   string                 `json:"language,omitempty"`
    Options    map[string]interface{} `json:"options,omitempty"`
}

type ProcessResumeResponse struct {
    Success         bool                   `json:"success"`
    Data            map[string]interface{} `json:"data"`
    UnmappedFields  []string               `json:"unmapped_fields"`
    Errors          []string               `json:"errors"`
    ProcessingTime  int                    `json:"processing_time_ms"`
    Metadata        map[string]interface{} `json:"metadata"`
}

func ProcessResume(resumeText, language string, options map[string]interface{}) (*ProcessResumeResponse, error) {
    if options == nil {
        options = make(map[string]interface{})
    }

    // Set defaults
    if _, ok := options["include_unmapped"]; !ok {
        options["include_unmapped"] = true
    }
    if _, ok := options["strict_validation"]; !ok {
        options["strict_validation"] = false
    }

    request := ProcessResumeRequest{
        ResumeText: resumeText,
        Language:   language,
        Options:    options,
    }

    jsonData, err := json.Marshal(request)
    if err != nil {
        return nil, err
    }

    client := &http.Client{Timeout: 30 * time.Second}
    resp, err := client.Post(
        "https://resume-processor-worker.dev-a96.workers.dev/process-resume",
        "application/json",
        bytes.NewBuffer(jsonData),
    )
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return nil, err
    }

    var result ProcessResumeResponse
    err = json.Unmarshal(body, &result)
    if err != nil {
        return nil, err
    }

    return &result, nil
}

func main() {
    result, err := ProcessResume(
        "JOHN SMITH\nSenior Backend Engineer\n\nPROFESSIONAL SUMMARY:\nExperienced backend engineer...",
        "en",
        map[string]interface{}{
            "include_unmapped": true,
        },
    )

    if err != nil {
        fmt.Printf("Error: %v\n", err)
        return
    }

    if result.Success {
        fmt.Printf("Extracted data: %+v\n", result.Data)
        fmt.Printf("Unmapped fields: %+v\n", result.UnmappedFields)
    } else {
        fmt.Printf("Processing failed: %+v\n", result.Errors)
    }
}
```

---

## 📊 Data Structure Reference

### Resume Data Schema

The API returns structured data following this schema:

#### Required Fields

- **`desired_titles`** (array of strings)
  - Target job titles the candidate is seeking
  - Example: `["Senior Backend Engineer", "Data Engineer"]`

- **`summary`** (string)
  - Professional summary or objective
  - Extracted from the resume's summary/objective section

- **`skills`** (array of skill objects or strings)
  - Skills with proficiency levels (1-5 scale)
  - Can be objects with detailed info or simple strings for backward compatibility

- **`experience`** (array of experience objects)
  - Work experience entries with employer, title, dates, and descriptions

#### Optional Fields

- **`location_preference`** (object)
  - Work location preferences (remote, hybrid, onsite)
  - Preferred locations array

- **`schedule`** (string)
  - Work schedule preference (full_time, part_time, contract, etc.)

- **`salary_expectation`** (object)
  - Salary expectations with currency and periodicity

- **`availability`** (string)
  - Availability information (notice period, start date, etc.)

- **`links`** (array of link objects)
  - Professional links (LinkedIn, GitHub, portfolio, etc.)

### Skill Object Structure

```json
{
  "name": "string (required)",
  "level": "integer 1-5 (required)",
  "label": "string (optional: basic, limited, proficient, advanced, expert)",
  "type": "string (optional: programming_language, spoken_language, framework, tool, domain, methodology, soft_skill, other)",
  "notes": "string (optional)"
}
```

**Skill Levels:**

- 1 = Basic
- 2 = Limited
- 3 = Proficient
- 4 = Advanced
- 5 = Expert

### Experience Object Structure

```json
{
  "employer": "string (optional)",
  "title": "string (required)",
  "start": "string (required, YYYY-MM format)",
  "end": "string (optional, YYYY-MM, 'present', or null)",
  "description": "string (required)",
  "location": "string (optional)"
}
```

---

## ⚠️ Error Handling

### HTTP Status Codes

- **200** - Success
- **400** - Bad Request (invalid input, missing required fields)
- **405** - Method Not Allowed (only POST is accepted)
- **413** - Payload Too Large (request body exceeds 50KB)
- **422** - AI Processing Failed (AI couldn't process the resume)
- **429** - Rate Limit Exceeded (too many requests)
- **500** - Internal Server Error

### Common Error Scenarios

1. **Missing resume_text**

   ```json
   {
     "success": false,
     "errors": ["resume_text is required and must be a string"],
     "data": null
   }
   ```

2. **Resume text too short**

   ```json
   {
     "success": false,
     "errors": ["resume_text must be at least 50 characters"],
     "data": null
   }
   ```

3. **Invalid JSON**

   ```json
   {
     "success": false,
     "errors": ["Invalid JSON"],
     "data": null
   }
   ```

4. **Rate limit exceeded**
   ```json
   {
     "success": false,
     "errors": ["Too many requests"],
     "data": null
   }
   ```

### Error Response Structure

```json
{
  "success": false,
  "data": null,
  "unmapped_fields": [],
  "errors": ["Error message 1", "Error message 2"],
  "processing_time_ms": 45,
  "metadata": {
    "worker_version": "1.0.0",
    "ai_model_used": "@cf/meta/llama-2-7b-chat-int8",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## 🔄 Rate Limiting

- **Limit:** 100 requests per minute per client
- **Identification:** Based on Cloudflare Ray ID or IP address
- **Response:** 429 status code when limit exceeded
- **Headers:** No rate limit headers provided (check response status)

---

## 🧪 Testing

### Test Resume Text

Use this sample resume for testing:

```
JOHN SMITH
Senior Backend Engineer
john.smith@email.com | (555) 123-4567 | San Francisco, CA
LinkedIn: linkedin.com/in/johnsmith | GitHub: github.com/johnsmith

PROFESSIONAL SUMMARY:
Experienced backend engineer with 8+ years building scalable distributed systems.
Expert in Go, Python, and cloud technologies. Led teams of 5+ engineers and
delivered high-traffic applications serving millions of users.

EXPERIENCE:
Senior Software Engineer | TechCorp Inc | March 2022 - Present
- Led development of order processing platform handling 100k+ transactions/day
- Built microservices architecture using Go, Docker, and Kubernetes
- Improved system performance by 40% through optimization and caching
- Mentored 3 junior engineers and established code review processes

Software Engineer | StartupXYZ | January 2019 - February 2022
- Developed REST APIs and gRPC services using Python and FastAPI
- Implemented CI/CD pipelines reducing deployment time by 60%
- Worked with PostgreSQL, Redis, and message queues
- Collaborated with frontend team on API design and documentation

SKILLS:
Programming Languages: Go (Expert), Python (Expert), SQL (Advanced), JavaScript (Proficient)
Frameworks: Django, Flask, Gin, Echo, FastAPI
Databases: PostgreSQL (Expert), MySQL (Advanced), Redis (Advanced), MongoDB (Proficient)
Cloud & DevOps: AWS (Advanced), Docker (Expert), Kubernetes (Advanced), Terraform (Proficient)
Tools: Git, Jenkins, GitHub Actions, Prometheus, Grafana

EDUCATION:
Bachelor of Science in Computer Science
University of California, Berkeley | 2014-2018

LOOKING FOR:
Senior Backend Engineer positions
Available for remote work or San Francisco Bay Area
Salary expectation: $150,000 - $180,000 USD per year
Available to start in 2 weeks
```

### Health Check

```bash
curl https://resume-processor-worker.dev-a96.workers.dev/health
```

Expected response:

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

## 📚 Additional Resources

- **Schema Definition:** See `resume_data_contract/resume_data_schema.json`
- **Example Data:** See `resume_data_contract/resume_data_value_example.json`
- **API Documentation:** See `API_DOCUMENTATION.md`
- **Russian Examples:** See `RUSSIAN_RESUME_EXAMPLES.md`

---

## 🆘 Support

For issues or questions:

1. Check the health endpoint first: `GET /health`
2. Verify your request format matches the examples above
3. Ensure resume text is at least 50 characters
4. Check rate limiting (max 100 requests/minute)

---

_Last updated: January 2024_
