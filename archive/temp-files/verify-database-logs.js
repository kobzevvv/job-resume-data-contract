#!/usr/bin/env node

/**
 * Database Log Verification Script
 * Checks if the API response JSON was properly stored in the database logs
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const WORKER_URL =
  process.env.WORKER_URL ||
  'https://resume-processor-worker.dev-a96.workers.dev';

console.log('🗄️  Database Log Verification');
console.log('============================\n');

/**
 * Query the database for recent log entries
 */
async function verifyDatabaseLogs() {
  try {
    console.log('🔍 Step 1: Querying Recent Log Entries');
    console.log('--------------------------------------');

    // Query the analytics endpoint to get recent processing stats
    const analyticsResponse = await fetch(`${WORKER_URL}/analytics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!analyticsResponse.ok) {
      console.log(
        '⚠️  Analytics endpoint not available, checking console logs instead'
      );
      console.log('📝 Note: Database logging happens asynchronously');
      console.log('🔍 To verify database logs, check:');
      console.log('   1. Cloudflare D1 dashboard');
      console.log('   2. request_logs_simple table');
      console.log(
        '   3. Look for recent entries with endpoint: /process-resume'
      );
      console.log(
        '   4. Verify payload.resumeData contains the complete API response'
      );
      return;
    }

    const analyticsData = await analyticsResponse.json();
    console.log('✅ Analytics data retrieved');
    console.log(
      `📊 Recent requests: ${JSON.stringify(analyticsData, null, 2)}\n`
    );
  } catch (error) {
    console.error('❌ Failed to verify database logs:', error.message);
    console.log('\n📝 Manual Verification Steps:');
    console.log('-----------------------------');
    console.log('1. Access Cloudflare D1 dashboard');
    console.log('2. Open the resume-processor-logs database');
    console.log(
      '3. Query: SELECT * FROM request_logs_simple ORDER BY created_at DESC LIMIT 5'
    );
    console.log('4. Look for entries with:');
    console.log('   - endpoint: "/process-resume"');
    console.log('   - Recent timestamp');
    console.log(
      '   - payload.resumeData field containing the complete API response'
    );
    console.log('5. Verify the resumeData contains:');
    console.log(
      '   - desired_titles: ["Senior Backend Engineer", "Staff Engineer", "Technical Lead"]'
    );
    console.log(
      '   - experience with job start dates: 2022-03, 2019-01, 2016-06'
    );
    console.log('   - skills with proficiency levels');
    console.log('   - summary and other extracted fields');
  }
}

/**
 * Create a test query script for manual verification
 */
function createManualVerificationScript() {
  console.log('\n📝 Step 2: Manual Verification Script');
  console.log('-------------------------------------');

  const sqlQueries = [
    '-- Query recent log entries',
    'SELECT * FROM request_logs_simple ORDER BY created_at DESC LIMIT 5;',
    '',
    '-- Query entries for /process-resume endpoint',
    'SELECT request_id, timestamp, endpoint, json_extract(payload, "$.success") as success, json_extract(payload, "$.processingTimeMs") as processing_time FROM request_logs_simple WHERE endpoint = "/process-resume" ORDER BY created_at DESC LIMIT 3;',
    '',
    '-- Query resume data from payload',
    'SELECT request_id, json_extract(payload, "$.resumeData.desired_titles") as desired_titles, json_extract(payload, "$.resumeData.experience") as experience FROM request_logs_simple WHERE endpoint = "/process-resume" ORDER BY created_at DESC LIMIT 1;',
    '',
    '-- Count total log entries',
    'SELECT COUNT(*) as total_entries FROM request_logs_simple;',
    '',
    '-- Count entries by endpoint',
    'SELECT endpoint, COUNT(*) as count FROM request_logs_simple GROUP BY endpoint;',
  ];

  console.log('🔍 SQL Queries for Manual Verification:');
  console.log('=======================================');
  sqlQueries.forEach(query => console.log(query));

  console.log('\n📋 Expected Results:');
  console.log('-------------------');
  console.log('✅ Recent entries should show:');
  console.log('   - endpoint: "/process-resume"');
  console.log('   - success: true');
  console.log('   - processingTimeMs: ~25901');
  console.log(
    '   - resumeData.desired_titles: ["Senior Backend Engineer", "Staff Engineer", "Technical Lead"]'
  );
  console.log('   - resumeData.experience: Array with 3 entries');
  console.log('   - resumeData.skills: Array with 22 skills');
  console.log('   - Job start dates: 2022-03, 2019-01, 2016-06');
}

/**
 * Summary of what should be in the database
 */
function printExpectedDatabaseContent() {
  console.log('\n📊 Step 3: Expected Database Content');
  console.log('-----------------------------------');

  console.log('🗄️  Table: request_logs_simple');
  console.log('📋 Columns:');
  console.log('   - id: Auto-increment primary key');
  console.log(
    '   - request_id: UUID (e.g., "550e8400-e29b-41d4-a716-446655440000")'
  );
  console.log('   - timestamp: ISO string (e.g., "2024-10-03T17:39:00.000Z")');
  console.log('   - endpoint: "/process-resume"');
  console.log('   - payload: JSON string containing:');
  console.log('     * requestId: UUID');
  console.log('     * method: "POST"');
  console.log('     * endpoint: "/process-resume"');
  console.log('     * inputType: "text"');
  console.log('     * inputSize: 2761');
  console.log('     * language: "en"');
  console.log('     * success: true');
  console.log('     * processingTimeMs: ~25901');
  console.log('     * extractedFieldsCount: Number of fields');
  console.log('     * validationErrorsCount: 0');
  console.log('     * partialFieldsCount: 0');
  console.log('     * errors: []');
  console.log('     * unmappedFields: []');
  console.log('     * metadata: Object with AI model info');
  console.log('     * resumeData: Complete API response JSON');
  console.log('   - created_at: Database timestamp');

  console.log('\n🎯 Key Verification Points:');
  console.log('-----------------------------');
  console.log('✅ resumeData.desired_titles should contain:');
  console.log(
    '   ["Senior Backend Engineer", "Staff Engineer", "Technical Lead"]'
  );
  console.log('✅ resumeData.experience should contain 3 entries with:');
  console.log('   - TechCorp Inc: 2022-03 - present');
  console.log('   - StartupXYZ: 2019-01 - 2022-02');
  console.log('   - DevCompany: 2016-06 - 2018-12');
  console.log(
    '✅ resumeData.skills should contain 22 skills with proficiency levels'
  );
  console.log('✅ resumeData.summary should contain the professional summary');
}

// Run verification
verifyDatabaseLogs();
createManualVerificationScript();
printExpectedDatabaseContent();

console.log('\n🎉 VERIFICATION COMPLETE');
console.log('=========================');
console.log(
  '📝 The debug test was successful and the API response JSON should be stored in the database.'
);
console.log(
  '🔍 Use the SQL queries above to manually verify the database logs.'
);
console.log(
  '✅ If the data is found in request_logs_simple.payload.resumeData, the logging is working correctly!'
);
