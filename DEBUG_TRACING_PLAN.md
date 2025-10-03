# 🔍 Resume Data Transformation Debugging Plan

## Test Resume: senior-backend-engineer.txt

**Key Data Points to Verify:**

- Job Start Dates: March 2022, January 2019, June 2016
- Skills: Go (Expert), Python (Expert), PostgreSQL (Expert)
- Experience: 3 positions with clear dates and descriptions
- Education: UC Berkeley 2012-2016
- Salary: $150,000 - $180,000 USD

## Phase 1: Pre-Test Setup

### 1.1 Database Preparation

- [ ] Verify `request_logs_simple` table exists
- [ ] Check current log entries count
- [ ] Ensure database logging is enabled

### 1.2 Test Environment Setup

- [ ] Verify worker is running
- [ ] Check API endpoint accessibility
- [ ] Prepare test request payload

## Phase 2: Data Transformation Tracing

### 2.1 Input Validation

- [ ] Send test request to `/process-resume`
- [ ] Verify request parsing
- [ ] Check input sanitization

### 2.2 AI Processing

- [ ] Monitor AI model processing
- [ ] Check extracted raw data
- [ ] Verify field mapping

### 2.3 Data Validation

- [ ] Check validation results
- [ ] Verify error handling
- [ ] Confirm data structure

### 2.4 Response Generation

- [ ] Verify API response format
- [ ] Check all required fields
- [ ] Confirm data completeness

## Phase 3: Database Logging Verification

### 3.1 Log Entry Creation

- [ ] Verify log entry is created in `request_logs_simple`
- [ ] Check `payload` column contains JSON
- [ ] Confirm `resumeData` field exists

### 3.2 Data Completeness Check

- [ ] Verify job start dates are preserved
- [ ] Check skills with proficiency levels
- [ ] Confirm experience entries
- [ ] Validate education data
- [ ] Check salary expectations

### 3.3 Data Integrity Verification

- [ ] Compare API response with logged data
- [ ] Verify no data loss during transformation
- [ ] Check field mapping accuracy

## Phase 4: Analysis & Documentation

### 4.1 Data Flow Analysis

- [ ] Document complete transformation pipeline
- [ ] Identify any data loss points
- [ ] Verify logging completeness

### 4.2 Findings Documentation

- [ ] Record all observations
- [ ] Document any issues found
- [ ] Create improvement recommendations

## Expected Results

### API Response Should Contain:

```json
{
  "success": true,
  "data": {
    "desired_titles": [
      "Senior Backend Engineer",
      "Staff Engineer",
      "Technical Lead"
    ],
    "summary": "Experienced backend engineer with 8+ years...",
    "skills": [
      { "name": "Go", "level": 5, "label": "expert" },
      { "name": "Python", "level": 5, "label": "expert" },
      { "name": "PostgreSQL", "level": 5, "label": "expert" }
    ],
    "experience": [
      {
        "employer": "TechCorp Inc",
        "title": "Senior Software Engineer",
        "start": "2022-03",
        "end": "present",
        "description": "Led development of order processing platform..."
      },
      {
        "employer": "StartupXYZ",
        "title": "Software Engineer",
        "start": "2019-01",
        "end": "2022-02",
        "description": "Developed REST APIs serving 50+ million requests..."
      },
      {
        "employer": "DevCompany",
        "title": "Backend Developer",
        "start": "2016-06",
        "end": "2018-12",
        "description": "Built e-commerce backend processing payments..."
      }
    ],
    "education": {
      "degree": "Bachelor of Science in Computer Science",
      "institution": "University of California, Berkeley",
      "start": "2012",
      "end": "2016"
    },
    "salary_expectation": {
      "currency": "USD",
      "min": 150000,
      "max": 180000,
      "periodicity": "year"
    }
  }
}
```

### Database Log Should Contain:

- Complete API response in `payload.resumeData`
- Processing metadata in `payload`
- Request information
- Success status and timing
