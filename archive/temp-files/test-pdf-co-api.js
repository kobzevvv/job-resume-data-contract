#!/usr/bin/env node

/**
 * Test PDF.co API Key Directly
 * Verify the API key works before testing the worker
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const PDF_FILE = join(
  __dirname,
  'tests',
  'sample-resumes',
  'pdf',
  'international',
  'Машин Георгий Павлович.pdf'
);

console.log('🧪 Test PDF.co API Key Directly');
console.log('==============================\n');

/**
 * Test PDF.co API directly
 */
async function testPdfCoApi() {
  try {
    // You'll need to set this manually for testing
    const apiKey = process.env.PDF_CO_API_KEY || 'YOUR_PDF_CO_API_KEY_HERE';

    if (!apiKey) {
      console.error('❌ PDF_CO_API_KEY not found in environment variables');
      console.log(
        '💡 Make sure your .env file contains: PDF_CO_API_KEY=your_key_here'
      );
      return;
    }

    console.log('📋 Step 1: Loading PDF File');
    console.log('---------------------------');

    // Read the PDF file
    const pdfBuffer = readFileSync(PDF_FILE);
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

    console.log(`📄 PDF file: Машин Георгий Павлович.pdf`);
    console.log(`📊 PDF size: ${pdfBuffer.length} bytes`);
    console.log(
      `🔑 API Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`
    );
    console.log(`📝 Base64 size: ${pdfBase64.length} characters\n`);

    console.log('🚀 Step 2: Testing PDF.co API');
    console.log('----------------------------');
    console.log('📤 Sending PDF to PDF.co for text extraction...\n');

    const startTime = Date.now();
    const response = await fetch('https://api.pdf.co/v1/pdf/convert/to/text', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: pdfBase64,
        inline: true,
        password: '',
      }),
    });

    const processingTime = Date.now() - startTime;
    console.log(`⏱️  Request processing time: ${processingTime}ms`);
    console.log(
      `📊 Response status: ${response.status} ${response.statusText}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ PDF.co API request failed:', errorText);
      console.log('\n💡 Possible issues:');
      console.log('- Invalid API key');
      console.log('- API key not activated');
      console.log('- Account limits exceeded');
      console.log('- Network connectivity issues');
      return;
    }

    const result = await response.json();

    if (!result.success) {
      console.error('❌ PDF.co extraction failed:', result.message);
      return;
    }

    const extractedText = result.body;

    console.log('✅ PDF text extracted successfully!');
    console.log(`📝 Extracted text length: ${extractedText.length} characters`);
    console.log(`📊 Text preview (first 200 chars):`);
    console.log(`"${extractedText.substring(0, 200)}..."`);

    /**
     * Summary
     */
    console.log('\n📋 Step 3: Test Summary');
    console.log('----------------------');
    console.log('✅ PDF.co API Key: WORKING');
    console.log('✅ PDF Processing: SUCCESS');
    console.log('✅ Text Extraction: SUCCESS');
    console.log(`⏱️  Processing Time: ${processingTime}ms`);

    console.log('\n🎯 Next Steps:');
    console.log('=============');
    console.log('1. ✅ API key is working correctly');
    console.log('2. 🔧 Check Cloudflare Worker secret configuration');
    console.log('3. 🚀 Test the complete PDF processing endpoint');
    console.log('4. 🗄️  Verify database logging with PDF data');

    console.log('\n💡 Worker Secret Setup:');
    console.log('======================');
    console.log(
      'The API key works, so the issue is likely in the Cloudflare Worker secret configuration.'
    );
    console.log('Try:');
    console.log(
      '- Check if the secret is set correctly in Cloudflare dashboard'
    );
    console.log('- Redeploy the worker after setting the secret');
    console.log('- Verify the secret name matches the code (PDF_CO_API_KEY)');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testPdfCoApi();
