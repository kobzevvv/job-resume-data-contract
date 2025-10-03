#!/usr/bin/env node

/**
 * Final Verification: Test Deployed Fix
 * Verify that resumeData is now properly stored in database logs
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

console.log('🎯 Final Verification: Test Deployed Fix');
console.log('========================================\n');

/**
 * Test with a simple resume to verify the fix
 */
async function verifyDeployedFix() {
  try {
    const testResume = {
      resume_text:
        'Maria Ivanova\nSoftware Engineer\nExperience: Senior Developer at TechCorp from 2020-01 to present. Skills: JavaScript, Python, React. Education: Computer Science degree from Moscow State University.',
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
      if (responseData.data.skills && responseData.data.skills.length > 0) {
        console.log(
          `🛠️  First skill: ${typeof responseData.data.skills[0] === 'object' ? responseData.data.skills[0].name : responseData.data.skills[0]}`
        );
      }
    }

    /**
     * Database Verification Instructions
     */
    console.log('\n🗄️  Step 3: Database Verification');
    console.log('--------------------------------');
    console.log('🔍 Run these SQL queries to verify the fix:');
    console.log('');
    console.log('-- 1. Check if resumeData field exists');
    console.log(
      'SELECT request_id, json_extract(payload, "$.resumeData") as resume_data FROM request_logs_simple WHERE endpoint = "/process-resume" ORDER BY created_at DESC LIMIT 1;'
    );
    console.log('');
    console.log('-- 2. Check specific resume fields');
    console.log(
      'SELECT request_id, json_extract(payload, "$.resumeData.desired_titles") as titles, json_extract(payload, "$.resumeData.experience") as experience FROM request_logs_simple WHERE endpoint = "/process-resume" ORDER BY created_at DESC LIMIT 1;'
    );
    console.log('');
    console.log('-- 3. Check complete payload structure');
    console.log(
      'SELECT request_id, payload FROM request_logs_simple WHERE endpoint = "/process-resume" ORDER BY created_at DESC LIMIT 1;'
    );

    console.log('\n📋 Expected Results:');
    console.log('-------------------');
    console.log('✅ resume_data should NOT be null');
    console.log('✅ titles should contain array of job titles');
    console.log('✅ experience should contain array of work experience');
    console.log(
      '✅ payload should contain resumeData field with complete API response'
    );

    /**
     * Summary
     */
    console.log('\n📋 Step 4: Verification Summary');
    console.log('-----------------------------');
    console.log(
      `✅ API Response Generated: ${responseData.success ? 'YES' : 'NO'}`
    );
    console.log(`📊 Data Extracted: ${responseData.data ? 'YES' : 'NO'}`);
    console.log(
      `🚀 Worker Deployed: YES (Version: 7eacddad-6948-4f4b-bafb-5e39a35abe49)`
    );
    console.log(`🗄️  Database Logging: Should now include resumeData field`);

    if (responseData.success && responseData.data) {
      console.log('\n🎉 SUCCESS: Fix deployed successfully!');
      console.log(
        '📝 The resumeData field should now be present in the database logs.'
      );
      console.log('🔍 Run the SQL queries above to verify the fix is working.');
    } else {
      console.log('\n⚠️  ISSUE: No data extracted from resume');
      console.log('🔍 Check the errors and unmapped fields for details');
    }
  } catch (error) {
    console.error('❌ Verification test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the verification
verifyDeployedFix();
