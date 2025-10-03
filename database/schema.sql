-- Resume Processor Database Schema
-- For Cloudflare D1 (SQLite)

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
  input_type TEXT NOT NULL, -- 'text' or 'pdf'
  input_size_bytes INTEGER NOT NULL,
  input_language TEXT NOT NULL,
  input_preview TEXT, -- First 200 chars, sanitized
  
  -- Processing results
  success BOOLEAN NOT NULL,
  processing_time_ms INTEGER NOT NULL,
  ai_model_used TEXT NOT NULL,
  
  -- Response data
  extracted_fields_count INTEGER DEFAULT 0,
  validation_errors_count INTEGER DEFAULT 0,
  partial_fields_count INTEGER DEFAULT 0,
  
  -- PDF-specific (for future)
  pdf_pages INTEGER,
  pdf_size_kb INTEGER,
  
  -- Privacy/compliance
  data_retained BOOLEAN DEFAULT 1,
  retention_expires DATETIME
);

-- Create index for faster queries
CREATE INDEX idx_request_logs_timestamp ON request_logs(timestamp);
CREATE INDEX idx_request_logs_endpoint ON request_logs(endpoint);
CREATE INDEX idx_request_logs_success ON request_logs(success);
CREATE INDEX idx_request_logs_input_type ON request_logs(input_type);

-- Performance analytics table (aggregated by hour)
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
  
  -- Unique constraint to prevent duplicates
  UNIQUE(date, hour)
);

-- Create index for analytics queries
CREATE INDEX idx_processing_stats_date ON processing_stats(date);

-- Error tracking table
CREATE TABLE error_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  error_code TEXT NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  endpoint TEXT NOT NULL,
  
  FOREIGN KEY (request_id) REFERENCES request_logs(request_id)
);

-- Create index for error analysis
CREATE INDEX idx_error_logs_timestamp ON error_logs(timestamp);
CREATE INDEX idx_error_logs_error_code ON error_logs(error_code);
CREATE INDEX idx_error_logs_endpoint ON error_logs(endpoint);

