# Database Logging Architecture Plan

## Current Status: Console Logging Only

- ✅ Structured logging with `logEvent()`
- ✅ Sanitized data (emails/phones removed)
- ❌ No persistent storage
- ❌ No request/response logging to database

## Recommended Implementation: Cloudflare D1

### Phase 1: Database Setup

1. **Add D1 Binding to wrangler.toml**:

```toml
[[d1_databases]]
binding = "RESUME_DB"
database_name = "resume-processor-logs"
database_id = "your-database-id"
```

2. **Database Schema**:

```sql
-- Request/Response logging table
CREATE TABLE request_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT UNIQUE NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- Request metadata
  method TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  cf_country TEXT,
  cf_ray TEXT,
  user_agent TEXT,

  -- Request data (sanitized)
  input_type TEXT, -- 'text' or 'pdf'
  input_size_bytes INTEGER,
  input_language TEXT,
  input_preview TEXT, -- First 200 chars, sanitized

  -- Processing results
  success BOOLEAN,
  processing_time_ms INTEGER,
  ai_model_used TEXT,

  -- Response data
  extracted_fields_count INTEGER,
  validation_errors_count INTEGER,
  partial_fields_count INTEGER,

  -- PDF-specific (for future)
  pdf_pages INTEGER,
  pdf_size_kb INTEGER,

  -- Privacy/compliance
  data_retained BOOLEAN DEFAULT 1,
  retention_expires DATETIME
);

-- Performance analytics table
CREATE TABLE processing_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL,
  hour INTEGER NOT NULL,

  -- Aggregated metrics
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  avg_processing_time_ms REAL,

  -- Input type breakdown
  text_requests INTEGER DEFAULT 0,
  pdf_requests INTEGER DEFAULT 0,

  -- Language breakdown
  english_requests INTEGER DEFAULT 0,
  russian_requests INTEGER DEFAULT 0,
  other_language_requests INTEGER DEFAULT 0,

  UNIQUE(date, hour)
);

-- Error tracking table
CREATE TABLE error_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  error_code TEXT,
  error_message TEXT,
  stack_trace TEXT,
  endpoint TEXT,

  FOREIGN KEY (request_id) REFERENCES request_logs(request_id)
);
```

### Phase 2: Logging Service Implementation

3. **Create Database Logger** (`src/database-logger.ts`):

```typescript
export interface LoggingService {
  logRequest(requestData: RequestLogData): Promise<void>;
  logResponse(requestId: string, responseData: ResponseLogData): Promise<void>;
  logError(requestId: string, error: ErrorLogData): Promise<void>;
  updateStats(date: string, hour: number, metrics: StatsUpdate): Promise<void>;
}

export interface RequestLogData {
  requestId: string;
  method: string;
  endpoint: string;
  cfCountry?: string;
  cfRay?: string;
  userAgent?: string;
  inputType: 'text' | 'pdf';
  inputSizeBytes: number;
  inputLanguage: string;
  inputPreview: string; // Sanitized
}

export interface ResponseLogData {
  success: boolean;
  processingTimeMs: number;
  aiModelUsed: string;
  extractedFieldsCount: number;
  validationErrorsCount: number;
  partialFieldsCount: number;
  pdfPages?: number;
  pdfSizeKb?: number;
}
```

### Phase 3: Privacy & Compliance Considerations

4. **Data Retention Policy**:

```typescript
// Automatic cleanup after 90 days
const RETENTION_DAYS = 90;

// Scheduled cleanup job
export async function cleanupOldLogs(env: Env): Promise<void> {
  await env.RESUME_DB.prepare(
    `
    DELETE FROM request_logs 
    WHERE timestamp < datetime('now', '-${RETENTION_DAYS} days')
  `
  ).run();
}
```

5. **Sensitive Data Handling**:

```typescript
// Enhanced sanitization for database storage
export function sanitizeForDatabase(text: string): string {
  return text
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]')
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
    .replace(/\b\d{3}-\d{3}-\d{4}\b/g, '[PHONE]')
    .replace(/\b\d{16}\b/g, '[CARD]')
    .substring(0, 200); // Max 200 chars for preview
}
```

## Benefits of Database Logging

### Analytics & Insights:

- **Usage Patterns**: Peak hours, geographic distribution
- **Performance Monitoring**: Processing time trends
- **Success Rates**: By input type, language, time period
- **Error Analysis**: Common failure patterns
- **PDF vs Text Comparison**: Effectiveness metrics

### Business Intelligence:

- **Popular Skills**: Most extracted skills/technologies
- **Resume Formats**: Which formats work best
- **Language Support**: Usage by language
- **API Performance**: SLA monitoring

### Compliance & Privacy:

- **Audit Trail**: Complete request/response history
- **Data Retention**: Automatic cleanup
- **Privacy Protection**: Sensitive data sanitization
- **GDPR Compliance**: Right to deletion support

## Implementation Priority

### Phase 1 (High Priority):

- [ ] Set up D1 database and schema
- [ ] Basic request/response logging
- [ ] Error tracking

### Phase 2 (Medium Priority):

- [ ] Performance analytics
- [ ] Automated cleanup
- [ ] Dashboard/reporting

### Phase 3 (Future):

- [ ] Real-time monitoring
- [ ] Advanced analytics
- [ ] API usage billing/quotas
