#!/usr/bin/env node

/**
 * Quick Database Check
 * Check what's actually stored in the database logs
 */

console.log('🔍 Quick Database Check');
console.log('=======================\n');

console.log('Run these SQL queries to check the database:');
console.log('');
console.log('-- 1. Check recent entries with input preview');
console.log(
  'SELECT request_id, timestamp, json_extract(payload, "$.inputPreview") as input_preview, json_extract(payload, "$.success") as success FROM request_logs_simple WHERE endpoint = "/process-resume" ORDER BY created_at DESC LIMIT 3;'
);
console.log('');
console.log('-- 2. Check if resumeData field exists');
console.log(
  'SELECT request_id, json_extract(payload, "$.resumeData") as resume_data FROM request_logs_simple WHERE endpoint = "/process-resume" ORDER BY created_at DESC LIMIT 1;'
);
console.log('');
console.log('-- 3. Check complete payload structure');
console.log(
  'SELECT request_id, payload FROM request_logs_simple WHERE endpoint = "/process-resume" ORDER BY created_at DESC LIMIT 1;'
);
console.log('');
console.log('Expected Results:');
console.log('----------------');
console.log(
  '✅ input_preview should contain: "SARAH JOHNSON\\nData Platform Engineer\\n\\n📧 sarah.johnson@datamail.com..."'
);
console.log('✅ resume_data should NOT be null');
console.log(
  '✅ payload should contain resumeData field with complete API response'
);
console.log('');
console.log('If resumeData is still null, the issue might be:');
console.log('1. Database insertion error');
console.log('2. Worker console logs not showing debug info');
console.log('3. The response.data is null when logging');
console.log('');
console.log('Check the worker console logs for:');
console.log('- "DEBUG: LogPayload structure"');
console.log('- "Simple logging request to database"');
console.log('- Any error messages');
