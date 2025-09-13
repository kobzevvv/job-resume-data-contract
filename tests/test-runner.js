#!/usr/bin/env node

/**
 * Resume Processor Worker Test Suite
 * Tests the deployed worker with sample resumes and validates responses
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const WORKER_URL =
  process.env.WORKER_URL ||
  'https://resume-processor-worker.dev-a96.workers.dev';
const SAMPLE_RESUMES_DIR = join(__dirname, 'sample-resumes');

// Test results
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

/**
 * Test result logger
 */
function logTest(name, passed, details = '') {
  totalTests++;
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${name}`);

  if (details) {
    console.log(`   ${details}`);
  }

  if (passed) {
    passedTests++;
  } else {
    failedTests++;
    console.log('   ❗ This test failed');
  }
  console.log('');
}

/**
 * Test the health endpoint
 */
async function testHealthEndpoint() {
  console.log('🔍 Testing Health Endpoint...\n');

  try {
    const response = await fetch(`${WORKER_URL}/health`);
    const data = await response.json();

    logTest('Health endpoint returns 200', response.status === 200);
    logTest(
      'Health endpoint returns healthy status',
      data.status === 'healthy'
    );
    logTest('Health endpoint includes version', !!data.version);
    logTest(
      'Health endpoint includes endpoints array',
      Array.isArray(data.endpoints)
    );
    logTest(
      'Health endpoint includes AI status',
      ['available', 'unavailable'].includes(data.ai_status)
    );
  } catch (error) {
    logTest('Health endpoint is accessible', false, `Error: ${error.message}`);
  }
}

/**
 * Process a single resume and validate response
 */
async function processResume(resumeFile, resumeText, language = 'en') {
  console.log(`🧪 Testing Resume: ${resumeFile} (Language: ${language})\n`);

  try {
    const startTime = Date.now();
    const requestBody = {
      resume_text: resumeText,
      options: {
        include_unmapped: true,
        strict_validation: false,
      },
    };

    // Add language parameter if not English
    if (language !== 'en') {
      requestBody.language = language;
    }

    const response = await fetch(`${WORKER_URL}/process-resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const processingTime = Date.now() - startTime;
    const data = await response.json();

    // Basic response validation
    logTest(`${resumeFile}: Returns 200 status`, response.status === 200);
    logTest(
      `${resumeFile}: Response has correct structure`,
      typeof data === 'object' &&
        typeof data.success === 'boolean' &&
        Array.isArray(data.unmapped_fields) &&
        Array.isArray(data.errors) &&
        typeof data.processing_time_ms === 'number'
    );

    logTest(
      `${resumeFile}: Processing time reasonable`,
      processingTime < 90000,
      `Took ${processingTime}ms`
    );

    // Success-specific validation
    if (data.success && data.data) {
      logTest(`${resumeFile}: Successful processing`, true);

      // Validate required fields
      const requiredFields = [
        'desired_titles',
        'summary',
        'skills',
        'experience',
      ];
      for (const field of requiredFields) {
        logTest(
          `${resumeFile}: Has ${field}`,
          data.data[field] !== undefined,
          data.data[field]
            ? `Found: ${Array.isArray(data.data[field]) ? data.data[field].length + ' items' : 'present'}`
            : 'Missing'
        );
      }

      // Validate data types
      logTest(
        `${resumeFile}: desired_titles is array`,
        Array.isArray(data.data.desired_titles)
      );
      logTest(
        `${resumeFile}: summary is string`,
        typeof data.data.summary === 'string'
      );
      logTest(
        `${resumeFile}: skills is array`,
        Array.isArray(data.data.skills)
      );
      logTest(
        `${resumeFile}: experience is array`,
        Array.isArray(data.data.experience)
      );

      // Content validation
      if (data.data.desired_titles && data.data.desired_titles.length > 0) {
        logTest(
          `${resumeFile}: Has job titles`,
          true,
          `Found: ${data.data.desired_titles.join(', ')}`
        );
      }

      if (data.data.skills && data.data.skills.length > 0) {
        const skillNames = data.data.skills.map(skill =>
          typeof skill === 'string' ? skill : skill.name
        );
        logTest(
          `${resumeFile}: Has skills`,
          true,
          `Found ${skillNames.length} skills: ${skillNames.slice(0, 3).join(', ')}${skillNames.length > 3 ? '...' : ''}`
        );
      }

      if (data.data.experience && data.data.experience.length > 0) {
        logTest(
          `${resumeFile}: Has work experience`,
          true,
          `Found ${data.data.experience.length} positions`
        );
      }
    } else {
      logTest(
        `${resumeFile}: Processing failed`,
        false,
        `Errors: ${data.errors.join(', ')}`
      );
    }

    // Log unmapped fields if any
    if (data.unmapped_fields && data.unmapped_fields.length > 0) {
      console.log(`   ℹ️  Unmapped fields: ${data.unmapped_fields.join(', ')}`);
    }

    console.log(
      `   ⏱️  Processing time: ${data.processing_time_ms}ms (Network + Processing: ${processingTime}ms)`
    );
    console.log('');
  } catch (error) {
    logTest(
      `${resumeFile}: API call successful`,
      false,
      `Error: ${error.message}`
    );
  }
}

