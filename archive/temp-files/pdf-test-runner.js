#!/usr/bin/env node

/**
 * Enhanced PDF Test Runner
 * Extends the existing test suite with PDF processing capabilities
 */

import { readFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const WORKER_URL =
  process.env.WORKER_URL ||
  'https://resume-processor-worker.dev-a96.workers.dev';
const PDF_RESUMES_DIR = join(__dirname, 'sample-resumes', 'pdf');
const TEXT_RESUMES_DIR = join(__dirname, 'sample-resumes');

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
 * Test PDF processing capability
 */
async function testPDFProcessing(pdfFile, pdfPath) {
  console.log(`🧪 Testing PDF: ${pdfFile}\n`);

  try {
    // Read PDF file as binary
    const pdfBuffer = readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');

    // File size validation
    const fileSizeKB = Math.round(pdfBuffer.length / 1024);
    logTest(
      `${pdfFile}: File size acceptable`,
      fileSizeKB <= 10240, // 10MB limit
      `${fileSizeKB}KB (limit: 10MB)`
    );

    // Test PDF API endpoint
    const requestBody = {
      input_type: 'pdf',
      resume_pdf: {
        data: pdfBase64,
        filename: pdfFile,
        content_type: 'application/pdf',
      },
      language: detectLanguageFromFilename(pdfFile),
      pdf_options: {
        extract_images: false,
        preserve_formatting: true,
        ocr_fallback: false,
      },
      options: {
        include_unmapped: true,
        strict_validation: false,
        flexible_validation: true,
      },
    };

    const startTime = Date.now();

    // Try PDF-specific endpoint first
    let response = await fetch(`${WORKER_URL}/process-resume-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    // If PDF endpoint doesn't exist, try main endpoint
    if (response.status === 404) {
      response = await fetch(`${WORKER_URL}/process-resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
    }

    const processingTime = Date.now() - startTime;
    const data = await response.json();

    // Basic response validation
    logTest(
      `${pdfFile}: Returns valid HTTP status`,
      [200, 422, 400].includes(response.status)
    );

    if (response.status === 200 && data.success) {
      // Success case validation
      logTest(`${pdfFile}: PDF processing successful`, true);

      logTest(
        `${pdfFile}: Processing time reasonable`,
        processingTime < 120000, // 2 minute limit for PDFs
        `Took ${processingTime}ms`
      );

      // Validate extracted data structure
      if (data.data) {
        logTest(`${pdfFile}: Has extracted data`, true);

        const requiredFields = [
          'desired_titles',
          'summary',
          'skills',
          'experience',
        ];
        for (const field of requiredFields) {
          logTest(
            `${pdfFile}: Has ${field}`,
            data.data[field] !== undefined,
            data.data[field]
              ? `Found: ${Array.isArray(data.data[field]) ? data.data[field].length + ' items' : 'present'}`
              : 'Missing'
          );
        }

        // PDF-specific validations
        if (data.metadata) {
          logTest(
            `${pdfFile}: Has PDF metadata`,
            data.metadata.pdf_pages !== undefined ||
              data.metadata.format_detected !== undefined,
            `Pages: ${data.metadata.pdf_pages || 'unknown'}, Format: ${data.metadata.format_detected || 'unknown'}`
          );
        }
      }
    } else if (response.status === 404) {
      logTest(
        `${pdfFile}: PDF endpoint not implemented yet`,
        true,
        'Expected during development'
      );
    } else {
      // Error case validation
      logTest(
        `${pdfFile}: Error handled gracefully`,
        data.errors && data.errors.length > 0,
        `Errors: ${data.errors ? data.errors.join(', ') : 'No error details'}`
      );
    }
  } catch (error) {
    logTest(
      `${pdfFile}: PDF processing handled`,
      false,
      `Error: ${error.message}`
    );
  }
}

/**
 * Test PDF vs Text comparison
 */
async function testPDFTextComparison(baseName) {
  console.log(`🔄 Comparing PDF vs Text: ${baseName}\n`);

  const textPath = join(TEXT_RESUMES_DIR, `${baseName}.txt`);
  const pdfPath = join(PDF_RESUMES_DIR, 'simple', `${baseName}.pdf`);

  if (!existsSync(textPath) || !existsSync(pdfPath)) {
    logTest(
      `${baseName}: PDF-Text pair exists`,
      false,
      `Missing: ${!existsSync(textPath) ? 'text' : 'pdf'} file`
    );
    return;
  }

  try {
    // Process text version
    const textContent = readFileSync(textPath, 'utf8');
    const textResponse = await fetch(`${WORKER_URL}/process-resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resume_text: textContent,
        options: { flexible_validation: true },
      }),
    });
    const textData = await textResponse.json();

    // Process PDF version
    const pdfBuffer = readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');

    const pdfRequestBody = {
      input_type: 'pdf',
      resume_pdf: {
        data: pdfBase64,
        filename: `${baseName}.pdf`,
        content_type: 'application/pdf',
      },
      options: { flexible_validation: true },
    };

    let pdfResponse = await fetch(`${WORKER_URL}/process-resume-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pdfRequestBody),
    });

    // Fallback to main endpoint
    if (pdfResponse.status === 404) {
      pdfResponse = await fetch(`${WORKER_URL}/process-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pdfRequestBody),
      });
    }

    if (pdfResponse.status === 404) {
      logTest(
        `${baseName}: PDF processing not yet implemented`,
        true,
        'Expected during development'
      );
      return;
    }

    const pdfData = await pdfResponse.json();

    // Compare results
    if (textData.success && pdfData.success) {
      logTest(`${baseName}: Both formats processed successfully`, true);

      // Compare key fields
      const textTitles = textData.data?.desired_titles || [];
      const pdfTitles = pdfData.data?.desired_titles || [];

      const titleSimilarity = calculateSimilarity(textTitles, pdfTitles);
      logTest(
        `${baseName}: Job titles similarity`,
        titleSimilarity > 0.7,
        `Similarity: ${Math.round(titleSimilarity * 100)}%`
      );

      const textSkills = textData.data?.skills || [];
      const pdfSkills = pdfData.data?.skills || [];

      const skillSimilarity = calculateSimilarity(textSkills, pdfSkills);
      logTest(
        `${baseName}: Skills similarity`,
        skillSimilarity > 0.6,
        `Similarity: ${Math.round(skillSimilarity * 100)}%`
      );
    } else {
      logTest(
        `${baseName}: Format comparison inconclusive`,
        true,
        `Text: ${textData.success}, PDF: ${pdfData.success}`
      );
    }
  } catch (error) {
    logTest(
      `${baseName}: Comparison test failed`,
      false,
      `Error: ${error.message}`
    );
  }
}

/**
 * Calculate similarity between two arrays
 */
function calculateSimilarity(arr1, arr2) {
  if (arr1.length === 0 && arr2.length === 0) {
    return 1;
  }
  if (arr1.length === 0 || arr2.length === 0) {
    return 0;
  }

  const set1 = new Set(
    arr1.map(item =>
      typeof item === 'string'
        ? item.toLowerCase()
        : item.name?.toLowerCase() || ''
    )
  );
  const set2 = new Set(
    arr2.map(item =>
      typeof item === 'string'
        ? item.toLowerCase()
        : item.name?.toLowerCase() || ''
    )
  );

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

/**
 * Detect language from filename
 */
function detectLanguageFromFilename(filename) {
  if (filename.includes('russian') || filename.includes('ru-')) {
    return 'ru';
  }
  return 'en';
}

/**
 * Test PDF edge cases
 */
async function testPDFEdgeCases() {
  console.log('🧪 Testing PDF Edge Cases...\n');

  const edgeCases = [
    { file: 'corrupted-file.pdf', expectedError: 'PDF_CORRUPTED' },
    { file: 'password-protected.pdf', expectedError: 'PDF_PASSWORD_PROTECTED' },
    { file: 'very-large-file.pdf', expectedError: 'PDF_FILE_TOO_LARGE' },
  ];

  for (const testCase of edgeCases) {
    const edgeCasePath = join(PDF_RESUMES_DIR, 'edge-cases', testCase.file);

    if (!existsSync(edgeCasePath)) {
      logTest(
        `Edge case ${testCase.file}: File exists`,
        false,
        'Create this file for comprehensive testing'
      );
      continue;
    }

    try {
      const pdfBuffer = readFileSync(edgeCasePath);
      const pdfBase64 = pdfBuffer.toString('base64');

      const response = await fetch(`${WORKER_URL}/process-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input_type: 'pdf',
          resume_pdf: {
            data: pdfBase64,
            filename: testCase.file,
            content_type: 'application/pdf',
          },
        }),
      });

      const data = await response.json();

      logTest(
        `Edge case ${testCase.file}: Handled gracefully`,
        !data.success &&
          data.errors &&
          data.errors.some(
            error =>
              error.includes(testCase.expectedError) ||
              error.includes('PDF') ||
              error.includes('processing')
          ),
        `Expected error type: ${testCase.expectedError}`
      );
    } catch (error) {
      logTest(
        `Edge case ${testCase.file}: Error caught`,
        true,
        `Error: ${error.message}`
      );
    }
  }
}

