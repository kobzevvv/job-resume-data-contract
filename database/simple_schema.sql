-- Simple logging table - just timestamp and JSON payload
CREATE TABLE IF NOT EXISTS request_logs_simple (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  payload TEXT NOT NULL, -- JSON string
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_request_logs_simple_timestamp ON request_logs_simple(timestamp);
CREATE INDEX IF NOT EXISTS idx_request_logs_simple_endpoint ON request_logs_simple(endpoint);
CREATE INDEX IF NOT EXISTS idx_request_logs_simple_request_id ON request_logs_simple(request_id);
