#!/usr/bin/env node

/**
 * Debug PDF.co Text Extraction Response
 * Check what's actually returned by the text extraction endpoint
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

console.log('🔍 Debug PDF.co Text Extraction Response');
console.log('========================================\n');

/**
 * Debug the text extraction response
 */
async function debugTextExtraction() {
  try {
    const apiKey = process.env.PDF_CO_API_KEY || 'YOUR_PDF_CO_API_KEY_HERE';

    if (apiKey === 'YOUR_PDF_CO_API_KEY_HERE') {
      console.log('⚠️  PDF.co API key not found in environment variables');
      return;
    }

    console.log('📋 Step 1: Upload PDF File');
    console.log('-------------------------');

    const pdfBuffer = readFileSync(PDF_FILE);
    console.log(`📄 PDF file: Машин Георгий Павлович.pdf`);
    console.log(`📊 PDF size: ${pdfBuffer.length} bytes\n`);

    // Upload the file first
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

    const uploadResult = await uploadResponse.json();
    console.log('✅ Upload successful');
    console.log(`📊 File URL: ${uploadResult.url}\n`);

    console.log('🔍 Step 2: Debug Text Extraction Response');
    console.log('----------------------------------------');

    // Try text extraction with detailed logging
    const extractResponse = await fetch(
      'https://api.pdf.co/v1/pdf/convert/to/text',
      {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: uploadResult.url,
          inline: true,
          password: '',
        }),
      }
    );

    console.log(
      `📊 Response status: ${extractResponse.status} ${extractResponse.statusText}`
    );
    console.log(
      `📊 Response headers:`,
      Object.fromEntries(extractResponse.headers.entries())
    );

    const responseText = await extractResponse.text();
    console.log(`📊 Raw response text:`, responseText);

    try {
      const responseJson = JSON.parse(responseText);
      console.log(
        `📊 Parsed JSON response:`,
        JSON.stringify(responseJson, null, 2)
      );

      // Check different possible success indicators
      console.log('\n🔍 Response Analysis:');
      console.log('====================');
      console.log(`✅ success field: ${responseJson.success}`);
      console.log(`✅ error field: ${responseJson.error}`);
      console.log(`✅ status field: ${responseJson.status}`);
      console.log(`✅ message field: ${responseJson.message}`);
      console.log(`✅ body field exists: ${responseJson.body ? 'YES' : 'NO'}`);
      console.log(`✅ text field exists: ${responseJson.text ? 'YES' : 'NO'}`);
      console.log(
        `✅ content field exists: ${responseJson.content ? 'YES' : 'NO'}`
      );

      if (responseJson.body) {
        console.log(`📝 Body length: ${responseJson.body.length} characters`);
        console.log(
          `📝 Body preview: "${responseJson.body.substring(0, 200)}..."`
        );
      }

      if (responseJson.text) {
        console.log(`📝 Text length: ${responseJson.text.length} characters`);
        console.log(
          `📝 Text preview: "${responseJson.text.substring(0, 200)}..."`
        );
      }

      if (responseJson.content) {
        console.log(
          `📝 Content length: ${responseJson.content.length} characters`
        );
        console.log(
          `📝 Content preview: "${responseJson.content.substring(0, 200)}..."`
        );
      }
    } catch (parseError) {
      console.error('❌ Failed to parse JSON response:', parseError.message);
    }
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the debug
debugTextExtraction().then(() => {
  console.log('\n🎯 Debug completed!');
});