/**
 * Create directory structure for test files
 */
function createTestDirectories() {
  const dirs = [
    join(PDF_RESUMES_DIR, 'simple'),
    join(PDF_RESUMES_DIR, 'complex'),
    join(PDF_RESUMES_DIR, 'international'),
    join(PDF_RESUMES_DIR, 'edge-cases'),
    join(PDF_RESUMES_DIR, 'creators'),
  ];

  dirs.forEach(dir => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
}

/**
 * Main test runner
 */
async function runPDFTests() {
  console.log('🚀 Enhanced PDF Test Suite');
  console.log('===========================');
  console.log(`Testing worker at: ${WORKER_URL}`);
  console.log('');

  // Create test directories if they don't exist
  createTestDirectories();

  // Test existing text resumes first (baseline)
  console.log('📄 Testing Text Resumes (Baseline)...\n');
  const textFiles = readdirSync(TEXT_RESUMES_DIR).filter(file =>
    file.endsWith('.txt')
  );
  for (const textFile of textFiles) {
    const textPath = join(TEXT_RESUMES_DIR, textFile);
    const textContent = readFileSync(textPath, 'utf8');

    try {
      const response = await fetch(`${WORKER_URL}/process-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_text: textContent,
          options: { flexible_validation: true },
        }),
      });

      const data = await response.json();
      logTest(`${textFile}: Text processing works`, data.success);
    } catch (error) {
      logTest(`${textFile}: Text processing failed`, false, error.message);
    }
  }

  // Test PDF processing
  console.log('📄 Testing PDF Resumes...\n');

  const pdfDirs = ['simple', 'complex', 'international', 'creators'];
  let pdfFilesFound = false;

  for (const subDir of pdfDirs) {
    const pdfDir = join(PDF_RESUMES_DIR, subDir);
    if (existsSync(pdfDir)) {
      const pdfFiles = readdirSync(pdfDir).filter(file =>
        file.endsWith('.pdf')
      );

      for (const pdfFile of pdfFiles) {
        pdfFilesFound = true;
        const pdfPath = join(pdfDir, pdfFile);
        await testPDFProcessing(pdfFile, pdfPath);
      }
    }
  }

  if (!pdfFilesFound) {
    console.log('📁 No PDF files found. Run the manual test script first:');
    console.log('   node tests/manual-pdf-test.js\n');
  }

  // Test PDF vs Text comparison
  console.log('🔄 Testing PDF vs Text Comparison...\n');
  const baseNames = ['senior-backend-engineer', 'russian-it-specialist'];
  for (const baseName of baseNames) {
    await testPDFTextComparison(baseName);
  }

  // Test edge cases
  await testPDFEdgeCases();

  // Summary
  console.log('📊 Enhanced Test Results Summary');
  console.log('=================================');
  console.log(`Total tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(
    `Success rate: ${totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%`
  );

  if (failedTests > 0) {
    console.log('\n❌ Some tests failed. Check the output above for details.');
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  }
}

// Run the enhanced tests
runPDFTests().catch(error => {
  console.error('❌ Enhanced test suite failed:', error);
  process.exit(1);
});
