#!/usr/bin/env node

/**
 * Phase 1.2: Debug Database Connection
 * Test if we can connect to the database and check table structure
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

console.log('🔍 Phase 1.2: Debug Database Connection');
console.log('======================================\n');

/**
 * Test database connection by creating a simple endpoint
 */
async function testDatabaseConnection() {
  try {
    console.log('📋 Step 1: Testing Database Connection');
    console.log('-------------------------------------');
    console.log(
      'We need to check if the database is accessible from the worker.'
    );
    console.log(
      "Let's create a simple test to verify database connectivity.\n"
    );

    // First, let's check if there's a way to test the database connection
    // We can try to call a simple endpoint that just logs to database

    const testPayload = {
      test: true,
      message: 'Database connection test',
      timestamp: new Date().toISOString(),
    };

    console.log('📤 Sending test request to check database connection...');

    const startTime = Date.now();
    const response = await fetch(`${WORKER_URL}/process-resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resume_text:
          'TEST\nDatabase Connection Test\nThis is a test to check if database logging works.',
        language: 'en',
        options: {
          flexible_validation: true,
          strict_validation: false,
        },
      }),
    });

    const processingTime = Date.now() - startTime;
    console.log(`⏱️  Request processing time: ${processingTime}ms`);
    console.log(
      `📊 Response status: ${response.status} ${response.statusText}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Request failed:', errorText);
      return;
    }

    const responseData = await response.json();
    console.log('✅ Request completed successfully\n');

    /**
     * Check Cloudflare Worker Logs
     */
    console.log('📝 Step 2: Check Cloudflare Worker Logs');
    console.log('-------------------------------------');
    console.log(
      'Look for these specific log entries in the Cloudflare Worker console:'
    );
    console.log('');
    console.log('1. **Database binding check**:');
    console.log(
      '   - "Database logging disabled: RESUME_DB binding not available"'
    );
    console.log('   - OR: "Simple logging request to database:"');
    console.log('');
    console.log('2. **Database insertion attempt**:');
    console.log(
      '   - "Simple logging request to database: { requestId: ..., endpoint: ..., payloadKeys: [...] }"'
    );
    console.log('');
    console.log('3. **Database insertion result**:');
    console.log(
      '   - "Successfully logged simple request to database: [requestId]"'
    );
    console.log(
      '   - OR: "Failed to log simple request to database: [error details]"'
    );
    console.log('');
    console.log('4. **Debug payload structure**:');
    console.log(
      '   - "DEBUG: LogPayload structure: { requestId: ..., payloadKeys: [...], hasResumeData: ..., resumeDataKeys: [...] }"'
    );

    /**
     * Database Verification Queries
     */
    console.log('\n🗄️  Step 3: Database Verification Queries');
    console.log('----------------------------------------');
    console.log('Run these SQL queries to check the database:');
    console.log('');
    console.log('-- 1. Check if table exists');
    console.log(
      'SELECT sql FROM sqlite_master WHERE type="table" AND name="request_logs_simple";'
    );
    console.log('');
    console.log('-- 2. Check table structure');
    console.log('PRAGMA table_info(request_logs_simple);');
    console.log('');
    console.log('-- 3. Count total rows');
    console.log('SELECT COUNT(*) as total_rows FROM request_logs_simple;');
    console.log('');
    console.log('-- 4. Check recent rows');
    console.log(
      'SELECT request_id, timestamp, endpoint, created_at FROM request_logs_simple ORDER BY created_at DESC LIMIT 5;'
    );

    /**
     * Possible Issues and Solutions
     */
    console.log('\n🔍 Step 4: Possible Issues and Solutions');
    console.log('---------------------------------------');
    console.log('Based on the logs, the issue could be:');
    console.log('');
    console.log('**Issue 1: Database binding not available**');
    console.log(
      '  - Look for: "Database logging disabled: RESUME_DB binding not available"'
    );
    console.log(
      '  - Solution: Check wrangler.toml database binding configuration'
    );
    console.log('');
    console.log("**Issue 2: Database table doesn't exist**");
    console.log('  - Look for: SQL errors in the logs');
    console.log('  - Solution: Create the table using the schema');
    console.log('');
    console.log('**Issue 3: Database permissions**');
    console.log('  - Look for: Permission denied errors');
    console.log('  - Solution: Check database permissions');
    console.log('');
    console.log('**Issue 4: Async logging not working**');
    console.log(
      '  - Look for: No "Simple logging request to database" message'
    );
    console.log('  - Solution: Check if logRequestSimple is being called');

    /**
     * Next Steps
     */
    console.log('\n📋 Step 5: Next Steps');
    console.log('---------------------');
    console.log(
      '1. **Check Cloudflare Worker console logs** for the messages above'
    );
    console.log('2. **Run the SQL queries** to check database state');
    console.log(
      "3. **Based on the findings**, we'll implement the appropriate fix"
    );
    console.log('');
    console.log('**If database binding is not available**:');
    console.log('  - We need to fix the wrangler.toml configuration');
    console.log('');
    console.log("**If table doesn't exist**:");
    console.log('  - We need to create the table using the schema');
    console.log('');
    console.log('**If there are permission issues**:');
    console.log('  - We need to check database permissions');

    /**
     * Summary
     */
    console.log('\n📋 Step 6: Test Summary');
    console.log('----------------------');
    console.log(
      `✅ API Response Generated: ${responseData.success ? 'YES' : 'NO'}`
    );
    console.log(`📊 Data Extracted: ${responseData.data ? 'YES' : 'NO'}`);
    console.log(
      `🚀 Worker Deployed: YES (Version: c8c002f1-83c4-4a41-a06b-45a4c322a309)`
    );
    console.log(`🗄️  Database Logging: NEEDS INVESTIGATION`);

    if (responseData.success && responseData.data) {
      console.log('\n🎉 SUCCESS: API response contains data');
      console.log('🔍 Now check Cloudflare Worker console logs and database');
      console.log('📝 Look for the specific log messages above');
    } else {
      console.log('\n⚠️  ISSUE: No data extracted from resume');
      console.log('🔍 Check the errors and unmapped fields for details');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testDatabaseConnection();
