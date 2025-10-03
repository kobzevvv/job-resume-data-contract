#!/usr/bin/env node

/**
 * Debug Missing ResumeData in Logs
 * Test with Russian resume to verify resumeData is properly stored
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
const RUSSIAN_RESUME_FILE = join(
  __dirname,
  'tests',
  'sample-resumes',
  'russian-it-specialist.txt'
);

console.log('🔍 Debug Missing ResumeData in Logs');
console.log('===================================\n');

/**
 * Load Russian resume
 */
function loadRussianResume() {
  try {
    const resumeText = readFileSync(RUSSIAN_RESUME_FILE, 'utf8');
    console.log('📋 Step 1: Loaded Russian Resume');
    console.log('--------------------------------');
    console.log(`📄 Resume length: ${resumeText.length} characters`);
    console.log(`🌐 Language: Russian`);

    // Extract key info for verification
    const lines = resumeText.split('\n');
    const jobDates = [];
    lines.forEach(line => {
      if (line.includes('— настоящее время') || line.includes('— ')) {
        jobDates.push(line.trim());
      }
    });

    console.log('📅 Expected job dates found:');
    jobDates.slice(0, 3).forEach((date, i) => {
      console.log(`   ${i + 1}. ${date}`);
    });

    return resumeText;
  } catch (error) {
    console.error('❌ Failed to load Russian resume:', error.message);
    process.exit(1);
  }
}

/**
 * Create test request
 */
function createTestRequest(resumeText) {
  return {
    resume_text: resumeText,
    language: 'ru',
    options: {
      flexible_validation: true,
      strict_validation: false,
    },
  };
}

/**
 * Send request and analyze response
 */
async function debugResumeDataLogging() {
  try {
    const resumeText = loadRussianResume();
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

      // Check specific job dates
      if (responseData.data.experience) {
        console.log('\n📅 Job Start Dates Verification:');
        console.log('--------------------------------');
        responseData.data.experience.forEach((exp, index) => {
          console.log(
            `${index + 1}. ${exp.title} at ${exp.employer}: ${exp.start} - ${exp.end}`
          );
        });
      }

      // Check if we have the expected data
      console.log('\n🔍 Data Completeness Check:');
      console.log('-----------------------------');
      console.log(
        `✅ Has desired_titles: ${responseData.data.desired_titles ? 'YES' : 'NO'}`
      );
      console.log(
        `✅ Has summary: ${responseData.data.summary ? 'YES' : 'NO'}`
      );
      console.log(`✅ Has skills: ${responseData.data.skills ? 'YES' : 'NO'}`);
      console.log(
        `✅ Has experience: ${responseData.data.experience ? 'YES' : 'NO'}`
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
     * Check what should be logged
     */
    console.log('\n🗄️  Step 4: Expected Database Log Content');
    console.log('----------------------------------------');
    console.log('📝 The following should be logged to request_logs_simple:');
    console.log('   - requestId: UUID');
    console.log('   - method: "POST"');
    console.log('   - endpoint: "/process-resume"');
    console.log('   - inputType: "text"');
    console.log('   - language: "ru"');
    console.log('   - success: true');
    console.log('   - processingTimeMs: number');
    console.log('   - extractedFieldsCount: number');
    console.log('   - validationErrorsCount: 0');
    console.log('   - partialFieldsCount: 0');
    console.log('   - errors: []');
    console.log('   - unmappedFields: []');
    console.log('   - metadata: {...}');
    console.log('   - resumeData: COMPLETE API RESPONSE DATA');

    console.log('\n🔍 Step 5: Database Verification Queries');
    console.log('----------------------------------------');
    console.log('Run these queries to check the logs:');
    console.log('');
    console.log('-- Check recent entries');
    console.log(
      'SELECT request_id, timestamp, endpoint, json_extract(payload, "$.success") as success FROM request_logs_simple ORDER BY created_at DESC LIMIT 3;'
    );
    console.log('');
    console.log('-- Check if resumeData exists');
    console.log(
      'SELECT request_id, json_extract(payload, "$.resumeData") as resume_data FROM request_logs_simple WHERE endpoint = "/process-resume" ORDER BY created_at DESC LIMIT 1;'
    );
    console.log('');
    console.log('-- Check specific resume fields');
    console.log(
      'SELECT request_id, json_extract(payload, "$.resumeData.desired_titles") as titles, json_extract(payload, "$.resumeData.experience") as experience FROM request_logs_simple WHERE endpoint = "/process-resume" ORDER BY created_at DESC LIMIT 1;'
    );

    /**
     * Summary
     */
    console.log('\n📋 Step 6: Debug Summary');
    console.log('------------------------');
    console.log(
      `✅ API Response Generated: ${responseData.success ? 'YES' : 'NO'}`
    );
    console.log(`📊 Data Extracted: ${responseData.data ? 'YES' : 'NO'}`);
    console.log(
      `🗄️  Should be in logs: ${responseData.data ? 'YES - Check resumeData field' : 'NO - No data to log'}`
    );

    if (responseData.success && responseData.data) {
      console.log('\n🎉 SUCCESS: API response contains data');
      console.log('🔍 Check database logs for resumeData field');
      console.log(
        '📝 If resumeData is missing, there may be an issue with the logging implementation'
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
debugResumeDataLogging();
