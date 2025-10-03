#!/usr/bin/env node

/**
 * Minimal Resume Validation Test
 * Tests specific extraction of work dates and titles from simple resume text
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
const MINIMAL_RESUME_PATH = join(
  __dirname,
  'sample-resumes',
  'minimal-test.txt'
);

/**
 * Test minimal resume extraction
 */
async function testMinimalResumeExtraction() {
  console.log('🧪 Testing Minimal Resume Extraction');
  console.log('=====================================\n');

  try {
    // Read minimal test resume
    const minimalResume = readFileSync(MINIMAL_RESUME_PATH, 'utf8').trim();
    console.log(`📄 Test Resume: "${minimalResume}"\n`);

    // Process with worker
    const startTime = Date.now();
    const response = await fetch(`${WORKER_URL}/process-resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resume_text: minimalResume,
        options: {
          strict_validation: false,
          flexible_validation: true,
        },
      }),
    });

    const processingTime = Date.now() - startTime;
    const data = await response.json();

    console.log(`⏱️  Processing time: ${processingTime}ms`);
    console.log(`📊 Response status: ${response.status}\n`);

    // Validate basic response structure
    if (!data.success) {
      console.log('❌ Resume processing failed');
      console.log('Errors:', data.errors);
      return false;
    }

    if (!data.data) {
      console.log('❌ No data returned');
      return false;
    }

    console.log('✅ Resume processed successfully\n');

    // Test specific extractions
    const tests = [
      {
        name: 'Job Titles Extraction',
        test: () => {
          const titles = data.data.desired_titles || [];
          const hasEngineer = titles.some(
            title =>
              title.toLowerCase().includes('engineer') ||
              title.toLowerCase().includes('developer')
          );
          return {
            passed: hasEngineer,
            details: `Found titles: ${titles.join(', ')}`,
            expected: 'Should contain "engineer" or "developer"',
          };
        },
      },
      {
        name: 'Work Experience Entries',
        test: () => {
          const experience = data.data.experience || [];
          return {
            passed: experience.length >= 1,
            details: `Found ${experience.length} experience entries`,
            expected: 'At least 1 work experience entry',
          };
        },
      },
      {
        name: 'Start Dates Extraction',
        test: () => {
          const experience = data.data.experience || [];
          const startDates = experience.map(exp => exp.start).filter(Boolean);
          const hasValidDates = startDates.some(
            date => /^\d{4}-\d{2}$/.test(date) || /^\d{4}$/.test(date)
          );
          return {
            passed: hasValidDates,
            details: `Start dates: ${startDates.join(', ')}`,
            expected: 'Should have dates in YYYY-MM or YYYY format',
          };
        },
      },
      {
        name: 'End Dates Extraction',
        test: () => {
          const experience = data.data.experience || [];
          const endDates = experience.map(exp => exp.end).filter(Boolean);
          const hasValidEndDates = endDates.length > 0;
          return {
            passed: hasValidEndDates,
            details: `End dates: ${endDates.join(', ')}`,
            expected: 'Should have end dates (including "present")',
          };
        },
      },
      {
        name: 'Employer Names Extraction',
        test: () => {
          const experience = data.data.experience || [];
          const employers = experience.map(exp => exp.employer).filter(Boolean);
          const hasEmployers = employers.length > 0;
          return {
            passed: hasEmployers,
            details: `Employers: ${employers.join(', ')}`,
            expected: 'Should extract employer names (TechCorp, StartupXYZ)',
          };
        },
      },
      {
        name: 'Job Titles in Experience',
        test: () => {
          const experience = data.data.experience || [];
          const titles = experience.map(exp => exp.title).filter(Boolean);
          const hasTitles = titles.length > 0;
          return {
            passed: hasTitles,
            details: `Job titles: ${titles.join(', ')}`,
            expected: 'Should extract job titles from experience',
          };
        },
      },
    ];

    let passedTests = 0;
    let totalTests = tests.length;

    console.log('🔍 Running Validation Tests:\n');

    for (const test of tests) {
      const result = test.test();
      const status = result.passed ? '✅ PASS' : '❌ FAIL';

      console.log(`${status} ${test.name}`);
      console.log(`   ${result.details}`);
      console.log(`   Expected: ${result.expected}`);

      if (result.passed) {
        passedTests++;
      }

      console.log('');
    }

    // Summary
    console.log('📊 Test Results Summary');
    console.log('=======================');
    console.log(`Total tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${totalTests - passedTests}`);
    console.log(
      `Success rate: ${Math.round((passedTests / totalTests) * 100)}%\n`
    );

    // Show full extracted data for debugging
    console.log('📋 Full Extracted Data:');
    console.log('========================');
    console.log(JSON.stringify(data.data, null, 2));

    if (passedTests === totalTests) {
      console.log('🎉 All tests passed! Resume extraction working correctly.');
      return true;
    } else {
      console.log('❌ Some tests failed. Check the extraction logic.');
      return false;
    }
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    return false;
  }
}

/**
 * Test with multiple minimal resume formats
 */
async function testMultipleFormats() {
  console.log('\n🔄 Testing Multiple Resume Formats');
  console.log('==================================\n');

  const testCases = [
    {
      name: 'Simple format',
      resume:
        'Software Engineer at TechCorp from 2020-01 to 2023-12. Currently Senior Developer at StartupXYZ since 2024-01.',
    },
    {
      name: 'With present keyword',
      resume:
        'Worked as Backend Developer at CompanyA from 2019 to 2022. Now Frontend Engineer at CompanyB since 2023-present.',
    },
    {
      name: 'Single position',
      resume:
        'Full Stack Developer at TechStartup from January 2021 to December 2023.',
    },
  ];

  let allPassed = true;

  for (const testCase of testCases) {
    console.log(`📝 Testing: ${testCase.name}`);
    console.log(`Resume: "${testCase.resume}"`);

    try {
      const response = await fetch(`${WORKER_URL}/process-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_text: testCase.resume,
          options: { strict_validation: false },
        }),
      });

      const data = await response.json();
      const hasExperience = data.success && data.data?.experience?.length > 0;

      console.log(`Result: ${hasExperience ? '✅ PASS' : '❌ FAIL'}`);
      if (hasExperience) {
        console.log(`Experience entries: ${data.data.experience.length}`);
      }
      console.log('');

      if (!hasExperience) {
        allPassed = false;
      }
    } catch (error) {
      console.log(`❌ FAIL - Error: ${error.message}\n`);
      allPassed = false;
    }
  }

  return allPassed;
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🚀 Minimal Resume Validation Test Suite');
  console.log('========================================');
  console.log(`Testing worker at: ${WORKER_URL}\n`);

  const test1Passed = await testMinimalResumeExtraction();
  const test2Passed = await testMultipleFormats();

  console.log('\n📊 Final Results');
  console.log('================');
  console.log(
    `Minimal extraction test: ${test1Passed ? '✅ PASS' : '❌ FAIL'}`
  );
  console.log(`Multiple formats test: ${test2Passed ? '✅ PASS' : '❌ FAIL'}`);

  if (test1Passed && test2Passed) {
    console.log('\n🎉 All validation tests passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Some validation tests failed.');
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
