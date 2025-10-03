#!/usr/bin/env node

/**
 * Comprehensive PDF.co API Endpoints Test
 * Test all PDF.co endpoints to verify they work correctly
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

console.log('🧪 Comprehensive PDF.co API Endpoints Test');
console.log('==========================================\n');

/**
 * Test PDF.co API endpoints comprehensively
 */
async function testPdfCoEndpoints() {
  try {
    // Get API key from environment or prompt user
    const apiKey = process.env.PDF_CO_API_KEY || 'YOUR_PDF_CO_API_KEY_HERE';

    if (apiKey === 'YOUR_PDF_CO_API_KEY_HERE') {
      console.log('⚠️  PDF.co API key not found in environment variables');
      console.log(
        '💡 Please set PDF_CO_API_KEY environment variable or update the script'
      );
      console.log('📝 You can get a free API key at https://pdf.co');
      console.log('🔑 Free tier: 1000 requests/month');
      return;
    }

    console.log('📋 Step 1: Loading Test PDF File');
    console.log('--------------------------------');

    // Read the PDF file
    const pdfBuffer = readFileSync(PDF_FILE);
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

    console.log(`📄 PDF file: Машин Георгий Павлович.pdf`);
    console.log(`📊 PDF size: ${pdfBuffer.length} bytes`);
    console.log(
      `🔑 API Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`
    );
    console.log(`📝 Base64 size: ${pdfBase64.length} characters\n`);

    console.log('🚀 Step 2: Testing PDF.co API Endpoints');
    console.log('=======================================\n');

    // Test 1: Direct Text Extraction (Base64)
    console.log('📤 Test 1: Direct Text Extraction (Base64)');
    console.log('------------------------------------------');
    await testDirectTextExtraction(apiKey, pdfBase64);

    // Test 2: File Upload + Text Extraction
    console.log('\n📤 Test 2: File Upload + Text Extraction');
    console.log('----------------------------------------');
    await testFileUploadAndExtraction(apiKey, pdfBuffer);

    // Test 3: API Status Check
    console.log('\n📤 Test 3: API Status Check');
    console.log('----------------------------');
    await testApiStatus(apiKey);

    // Test 4: Account Info
    console.log('\n📤 Test 4: Account Information');
    console.log('-----------------------------');
    await testAccountInfo(apiKey);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

/**
 * Test direct text extraction using base64
 */
async function testDirectTextExtraction(apiKey, pdfBase64) {
  try {
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
    console.log(`⏱️  Processing time: ${processingTime}ms`);
    console.log(
      `📊 Response status: ${response.status} ${response.statusText}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Direct text extraction failed:', errorText);
      return false;
    }

    const result = await response.json();

    if (!result.success) {
      console.error('❌ PDF.co extraction failed:', result.message);
      return false;
    }

    const extractedText = result.body;
    console.log('✅ Direct text extraction successful!');
    console.log(`📝 Extracted text length: ${extractedText.length} characters`);
    console.log(`📊 Text preview (first 200 chars):`);
    console.log(`"${extractedText.substring(0, 200)}..."`);

    return true;
  } catch (error) {
    console.error('❌ Direct text extraction error:', error.message);
    return false;
  }
}

/**
 * Test file upload + text extraction workflow
 */
async function testFileUploadAndExtraction(apiKey, pdfBuffer) {
  try {
    console.log('📤 Step 2a: Uploading PDF to PDF.co...');

    // Step 1: Upload PDF
    const uploadFormData = new FormData();
    uploadFormData.append(
      'file',
      new Blob([pdfBuffer], { type: 'application/pdf' }),
      'Машин Георгий Павлович.pdf'
    );

    const uploadResponse = await fetch('https://api.pdf.co/v1/file/upload', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
      },
      body: uploadFormData,
    });

    console.log(
      `📊 Upload status: ${uploadResponse.status} ${uploadResponse.statusText}`
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ PDF.co upload failed:', errorText);
      return false;
    }

    const uploadResult = await uploadResponse.json();
    console.log('📤 Upload response:', JSON.stringify(uploadResult, null, 2));

    if (!uploadResult.success) {
      console.error('❌ PDF.co upload unsuccessful:', uploadResult.message);
      return false;
    }

    // Get file URL
    const fileUrl =
      uploadResult.url ||
      uploadResult.fileUrl ||
      uploadResult.file_url ||
      uploadResult.downloadUrl;

    if (!fileUrl) {
      console.error(
        '❌ No URL returned from upload. Available fields:',
        Object.keys(uploadResult)
      );
      return false;
    }

    console.log(`✅ File uploaded successfully: ${fileUrl}`);

    // Step 2: Extract text from uploaded file
    console.log('📤 Step 2b: Extracting text from uploaded file...');

    const extractResponse = await fetch(
      'https://api.pdf.co/v1/pdf/convert/to/text',
      {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: fileUrl,
          inline: true,
          password: '',
        }),
      }
    );

    console.log(
      `📊 Extract status: ${extractResponse.status} ${extractResponse.statusText}`
    );

    if (!extractResponse.ok) {
      const errorText = await extractResponse.text();
      console.error('❌ Text extraction failed:', errorText);
      return false;
    }

    const extractResult = await extractResponse.json();

    if (!extractResult.success) {
      console.error('❌ Text extraction unsuccessful:', extractResult.message);
      return false;
    }

    const extractedText = extractResult.body;
    console.log('✅ Text extraction from uploaded file successful!');
    console.log(`📝 Extracted text length: ${extractedText.length} characters`);
    console.log(`📊 Text preview (first 200 chars):`);
    console.log(`"${extractedText.substring(0, 200)}..."`);

    return true;
  } catch (error) {
    console.error('❌ Upload + extraction error:', error.message);
    return false;
  }
}

/**
 * Test API status endpoint
 */
async function testApiStatus(apiKey) {
  try {
    const response = await fetch('https://api.pdf.co/v1/status', {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
      },
    });

    console.log(
      `📊 Status response: ${response.status} ${response.statusText}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API status check failed:', errorText);
      return false;
    }

    const result = await response.json();
    console.log('✅ API status check successful!');
    console.log('📊 Status response:', JSON.stringify(result, null, 2));

    return true;
  } catch (error) {
    console.error('❌ API status error:', error.message);
    return false;
  }
}

/**
 * Test account information endpoint
 */
async function testAccountInfo(apiKey) {
  try {
    const response = await fetch('https://api.pdf.co/v1/user/profile', {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
      },
    });

    console.log(
      `📊 Account info response: ${response.status} ${response.statusText}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Account info check failed:', errorText);
      return false;
    }

    const result = await response.json();
    console.log('✅ Account info check successful!');
    console.log('📊 Account info:', JSON.stringify(result, null, 2));

    return true;
  } catch (error) {
    console.error('❌ Account info error:', error.message);
    return false;
  }
}

/**
 * Summary and recommendations
 */
function printSummary(results) {
  console.log('\n📋 Step 3: Test Summary & Recommendations');
  console.log('==========================================\n');

  console.log('🔍 Test Results:');
  console.log(
    `✅ Direct Text Extraction: ${results.directExtraction ? 'WORKING' : 'FAILED'}`
  );
  console.log(
    `✅ File Upload + Extraction: ${results.uploadExtraction ? 'WORKING' : 'FAILED'}`
  );
  console.log(
    `✅ API Status Check: ${results.apiStatus ? 'WORKING' : 'FAILED'}`
  );
  console.log(`✅ Account Info: ${results.accountInfo ? 'WORKING' : 'FAILED'}`);

  console.log('\n💡 Recommendations:');

  if (results.directExtraction && results.uploadExtraction) {
    console.log('🎉 Both PDF.co workflows are working!');
    console.log('✅ Use direct text extraction for smaller files');
    console.log('✅ Use upload + extraction for larger files');
    console.log('✅ The current implementation should work');
  } else if (results.directExtraction) {
    console.log('⚠️  Only direct text extraction works');
    console.log('✅ Use direct text extraction approach');
    console.log('❌ Avoid file upload workflow');
  } else if (results.uploadExtraction) {
    console.log('⚠️  Only upload + extraction works');
    console.log('✅ Use upload + extraction workflow');
    console.log('❌ Avoid direct text extraction');
  } else {
    console.log('❌ PDF.co API is not working properly');
    console.log('🔧 Check API key validity');
    console.log('🔧 Check account limits');
    console.log('🔧 Consider alternative PDF processing services');
  }

  console.log('\n🚀 Next Steps:');
  console.log('==============');
  console.log('1. Update worker implementation based on working endpoints');
  console.log('2. Test the updated worker with PDF files');
  console.log('3. Verify database logging with PDF data');
  console.log('4. Deploy to production if tests pass');
}

// Run the comprehensive test
testPdfCoEndpoints().then(() => {
  console.log('\n🎯 PDF.co API endpoints test completed!');
  console.log('Check the results above to determine the best approach.');
});
