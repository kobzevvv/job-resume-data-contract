#!/usr/bin/env node

/**
 * Debug Database Logger - Check Console Output
 * Test to see what's actually being logged and check for errors
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

console.log('🔍 Debug Database Logger - Check Console Output');
console.log('==============================================\n');

/**
 * Test with minimal resume to check logging
 */
async function debugDatabaseLogger() {
  try {
    const testResume = {
      resume_text:
        'John Doe\nSoftware Engineer\nExperience: Senior Developer at TechCorp from 2020-01 to present. Skills: JavaScript, Python, React.',
      language: 'en',
      options: {
        flexible_validation: true,
        strict_validation: false,
      },
    };

    console.log('📋 Step 1: Sending Test Request');
    console.log('-------------------------------');
    console.log(
      `📄 Resume length: ${testResume.resume_text.length} characters`
    );
    console.log(`🌐 Language: ${testResume.language}\n`);

    const startTime = Date.now();
    const response = await fetch(`${WORKER_URL}/process-resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testResume),
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
     * Check what should be logged
     */
    console.log('\n🗄️  Step 3: Expected Log Payload');
    console.log('-------------------------------');
    console.log('Based on the current code, the logPayload should contain:');
    console.log('');
    console.log('const logPayload = {');
    console.log('  requestId: "uuid",');
    console.log('  method: "POST",');
    console.log('  endpoint: "/process-resume",');
    console.log('  inputType: "text",');
    console.log('  inputSize: number,');
    console.log('  language: "en",');
    console.log('  success: boolean,');
    console.log('  processingTimeMs: number,');
    console.log('  extractedFieldsCount: number,');
    console.log('  validationErrorsCount: number,');
    console.log('  partialFieldsCount: number,');
    console.log('  errors: [],');
    console.log('  unmappedFields: [],');
    console.log('  metadata: {...},');
    console.log(
      '  resumeData: response.data  // ← THIS SHOULD CONTAIN THE COMPLETE API RESPONSE'
    );
    console.log('};');

    console.log('\n🔍 Step 4: Database Logger Console Output');
    console.log('----------------------------------------');
    console.log('The database logger should log:');
    console.log('"Simple logging request to database: {');
    console.log('  requestId: "uuid",');
    console.log('  endpoint: "/process-resume",');
    console.log(
      '  payloadKeys: ["requestId", "method", "endpoint", "inputType", "inputSize", "language", "success", "processingTimeMs", "extractedFieldsCount", "validationErrorsCount", "partialFieldsCount", "errors", "unmappedFields", "metadata", "resumeData"]'
    );
    console.log('}"');
    console.log('');
    console.log(
      '⚠️  If "resumeData" is NOT in payloadKeys, the issue is in the logPayload construction'
    );
    console.log(
      '⚠️  If "resumeData" IS in payloadKeys but missing from database, the issue is in the database insertion'
    );

    console.log('\n🔍 Step 5: Database Verification');
    console.log('--------------------------------');
    console.log('Run this query to check what was actually logged:');
    console.log('');
    console.log(
      'SELECT request_id, payload FROM request_logs_simple ORDER BY created_at DESC LIMIT 1;'
    );
    console.log('');
    console.log('Expected payload structure:');
    console.log('{');
    console.log('  "requestId": "uuid",');
    console.log('  "method": "POST",');
    console.log('  "endpoint": "/process-resume",');
    console.log('  "inputType": "text",');
    console.log('  "inputSize": number,');
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

    console.log('\n📋 Step 6: Debug Summary');
    console.log('------------------------');
    console.log(
      `✅ API Response Generated: ${responseData.success ? 'YES' : 'NO'}`
    );
    console.log(`📊 Data Extracted: ${responseData.data ? 'YES' : 'NO'}`);
    console.log(
      `🚀 Worker Deployed: YES (Version: 7eacddad-6948-4f4b-bafb-5e39a35abe49)`
    );
    console.log(`🗄️  Database Logging: Check console output and database`);

    if (responseData.success && responseData.data) {
      console.log('\n🎉 SUCCESS: API response contains data');
      console.log(
        '🔍 Check the worker console logs for "Simple logging request to database"'
      );
      console.log(
        '📝 Look for "payloadKeys" array - it should include "resumeData"'
      );
      console.log(
        '🗄️  Then check the database to see if resumeData is actually stored'
      );
    } else {
      console.log('\n⚠️  ISSUE: No data extracted from resume');
      console.log('🔍 Check the errors and unmapped fields for details');
    }
  } catch (error) {
    console.error('❌ Debug test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the debug test
debugDatabaseLogger();
