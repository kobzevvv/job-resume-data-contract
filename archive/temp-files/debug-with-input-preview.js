#!/usr/bin/env node

/**
 * Debug ResumeData Missing - With Input Preview
 * Test with data-engineer.txt to debug why resumeData is missing
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
const DATA_ENGINEER_FILE = join(
  __dirname,
  'tests',
  'sample-resumes',
  'data-engineer.txt'
);

console.log('🔍 Debug ResumeData Missing - With Input Preview');
console.log('================================================\n');

/**
 * Load data engineer resume
 */
function loadDataEngineerResume() {
  try {
    const resumeText = readFileSync(DATA_ENGINEER_FILE, 'utf8');
    console.log('📋 Step 1: Loaded Data Engineer Resume');
    console.log('------------------------------------');
    console.log(`📄 Resume length: ${resumeText.length} characters`);
    console.log(`🌐 Language: English`);
    console.log(`📝 Input preview: ${resumeText.substring(0, 100)}...`);

    return resumeText;
  } catch (error) {
    console.error('❌ Failed to load data engineer resume:', error.message);
    process.exit(1);
  }
}

/**
 * Create test request
 */
function createTestRequest(resumeText) {
  return {
    resume_text: resumeText,
    language: 'en',
    options: {
      flexible_validation: true,
      strict_validation: false,
    },
  };
}

/**
 * Send request and analyze response
 */
async function debugResumeDataMissing() {
  try {
    const resumeText = loadDataEngineerResume();
    const testRequest = createTestRequest(resumeText);

    console.log('\n🚀 Step 2: Sending Request to Worker');
    console.log('------------------------------------');
    console.log(`🔗 Worker URL: ${WORKER_URL}`);
    console.log('📤 Sending POST request to /process-resume...\n');

    const startTime = Date.now();
    const response = await fetch(`${WORKER_URL}/process-resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRequest),
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
    console.log('📊 Step 3: Analyzing API Response');
    console.log('----------------------------------');
    console.log(`✅ Success: ${responseData.success}`);
    console.log(`⏱️  Processing time: ${responseData.processing_time_ms}ms`);
    console.log(`📝 Errors count: ${responseData.errors?.length || 0}`);
    console.log(
      `🔍 Unmapped fields: ${responseData.unmapped_fields?.length || 0}`
    );
    console.log(
      `📋 Partial fields: ${responseData.partial_fields?.length || 0}`
    );

    if (responseData.data) {
      console.log('\n📋 Extracted Resume Data:');
      console.log('--------------------------');
      console.log(
        `🎯 Desired titles: ${responseData.data.desired_titles?.length || 0} found`
      );
      console.log(
        `📝 Summary length: ${responseData.data.summary?.length || 0} characters`
      );
      console.log(`🛠️  Skills count: ${responseData.data.skills?.length || 0}`);
      console.log(
        `💼 Experience entries: ${responseData.data.experience?.length || 0}`
      );

      // Show sample data
      if (responseData.data.desired_titles) {
        console.log(
          `📋 Desired titles: ${JSON.stringify(responseData.data.desired_titles)}`
        );
      }
      if (
        responseData.data.experience &&
        responseData.data.experience.length > 0
      ) {
        console.log(
          `📅 First experience: ${responseData.data.experience[0].title} at ${responseData.data.experience[0].employer}`
        );
      }
    } else {
      console.log('❌ No data extracted from resume');
    }

    /**
     * Database Verification Instructions
     */
    console.log('\n🗄️  Step 4: Database Verification');
    console.log('--------------------------------');
    console.log('🔍 Run these SQL queries to check the logs:');
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
    console.log('-- 3. Check specific resume fields');
    console.log(
      'SELECT request_id, json_extract(payload, "$.resumeData.desired_titles") as titles, json_extract(payload, "$.resumeData.experience") as experience FROM request_logs_simple WHERE endpoint = "/process-resume" ORDER BY created_at DESC LIMIT 1;'
    );
    console.log('');
    console.log('-- 4. Check complete payload structure');
    console.log(
      'SELECT request_id, payload FROM request_logs_simple WHERE endpoint = "/process-resume" ORDER BY created_at DESC LIMIT 1;'
    );

    console.log('\n📋 Expected Results:');
    console.log('-------------------');
    console.log(
      '✅ input_preview should contain: "SARAH JOHNSON\\nData Platform Engineer\\n\\n📧 sarah.johnson@datamail.com..."'
    );
    console.log('✅ resume_data should NOT be null');
    console.log(
      '✅ titles should contain: ["Staff Data Engineer","Principal Data Engineer","Data Architecture"]'
    );
    console.log(
      '✅ experience should contain 3 entries with job start dates: 2021-08, 2019-01, 2018-06'
    );
    console.log(
      '✅ payload should contain resumeData field with complete API response'
    );

    /**
     * Summary
     */
    console.log('\n📋 Step 5: Debug Summary');
    console.log('------------------------');
    console.log(
      `✅ API Response Generated: ${responseData.success ? 'YES' : 'NO'}`
    );
    console.log(`📊 Data Extracted: ${responseData.data ? 'YES' : 'NO'}`);
    console.log(
      `🚀 Worker Deployed: YES (Version: c8c002f1-83c4-4a41-a06b-45a4c322a309)`
    );
    console.log(
      `🗄️  Database Logging: Should now include inputPreview and resumeData fields`
    );

    if (responseData.success && responseData.data) {
      console.log('\n🎉 SUCCESS: API response contains data');
      console.log(
        '🔍 Check database logs for inputPreview and resumeData fields'
      );
      console.log(
        '📝 Look for worker console logs with "DEBUG: LogPayload structure"'
      );
      console.log('');
      console.log('📋 Key Data Points to Verify:');
      console.log('-----------------------------');
      console.log(
        '✅ Input Preview: Should start with "SARAH JOHNSON\\nData Platform Engineer"'
      );
      console.log('✅ Job Start Dates: 2021-08, 2019-01, 2018-06');
      console.log(
        '✅ Desired Titles: Staff Data Engineer, Principal Data Engineer, Data Architecture'
      );
      console.log('✅ Skills Count: 20+ skills');
      console.log('✅ Experience Count: 3 entries');
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
debugResumeDataMissing();
