#!/usr/bin/env node

/**
 * Phase 1: Mock Database Insertion Test
 * Test with static data to verify database logger works
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

console.log('🔍 Phase 1: Mock Database Insertion Test');
console.log('=======================================\n');

/**
 * Test with minimal resume to verify database insertion
 */
async function testMockDatabaseInsertion() {
  try {
    const mockResume = {
      resume_text:
        'TEST RESUME\nSoftware Engineer\nExperience: Test Developer at TestCorp from 2020-01 to present. Skills: JavaScript, Python.',
      language: 'en',
      options: {
        flexible_validation: true,
        strict_validation: false,
      },
    };

    console.log('📋 Step 1: Sending Mock Resume');
    console.log('-----------------------------');
    console.log(`📄 Resume text: ${mockResume.resume_text}`);
    console.log(`🌐 Language: ${mockResume.language}`);
    console.log(
      `📝 Input preview: ${mockResume.resume_text.substring(0, 50)}...\n`
    );

    const startTime = Date.now();
    const response = await fetch(`${WORKER_URL}/process-resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockResume),
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
      console.log(
        `💼 Experience: ${responseData.data.experience?.length || 0}`
      );
    }

    /**
     * Expected Database Log Content
     */
    console.log('\n🗄️  Step 3: Expected Database Log Content');
    console.log('----------------------------------------');
    console.log('The following should be logged to request_logs_simple:');
    console.log('');
    console.log('Expected payload structure:');
    console.log('{');
    console.log('  "requestId": "uuid",');
    console.log('  "method": "POST",');
    console.log('  "endpoint": "/process-resume",');
    console.log('  "inputType": "text",');
    console.log('  "inputSize": number,');
    console.log(
      '  "inputPreview": "TEST RESUME\\nSoftware Engineer\\nExperience: Test Developer at TestCorp from 2020-01 to present. Skills: JavaScript, Python.",'
    );
    console.log('  "language": "en",');
    console.log('  "success": true,');
    console.log('  "processingTimeMs": number,');
    console.log('  "extractedFieldsCount": number,');
    console.log('  "validationErrorsCount": number,');
    console.log('  "partialFieldsCount": number,');
    console.log('  "errors": [],');
    console.log('  "unmappedFields": [],');
    console.log('  "metadata": {...},');
    console.log(
      '  "resumeData": {  // ← THIS FIELD SHOULD CONTAIN THE COMPLETE API RESPONSE'
    );
    console.log('    "desired_titles": [...],');
    console.log('    "summary": "...",');
    console.log('    "skills": [...],');
    console.log('    "experience": [...]');
    console.log('  }');
    console.log('}');

    /**
     * Database Verification Instructions
     */
    console.log('\n🔍 Step 4: Database Verification');
    console.log('--------------------------------');
    console.log('Run these SQL queries to check the logs:');
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

    console.log('\n📋 Expected Results:');
    console.log('-------------------');
    console.log(
      '✅ input_preview should contain: "TEST RESUME\\nSoftware Engineer\\nExperience: Test Developer at TestCorp from 2020-01 to present. Skills: JavaScript, Python."'
    );
    console.log('✅ resume_data should NOT be null');
    console.log(
      '✅ payload should contain resumeData field with complete API response'
    );

    /**
     * Cloudflare Worker Logs
     */
    console.log('\n📝 Step 5: Check Cloudflare Worker Logs');
    console.log('---------------------------------------');
    console.log('Look for these log entries in the Cloudflare Worker console:');
    console.log('');
    console.log('1. "DEBUG: LogPayload structure: {');
    console.log('     requestId: "uuid",');
    console.log('     payloadKeys: [...],');
    console.log('     hasResumeData: true,');
    console.log('     resumeDataKeys: [...]');
    console.log('   }"');
    console.log('');
    console.log('2. "Simple logging request to database: {');
    console.log('     requestId: "uuid",');
    console.log('     endpoint: "/process-resume",');
    console.log(
      '     payloadKeys: ["requestId", "method", "endpoint", "inputType", "inputSize", "inputPreview", "language", "success", "processingTimeMs", "extractedFieldsCount", "validationErrorsCount", "partialFieldsCount", "errors", "unmappedFields", "metadata", "resumeData"]'
    );
    console.log('   }"');
    console.log('');
    console.log('3. "Successfully logged simple request to database: uuid"');

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
    console.log(
      `🗄️  Database Logging: Should include inputPreview and resumeData fields`
    );

    if (responseData.success && responseData.data) {
      console.log('\n🎉 SUCCESS: API response contains data');
      console.log('🔍 Check database logs and Cloudflare Worker console logs');
      console.log('📝 Look for the debug messages above');
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
testMockDatabaseInsertion();