/**
 * Test invalid requests
 */
async function testErrorHandling() {
  console.log('🔍 Testing Error Handling...\n');

  // Test empty request
  try {
    const response = await fetch(`${WORKER_URL}/process-resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    logTest('Empty request returns 400', response.status === 400);
  } catch (error) {
    logTest('Empty request handled', false, error.message);
  }

  // Test invalid JSON
  try {
    const response = await fetch(`${WORKER_URL}/process-resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json',
    });

    logTest('Invalid JSON returns 400', response.status === 400);
  } catch (error) {
    logTest('Invalid JSON handled', false, error.message);
  }

  // Test short resume text
  try {
    const response = await fetch(`${WORKER_URL}/process-resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume_text: 'too short' }),
    });

    logTest('Short resume text returns 400', response.status === 400);
  } catch (error) {
    logTest('Short resume text handled', false, error.message);
  }

  // Test wrong HTTP method
  try {
    const response = await fetch(`${WORKER_URL}/process-resume`, {
      method: 'GET',
    });

    logTest('Wrong HTTP method returns 405', response.status === 405);
  } catch (error) {
    logTest('Wrong HTTP method handled', false, error.message);
  }

  // Test non-existent endpoint
  try {
    const response = await fetch(`${WORKER_URL}/non-existent-endpoint`);

    logTest('Non-existent endpoint returns 404', response.status === 404);
  } catch (error) {
    logTest('Non-existent endpoint handled', false, error.message);
  }
}

/**
 * Detect language from filename or content
 */
function detectLanguage(filename, content) {
  // Check filename for language indicators
  if (filename.includes('russian') || filename.includes('ru-')) {
    return 'ru';
  }

  // Check content for Cyrillic characters
  const cyrillicPattern = /[а-яё]/i;
  if (cyrillicPattern.test(content)) {
    return 'ru';
  }

  return 'en';
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🚀 Resume Processor Worker Test Suite');
  console.log('=====================================');
  console.log(`Testing worker at: ${WORKER_URL}`);
  console.log('');

  // Test health endpoint
  await testHealthEndpoint();

  // Test sample resumes
  console.log('📄 Testing Sample Resumes...\n');

  try {
    const resumeFiles = readdirSync(SAMPLE_RESUMES_DIR).filter(file =>
      file.endsWith('.txt')
    );

    for (const resumeFile of resumeFiles) {
      const resumePath = join(SAMPLE_RESUMES_DIR, resumeFile);
      const resumeText = readFileSync(resumePath, 'utf8');
      const language = detectLanguage(resumeFile, resumeText);
      await processResume(resumeFile, resumeText, language);
    }
  } catch (error) {
    logTest('Sample resumes directory accessible', false, error.message);
  }

  // Test error handling
  await testErrorHandling();

  // Summary
  console.log('📊 Test Results Summary');
  console.log('=======================');
  console.log(`Total tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(
    `Success rate: ${totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%`
  );

  if (failedTests > 0) {
    console.log(
      '\n❌ Some tests failed. Please check the output above for details.'
    );
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
