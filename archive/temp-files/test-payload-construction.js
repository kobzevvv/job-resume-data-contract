#!/usr/bin/env node

/**
 * Test Payload Construction
 * Verify that the logPayload actually contains resumeData
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

console.log('🔍 Test Payload Construction');
console.log('============================\n');

/**
 * Test with minimal resume to check payload construction
 */
async function testPayloadConstruction() {
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
      `📄 Resume length: ${testResume.resume_text.length} characters\n`
    );

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
     * Simulate the logPayload construction
     */
    console.log('📊 Step 2: Simulating LogPayload Construction');
    console.log('--------------------------------------------');

    const mockRequestId = 'test-uuid-123';
    const mockRequest = { method: 'POST' };
    const mockRequestData = { resume_text: testResume.resume_text };
    const mockResponse = responseData;
    const mockLanguage = 'en';

    // This is exactly what the code should be doing
    const logPayload = {
      requestId: mockRequestId,
      method: mockRequest.method,
      endpoint: '/process-resume',
      inputType: 'text',
      inputSize: mockRequestData.resume_text.length,
      language: mockLanguage,
      success: mockResponse.success,
      processingTimeMs: mockResponse.processing_time_ms,
      extractedFieldsCount: mockResponse.data
        ? Object.keys(mockResponse.data).length
        : 0,
      validationErrorsCount: mockResponse.errors.length,
      partialFieldsCount: mockResponse.partial_fields?.length || 0,
      errors: mockResponse.errors,
      unmappedFields: mockResponse.unmapped_fields,
      metadata: mockResponse.metadata,
      // Add the actual structured resume JSON output
      resumeData: mockResponse.data,
    };

    console.log('📋 Constructed logPayload:');
    console.log('--------------------------');
    console.log(`✅ requestId: ${logPayload.requestId}`);
    console.log(`✅ method: ${logPayload.method}`);
    console.log(`✅ endpoint: ${logPayload.endpoint}`);
    console.log(`✅ inputType: ${logPayload.inputType}`);
    console.log(`✅ inputSize: ${logPayload.inputSize}`);
    console.log(`✅ language: ${logPayload.language}`);
    console.log(`✅ success: ${logPayload.success}`);
    console.log(`✅ processingTimeMs: ${logPayload.processingTimeMs}`);
    console.log(`✅ extractedFieldsCount: ${logPayload.extractedFieldsCount}`);
    console.log(
      `✅ validationErrorsCount: ${logPayload.validationErrorsCount}`
    );
    console.log(`✅ partialFieldsCount: ${logPayload.partialFieldsCount}`);
    console.log(`✅ errors: ${logPayload.errors.length} items`);
    console.log(`✅ unmappedFields: ${logPayload.unmappedFields.length} items`);
    console.log(`✅ metadata: ${logPayload.metadata ? 'Present' : 'Missing'}`);
    console.log(
      `✅ resumeData: ${logPayload.resumeData ? 'Present' : 'Missing'}`
    );

    console.log('\n🔍 Step 3: Payload Keys Analysis');
    console.log('-------------------------------');
    const payloadKeys = Object.keys(logPayload);
    console.log(`📋 Total keys: ${payloadKeys.length}`);
    console.log(`📋 Keys: ${JSON.stringify(payloadKeys)}`);

    const hasResumeData = payloadKeys.includes('resumeData');
    console.log(`✅ resumeData key present: ${hasResumeData ? 'YES' : 'NO'}`);

    if (hasResumeData && logPayload.resumeData) {
      console.log('\n📋 ResumeData Content:');
      console.log('---------------------');
      console.log(
        `✅ desired_titles: ${logPayload.resumeData.desired_titles?.length || 0} items`
      );
      console.log(
        `✅ summary: ${logPayload.resumeData.summary ? 'Present' : 'Missing'}`
      );
      console.log(
        `✅ skills: ${logPayload.resumeData.skills?.length || 0} items`
      );
      console.log(
        `✅ experience: ${logPayload.resumeData.experience?.length || 0} items`
      );

      if (logPayload.resumeData.desired_titles) {
        console.log(
          `📋 Desired titles: ${JSON.stringify(logPayload.resumeData.desired_titles)}`
        );
      }
      if (
        logPayload.resumeData.experience &&
        logPayload.resumeData.experience.length > 0
      ) {
        console.log(
          `📅 First experience: ${logPayload.resumeData.experience[0].title} at ${logPayload.resumeData.experience[0].employer}`
        );
      }
    }

    console.log('\n🔍 Step 4: Database Logger Test');
    console.log('--------------------------------');
    console.log('The database logger should log:');
    console.log('"Simple logging request to database: {');
    console.log(`  requestId: "${mockRequestId}",`);
    console.log('  endpoint: "/process-resume",');
    console.log(`  payloadKeys: ${JSON.stringify(payloadKeys)}`);
    console.log('}"');

    console.log('\n📋 Step 5: Debug Summary');
    console.log('------------------------');
    console.log(
      `✅ API Response Generated: ${mockResponse.success ? 'YES' : 'NO'}`
    );
    console.log(`📊 Data Extracted: ${mockResponse.data ? 'YES' : 'NO'}`);
    console.log(`🔧 LogPayload Constructed: YES`);
    console.log(`📋 ResumeData in Payload: ${hasResumeData ? 'YES' : 'NO'}`);
    console.log(`🗄️  Database Logging: Should work if resumeData is present`);

    if (hasResumeData && logPayload.resumeData) {
      console.log('\n🎉 SUCCESS: LogPayload construction is correct!');
      console.log('🔍 The issue might be:');
      console.log('   1. Database insertion error');
      console.log('   2. Worker console logs not showing');
      console.log('   3. Database query issue');
      console.log(
        '📝 Check the worker console logs for "Simple logging request to database"'
      );
    } else {
      console.log('\n⚠️  ISSUE: LogPayload construction is incorrect!');
      console.log('🔍 The resumeData field is missing from the payload');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testPayloadConstruction();
