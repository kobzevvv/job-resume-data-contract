#!/usr/bin/env node

/**
 * Resume Data Transformation Debug Test
 * Step-by-step tracing of data transformation and database logging
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
const TEST_REQUEST_FILE = join(__dirname, 'test-debug-request.json');

console.log('🔍 Resume Data Transformation Debug Test');
console.log('==========================================\n');

/**
 * Step 1: Load test request
 */
console.log('📋 Step 1: Loading Test Request');
console.log('-------------------------------');
try {
  const testRequest = JSON.parse(readFileSync(TEST_REQUEST_FILE, 'utf8'));
  console.log('✅ Test request loaded successfully');
  console.log(
    `📄 Resume text length: ${testRequest.resume_text.length} characters`
  );
  console.log(`🌐 Language: ${testRequest.language}`);
  console.log(`⚙️  Options: ${JSON.stringify(testRequest.options, null, 2)}\n`);
} catch (error) {
  console.error('❌ Failed to load test request:', error.message);
  process.exit(1);
}

/**
 * Step 2: Send request to worker
 */
console.log('🚀 Step 2: Sending Request to Worker');
console.log('------------------------------------');
console.log(`🔗 Worker URL: ${WORKER_URL}`);
console.log('📤 Sending POST request to /process-resume...\n');

async function debugTest() {
  try {
    const testRequest = JSON.parse(readFileSync(TEST_REQUEST_FILE, 'utf8'));

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
     * Step 3: Analyze API Response
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
      console.log(
        `🎓 Education: ${responseData.data.education ? 'Found' : 'Not found'}`
      );
      console.log(
        `💰 Salary expectation: ${responseData.data.salary_expectation ? 'Found' : 'Not found'}`
      );

      // Check specific job start dates
      if (responseData.data.experience) {
        console.log('\n📅 Job Start Dates Verification:');
        console.log('--------------------------------');
        responseData.data.experience.forEach((exp, index) => {
          console.log(
            `${index + 1}. ${exp.title} at ${exp.employer}: ${exp.start} - ${exp.end}`
          );
        });
      }

      // Check skills with proficiency levels
      if (responseData.data.skills) {
        console.log('\n🛠️  Skills with Proficiency Levels:');
        console.log('-----------------------------------');
        responseData.data.skills.forEach((skill, index) => {
          if (typeof skill === 'object' && skill.level) {
            console.log(
              `${index + 1}. ${skill.name}: Level ${skill.level} (${skill.label})`
            );
          } else {
            console.log(`${index + 1}. ${skill}`);
          }
        });
      }
    }

    /**
     * Step 4: Database Logging Verification
     */
    console.log('\n🗄️  Step 4: Database Logging Verification');
    console.log('----------------------------------------');
    console.log('📝 Note: Database logging happens asynchronously');
    console.log('🔍 Check the request_logs_simple table for:');
    console.log('   - request_id (UUID)');
    console.log('   - timestamp');
    console.log('   - endpoint: /process-resume');
    console.log('   - payload.resumeData (complete API response)');
    console.log('   - payload.processingTimeMs');
    console.log('   - payload.success');
    console.log('   - payload.extractedFieldsCount');

    /**
     * Step 5: Data Integrity Check
     */
    console.log('\n🔍 Step 5: Data Integrity Check');
    console.log('--------------------------------');

    const expectedJobDates = ['2022-03', '2019-01', '2016-06'];
    const foundJobDates =
      responseData.data?.experience?.map(exp => exp.start) || [];

    console.log('📅 Expected job start dates:', expectedJobDates);
    console.log('📅 Found job start dates:', foundJobDates);

    const datesMatch = expectedJobDates.every(date =>
      foundJobDates.includes(date)
    );
    console.log(`✅ Job dates match: ${datesMatch ? 'YES' : 'NO'}`);

    const expectedSkills = ['Go', 'Python', 'PostgreSQL'];
    const foundSkills =
      responseData.data?.skills?.map(skill =>
        typeof skill === 'object' ? skill.name : skill
      ) || [];

    console.log('🛠️  Expected key skills:', expectedSkills);
    console.log(
      '🛠️  Found skills:',
      foundSkills.slice(0, 10),
      foundSkills.length > 10 ? '...' : ''
    );

    const skillsMatch = expectedSkills.every(skill =>
      foundSkills.some(found =>
        found.toLowerCase().includes(skill.toLowerCase())
      )
    );
    console.log(`✅ Key skills found: ${skillsMatch ? 'YES' : 'NO'}`);

    /**
     * Step 6: Summary
     */
    console.log('\n📋 Step 6: Debug Summary');
    console.log('------------------------');
    console.log(
      `✅ API Response Generated: ${responseData.success ? 'YES' : 'NO'}`
    );
    console.log(
      `📊 Data Completeness: ${responseData.data ? 'COMPLETE' : 'INCOMPLETE'}`
    );
    console.log(`📅 Job Dates Preserved: ${datesMatch ? 'YES' : 'NO'}`);
    console.log(`🛠️  Skills Extracted: ${skillsMatch ? 'YES' : 'NO'}`);
    console.log(`🗄️  Database Logging: Check request_logs_simple table`);
    console.log(`⏱️  Total Processing Time: ${processingTime}ms`);

    if (responseData.success && responseData.data) {
      console.log(
        '\n🎉 SUCCESS: Complete data transformation pipeline working correctly!'
      );
      console.log(
        '📝 The API response JSON should now be stored in the database logs.'
      );
    } else {
      console.log(
        '\n⚠️  ISSUES DETECTED: Some data transformation problems found.'
      );
      console.log('🔍 Check the errors and unmapped fields for details.');
    }
  } catch (error) {
    console.error('❌ Debug test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the debug test
debugTest();
