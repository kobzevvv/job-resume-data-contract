#!/usr/bin/env node

/**
 * Check Current Logging Implementation
 * Verify what's actually being logged vs what should be logged
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

console.log('🔍 Check Current Logging Implementation');
console.log('=====================================\n');

/**
 * Test with minimal resume to see what gets logged
 */
async function testLoggingImplementation() {
  try {
    const minimalResume = {
      resume_text:
        'John Doe\nSoftware Engineer\nExperience: Senior Developer at TechCorp from 2020-01 to present. Skills: JavaScript, Python, React.',
      language: 'en',
      options: {
        flexible_validation: true,
        strict_validation: false,
      },
    };

    console.log('📋 Step 1: Sending Minimal Test Request');
    console.log('---------------------------------------');
    console.log(
      `📄 Resume length: ${minimalResume.resume_text.length} characters`
    );
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
     * Analyze what should be logged
     */
    console.log('📊 Step 2: Expected Log Payload Structure');
    console.log('----------------------------------------');
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
      '  resumeData: response.data  // ← THIS SHOULD BE THE COMPLETE API RESPONSE DATA'
    );
    console.log('};');

    console.log('\n📋 Step 3: Actual API Response Data');
    console.log('-----------------------------------');
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

      console.log('\n📋 Sample Data:');
      if (responseData.data.desired_titles) {
        console.log(
          `   Desired titles: ${JSON.stringify(responseData.data.desired_titles)}`
        );
      }
      if (
        responseData.data.experience &&
        responseData.data.experience.length > 0
      ) {
        console.log(
          `   First experience: ${responseData.data.experience[0].title} at ${responseData.data.experience[0].employer}`
        );
      }
    }

    console.log('\n🔍 Step 4: Database Verification');
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
    console.log('  "validationErrorsCount": 0,');
    console.log('  "partialFieldsCount": 0,');
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

    console.log('\n⚠️  If resumeData field is missing, the issue is:');
    console.log('   1. Code change not deployed');
    console.log('   2. Database logger not using the updated payload');
    console.log('   3. Error in the logging implementation');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testLoggingImplementation();
