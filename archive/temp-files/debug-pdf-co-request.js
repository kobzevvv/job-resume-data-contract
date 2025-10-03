#!/usr/bin/env node

/**
 * Debug PDF.co API Request Format
 * Test different request formats to find the issue
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

console.log('🧪 Debug PDF.co API Request Format');
console.log('=================================\n');

/**
 * Test different PDF.co API request formats
 */
async function debugPdfCoRequest() {
  try {
    console.log('📋 Step 1: Loading PDF File');
    console.log('---------------------------');

    // Read the PDF file
    const pdfBuffer = readFileSync(PDF_FILE);
    console.log(`📄 PDF file: Машин Георгий Павлович.pdf`);
    console.log(`📊 PDF size: ${pdfBuffer.length} bytes`);

    // Test different base64 encoding methods
    console.log('\n🔍 Step 2: Testing Base64 Encoding Methods');
    console.log('------------------------------------------');

    // Method 1: Buffer.from().toString('base64')
    const base64Method1 = Buffer.from(pdfBuffer).toString('base64');
    console.log(
      `📝 Method 1 (Buffer): ${base64Method1.length} chars, starts with: ${base64Method1.substring(0, 20)}...`
    );

    // Method 2: btoa() with binary string
    const binaryString = String.fromCharCode(...new Uint8Array(pdfBuffer));
    const base64Method2 = btoa(binaryString);
    console.log(
      `📝 Method 2 (btoa): ${base64Method2.length} chars, starts with: ${base64Method2.substring(0, 20)}...`
    );

    // Check if they're the same
    const methodsMatch = base64Method1 === base64Method2;
    console.log(`🔍 Methods match: ${methodsMatch ? 'YES' : 'NO'}`);

    console.log('\n🚀 Step 3: Testing PDF.co API with Different Formats');
    console.log('--------------------------------------------------');

    // Test with a simple API key (you'll need to replace this)
    const apiKey = 'YOUR_PDF_CO_API_KEY_HERE';

    if (apiKey === 'YOUR_PDF_CO_API_KEY_HERE') {
      console.log('⚠️  Please set your actual PDF.co API key in the script');
      console.log('💡 Replace "YOUR_PDF_CO_API_KEY_HERE" with your actual key');
      return;
    }

    // Test Format 1: Standard format
    console.log('\n📤 Testing Format 1: Standard format');
    try {
      const response1 = await fetch(
        'https://api.pdf.co/v1/pdf/convert/to/text',
        {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            file: base64Method1,
            inline: true,
            password: '',
          }),
        }
      );

      console.log(`📊 Status: ${response1.status} ${response1.statusText}`);
      const result1 = await response1.text();
      console.log(`📝 Response: ${result1.substring(0, 200)}...`);
    } catch (error) {
      console.error(`❌ Format 1 failed: ${error.message}`);
    }

    // Test Format 2: With additional parameters
    console.log('\n📤 Testing Format 2: With additional parameters');
    try {
      const response2 = await fetch(
        'https://api.pdf.co/v1/pdf/convert/to/text',
        {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            file: base64Method1,
            inline: true,
            password: '',
            pages: '1-10', // Specify page range
            ocrMode: 'auto', // Enable OCR if needed
          }),
        }
      );

      console.log(`📊 Status: ${response2.status} ${response2.statusText}`);
      const result2 = await response2.text();
      console.log(`📝 Response: ${result2.substring(0, 200)}...`);
    } catch (error) {
      console.error(`❌ Format 2 failed: ${error.message}`);
    }

    // Test Format 3: URL-based (if file is publicly accessible)
    console.log('\n📤 Testing Format 3: URL-based approach');
    console.log('💡 This would work if the PDF was publicly accessible');
    console.log("📝 For now, we'll focus on base64 approach");

    console.log('\n📋 Step 4: Analysis');
    console.log('------------------');
    console.log('🔍 Common issues with PDF.co API:');
    console.log('1. Invalid base64 encoding');
    console.log('2. Missing required parameters');
    console.log('3. Incorrect API endpoint');
    console.log('4. File size limits');
    console.log('5. API key permissions');

    console.log('\n💡 Next Steps:');
    console.log('=============');
    console.log('1. Verify the API key is correct');
    console.log('2. Check PDF.co documentation for exact format');
    console.log('3. Test with a smaller PDF file');
    console.log('4. Check API key permissions in PDF.co dashboard');
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the debug
debugPdfCoRequest();
