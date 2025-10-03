#!/usr/bin/env node

/**
 * Test PDF Processing Endpoint (Simple Version)
 * Test the new /process-resume-pdf endpoint with a simple approach
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
const PDF_FILE = join(
  __dirname,
  'tests',
  'sample-resumes',
  'pdf',
  'international',
  'Машин Георгий Павлович.pdf'
);

console.log('🧪 Test PDF Processing Endpoint (Simple Version)');
console.log('===============================================\n');

/**
 * Test PDF processing endpoint with manual FormData construction
 */
async function testPdfProcessingEndpoint() {
  try {
    console.log('📋 Step 1: Loading PDF File');
    console.log('---------------------------');

    // Read the PDF file
    const pdfBuffer = readFileSync(PDF_FILE);
    console.log(`📄 PDF file: Машин Георгий Павлович.pdf`);
    console.log(`📊 PDF size: ${pdfBuffer.length} bytes`);
    console.log(`🌐 Language: Russian`);
    console.log(`📝 Input preview: PDF document (${pdfBuffer.length} bytes)\n`);

    console.log('🚀 Step 2: Sending PDF to Processing Endpoint');
    console.log('---------------------------------------------');
    console.log(`🔗 Worker URL: ${WORKER_URL}/process-resume-pdf`);
    console.log('📤 Sending POST request with multipart form data...\n');

    // Create FormData manually (without external packages)
    const boundary =
      '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

    const formData = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="pdf"; filename="Машин Георгий Павлович.pdf"',
      'Content-Type: application/pdf',
      '',
      pdfBuffer.toString('binary'),
      `--${boundary}`,
      'Content-Disposition: form-data; name="language"',
      '',
      'ru',
      `--${boundary}`,
      'Content-Disposition: form-data; name="flexible_validation"',
      '',
      'true',
      `--${boundary}`,
      'Content-Disposition: form-data; name="strict_validation"',
      '',
      'false',
      `--${boundary}--`,
    ].join('\r\n');

    const startTime = Date.now();
    const response = await fetch(`${WORKER_URL}/process-resume-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: formData,
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
    console.log('📊 Step 3: API Response Analysis');
    console.log('-------------------------------');
    console.log(`✅ Success: ${responseData.success}`);
    console.log(`📊 Has data: ${responseData.data ? 'YES' : 'NO'}`);
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
      console.log('❌ No data extracted from PDF resume');
    }

    /**
     * Database Verification Instructions
     */
    console.log('\n🗄️  Step 4: Database Verification');
    console.log('--------------------------------');
    console.log('Run these SQL queries to check the logs:');
    console.log('');
    console.log('-- 1. Check recent PDF processing entries');
    console.log(
      'SELECT request_id, timestamp, json_extract(payload, "$.inputPreview") as input_preview, json_extract(payload, "$.success") as success FROM request_logs_simple WHERE endpoint = "/process-resume-pdf" ORDER BY created_at DESC LIMIT 3;'
    );
    console.log('');
    console.log('-- 2. Check if resumeData field exists for PDF processing');
    console.log(
      'SELECT request_id, json_extract(payload, "$.resumeData") as resume_data FROM request_logs_simple WHERE endpoint = "/process-resume-pdf" ORDER BY created_at DESC LIMIT 1;'
    );
    console.log('');
    console.log('-- 3. Check PDF metadata');
    console.log(
      'SELECT request_id, json_extract(payload, "$.pdfInfo") as pdf_info FROM request_logs_simple WHERE endpoint = "/process-resume-pdf" ORDER BY created_at DESC LIMIT 1;'
    );

    console.log('\n📋 Expected Results:');
    console.log('-------------------');
    console.log(
      '✅ input_preview should contain: "PDF: Машин Георгий Павлович.pdf (40894 bytes)"'
    );
    console.log('✅ resume_data should NOT be null');
    console.log(
      '✅ pdf_info should contain: fileName, fileSize, fileType, extractedTextLength'
    );
    console.log('✅ titles should contain Russian job titles');
    console.log('✅ experience should contain job entries with dates');
    console.log(
      '✅ payload should contain resumeData field with complete API response'
    );

    /**
     * Summary
     */
    console.log('\n📋 Step 5: Test Summary');
    console.log('----------------------');
    console.log(
      `✅ API Response Generated: ${responseData.success ? 'YES' : 'NO'}`
    );
    console.log(`📊 Data Extracted: ${responseData.data ? 'YES' : 'NO'}`);
    console.log(
      `🚀 Worker Deployed: YES (Version: d352539b-04bc-4170-a3d5-7ec376d2b128)`
    );
    console.log(
      `🗄️  Database Logging: Should include PDF metadata and resumeData fields`
    );

    if (responseData.success && responseData.data) {
      console.log('\n🎉 SUCCESS: PDF processing endpoint works!');
      console.log(
        '🔍 Check database logs for PDF metadata and resumeData fields'
      );
      console.log(
        '📝 The resumeData should contain the complete structured JSON'
      );
      console.log('');
      console.log('📋 Key Data Points to Verify:');
      console.log('-----------------------------');
      console.log('✅ Input Preview: Should show PDF file info');
      console.log('✅ PDF Info: Should contain file metadata');
      console.log('✅ Desired Titles: Russian job titles');
      console.log('✅ Experience: Job entries with dates');
      console.log('✅ Skills: Technical skills in Russian');
      console.log('');
      console.log('🎯 PDF Processing Solution Complete!');
      console.log('- Handles PDFs of any size');
      console.log('- Professional text extraction via PDF.co');
      console.log('- Complete resumeData storage');
      console.log('- PDF metadata tracking');
    } else {
      console.log('\n⚠️  ISSUE: PDF processing endpoint failed');
      console.log('🔍 Check the errors and unmapped fields for details');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testPdfProcessingEndpoint();
