#!/usr/bin/env node

/**
 * Debug PDF.co API Request - Production Worker
 * Check the exact error from PDF.co API
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const WORKER_URL = 'https://resume-processor-production.dev-a96.workers.dev';
const PDF_FILE = join(
  __dirname,
  'tests',
  'sample-resumes',
  'pdf',
  'international',
  'Машин Георгий Павлович.pdf'
);

console.log('🧪 Debug PDF.co API Request - Production Worker');
console.log('==============================================\n');

/**
 * Test PDF processing endpoint and capture detailed error
 */
async function debugPdfCoRequest() {
  try {
    console.log('📋 Step 1: Loading PDF File');
    console.log('---------------------------');

    // Read the PDF file
    const pdfBuffer = readFileSync(PDF_FILE);
    console.log(`📄 PDF file: Машин Георгий Павлович.pdf`);
    console.log(`📊 PDF size: ${pdfBuffer.length} bytes\n`);

    console.log('🚀 Step 2: Sending PDF to Production Worker');
    console.log('------------------------------------------');
    console.log(`🔗 Worker URL: ${WORKER_URL}/process-resume-pdf`);
    console.log('📤 Sending POST request with multipart form data...\n');

    // Create FormData manually
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

    const responseText = await response.text();
    console.log(`📝 Response body: ${responseText}`);

    if (!response.ok) {
      console.log('\n🔍 Error Analysis:');
      console.log('------------------');

      try {
        const errorData = JSON.parse(responseText);
        console.log(`❌ Error: ${errorData.error}`);
        console.log(`🆔 Request ID: ${errorData.request_id}`);
        console.log(`⏰ Timestamp: ${errorData.timestamp}`);

        if (errorData.error.includes('400 Bad Request')) {
          console.log('\n💡 400 Bad Request Analysis:');
          console.log('============================');
          console.log(
            "This suggests the API key is working, but there's an issue with the request format."
          );
          console.log('Possible causes:');
          console.log('1. Invalid base64 encoding');
          console.log('2. Missing required parameters');
          console.log('3. Incorrect request structure');
          console.log('4. File format issues');
          console.log('5. API endpoint changes');

          console.log('\n🔧 Next Steps:');
          console.log('=============');
          console.log('1. Check PDF.co API documentation for exact format');
          console.log('2. Test with a smaller PDF file');
          console.log('3. Verify the base64 encoding is correct');
          console.log('4. Check if the API endpoint URL is correct');
        }
      } catch (parseError) {
        console.log('❌ Could not parse error response as JSON');
        console.log(`📝 Raw response: ${responseText}`);
      }

      return;
    }

    const responseData = JSON.parse(responseText);
    console.log('✅ Request completed successfully!');
    console.log(`📊 Success: ${responseData.success}`);
    console.log(`📊 Has data: ${responseData.data ? 'YES' : 'NO'}`);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the debug
debugPdfCoRequest();
