#!/usr/bin/env node

/**
 * Phase 1.1: Test Database Insertion
 * Simple test to verify database logging works at all
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

console.log('🔍 Phase 1.1: Test Database Insertion');
console.log('=====================================\n');

/**
 * Test with minimal resume to check if ANY logging happens
 */
async function testDatabaseInsertion() {
  try {
    const minimalResume = {
      resume_text: 'JOHN DOE\nSoftware Engineer\nSkills: JavaScript, Python.',
      language: 'en',
      options: {
        flexible_validation: true,
        strict_validation: false,
      },
    };

    console.log('📋 Step 1: Sending Minimal Resume');
    console.log('---------------------------------');
    console.log(`📄 Resume text: ${minimalResume.resume_text}`);
    console.log(`🌐 Language: ${minimalResume.language}\n`);

    const startTime = Date.now();
    const response = await fetch(`${WORKER_URL}/process-resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(minimalResume),
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
     * Analyze API Response
     */
    console.log('📊 Step 2: API Response Analysis');
    console.log('-------------------------------');
    console.log(`✅ Success: ${responseData.success}`);
    console.log(`📊 Has data: ${responseData.data ? 'YES' : 'NO'}`);
    console.log(`⏱️  Processing time: ${responseData.processing_time_ms}ms`);
    console.log(`📝 Errors count: ${responseData.errors?.length || 0}`);

    if (responseData.data) {
      console.log(
        `🎯 Desired titles: ${responseData.data.desired_titles?.length || 0}`
      );
      console.log(`📝 Summary: ${responseData.data.summary ? 'YES' : 'NO'}`);
      console.log(`🛠️  Skills: ${responseData.data.skills?.length || 0}`);
    }

    /**
     * Check Database Immediately
     */
    console.log('\n🗄️  Step 3: Check Database Immediately');
    console.log('-------------------------------------');
    console.log(
      'Run these SQL queries RIGHT NOW to check if ANY new rows were inserted:'
    );
    console.log('');
    console.log('-- 1. Count total rows');
    console.log('SELECT COUNT(*) as total_rows FROM request_logs_simple;');
    console.log('');
    console.log('-- 2. Check most recent rows');
    console.log(
      'SELECT request_id, timestamp, endpoint, created_at FROM request_logs_simple ORDER BY created_at DESC LIMIT 5;'
    );
    console.log('');
    console.log('-- 3. Check if any rows were inserted in the last 5 minutes');
    console.log(
      'SELECT request_id, timestamp, endpoint, created_at FROM request_logs_simple WHERE created_at > datetime("now", "-5 minutes") ORDER BY created_at DESC;'
    );

    /**
     * Cloudflare Worker Logs
     */
    console.log('\n📝 Step 4: Check Cloudflare Worker Logs');
    console.log('---------------------------------------');
    console.log('Look for these log entries in the Cloudflare Worker console:');
    console.log('');
    console.log(
      '1. "DEBUG: LogPayload structure:" - Should show payload construction'
    );
    console.log(
      '2. "Simple logging request to database:" - Should show database insertion attempt'
    );
    console.log(
      '3. "Successfully logged simple request to database:" - Should show successful insertion'
    );
    console.log('4. "Database logging failed:" - Should show any errors');
    console.log(
      '5. "Database logging disabled: RESUME_DB binding not available" - Should show if DB is not available'
    );

    /**
     * Possible Issues
     */
    console.log('\n🔍 Step 5: Possible Issues');
    console.log('--------------------------');
    console.log('If NO new rows are inserted, the issue could be:');
    console.log('');
    console.log(
      '1. **Database binding not available** - Check for "RESUME_DB binding not available"'
    );
    console.log(
      '2. **Database insertion error** - Check for "Database logging failed"'
    );
    console.log("3. **Database table doesn't exist** - Check for SQL errors");
    console.log(
      '4. **Async logging not working** - Check if logRequestSimple is being called'
    );
    console.log(
      '5. **Database permissions** - Check if the worker can write to the database'
    );

    /**
     * Debug Steps
     */
    console.log('\n🔧 Step 6: Debug Steps');
    console.log('----------------------');
    console.log(
      '1. **Check Cloudflare Worker console logs** for any error messages'
    );
    console.log('2. **Run the SQL queries above** to see if any rows exist');
    console.log('3. **Check database table structure** with:');
    console.log(
      '   SELECT sql FROM sqlite_master WHERE type="table" AND name="request_logs_simple";'
    );
    console.log(
      '4. **Check if database binding is available** in worker environment'
    );

    /**
     * Summary
     */
    console.log('\n📋 Step 7: Test Summary');
    console.log('----------------------');
    console.log(
      `✅ API Response Generated: ${responseData.success ? 'YES' : 'NO'}`
    );
    console.log(`📊 Data Extracted: ${responseData.data ? 'YES' : 'NO'}`);
    console.log(
      `🚀 Worker Deployed: YES (Version: c8c002f1-83c4-4a41-a06b-45a4c322a309)`
    );
    console.log(`🗄️  Database Logging: NEEDS VERIFICATION`);

    if (responseData.success && responseData.data) {
      console.log('\n🎉 SUCCESS: API response contains data');
      console.log('🔍 Now check if database insertion is working');
      console.log('📝 Look for the log messages above');
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
testDatabaseInsertion();
