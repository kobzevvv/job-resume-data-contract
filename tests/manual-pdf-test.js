#!/usr/bin/env node

/**
 * Manual PDF Testing Script
 * Upload and test PDF resumes manually against the API
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

/**
 * Test PDF processing with manual upload
 */
async function testPDFManually(pdfPath, options = {}) {
  console.log(`🧪 Testing PDF: ${pdfPath}`);
  console.log('=====================================\n');

  try {
    // Read PDF file as binary
    const pdfBuffer = readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');

    console.log(`📄 PDF Info:`);
    console.log(`   - File Size: ${Math.round(pdfBuffer.length / 1024)}KB`);
    console.log(`   - Base64 Size: ${Math.round(pdfBase64.length / 1024)}KB`);
    console.log('');

    // Test 1: Current API (should fail gracefully)
    console.log('🔍 Test 1: Current API (Text Only)');
    console.log('-----------------------------------');

    try {
      const textResponse = await fetch(`${WORKER_URL}/process-resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resume_text:
            'This is a PDF file converted to base64: ' +
            pdfBase64.substring(0, 100) +
            '...',
          options: {
            include_unmapped: true,
            strict_validation: false,
          },
        }),
      });

      const textData = await textResponse.json();
      console.log(`   Status: ${textResponse.status}`);
      console.log(`   Success: ${textData.success}`);
      console.log(
        `   Message: PDF data cannot be processed as text (expected)`
      );
    } catch (error) {
      console.log(`   Error: ${error.message}`);
    }
    console.log('');

    // Test 2: Future PDF API (will be implemented)
    console.log('🔍 Test 2: Future PDF API (To Be Implemented)');
    console.log('----------------------------------------------');

    const pdfRequestBody = {
      input_type: 'pdf',
      resume_pdf: {
        data: pdfBase64,
        filename: pdfPath.split('/').pop(),
        content_type: 'application/pdf',
      },
      language: options.language || 'en',
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

    console.log('   Request Body Structure:');
    console.log('   {');
    console.log(`     "input_type": "${pdfRequestBody.input_type}",`);
    console.log('     "resume_pdf": {');
    console.log(`       "filename": "${pdfRequestBody.resume_pdf.filename}",`);
    console.log(
      `       "content_type": "${pdfRequestBody.resume_pdf.content_type}",`
    );
    console.log(
      `       "data": "[base64 data ${Math.round(pdfBase64.length / 1024)}KB]"`
    );
    console.log('     },');
    console.log(`     "language": "${pdfRequestBody.language}",`);
    console.log('     "pdf_options": { ... },');
    console.log('     "options": { ... }');
    console.log('   }');
    console.log('');

    // Save request for manual testing
    const testRequestPath = join(__dirname, 'manual-pdf-request.json');
    const requestForSaving = {
      ...pdfRequestBody,
      resume_pdf: {
        ...pdfRequestBody.resume_pdf,
        data: `[BASE64_DATA_${Math.round(pdfBase64.length / 1024)}KB]`, // Placeholder for readability
      },
    };

    try {
      const fs = await import('fs');
      fs.writeFileSync(
        testRequestPath,
        JSON.stringify(requestForSaving, null, 2)
      );
      console.log(`   📁 Request template saved to: ${testRequestPath}`);
    } catch (writeError) {
      console.log(
        `   ⚠️  Could not save request template: ${writeError.message}`
      );
    }

    // Test 3: Attempt PDF processing (will fail until implemented)
    console.log('🔍 Test 3: Attempt PDF Processing');
    console.log('----------------------------------');

    try {
      const pdfResponse = await fetch(`${WORKER_URL}/process-resume-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pdfRequestBody),
      });

      if (pdfResponse.status === 404) {
        console.log('   Status: 404 (Endpoint not implemented yet - expected)');
      } else {
        const pdfData = await pdfResponse.json();
        console.log(`   Status: ${pdfResponse.status}`);
        console.log(`   Success: ${pdfData.success}`);
        console.log('   🎉 PDF processing is working!');
      }
    } catch (error) {
      console.log(
        `   Error: ${error.message} (expected until PDF support is implemented)`
      );
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  console.log('\n🏁 Manual PDF Test Complete\n');
}

/**
 * Generate test PDF using text
 */
function generateTestInstructions() {
  console.log('📋 How to Generate Test PDFs');
  console.log('============================\n');

  console.log('1. 📄 Create PDF from existing text resumes:');
  console.log('   - Open tests/sample-resumes/senior-backend-engineer.txt');
  console.log('   - Copy content to Google Docs or Word');
  console.log('   - Export as PDF');
  console.log(
    '   - Save as tests/sample-resumes/pdf/simple/senior-backend-engineer.pdf\n'
  );

  console.log('2. 🌐 Download sample PDFs:');
  console.log('   - LinkedIn: Export your profile as PDF');
  console.log('   - Canva: Create and download resume templates');
  console.log('   - Indeed: Export resume as PDF\n');

  console.log('3. 🧪 Edge case PDFs:');
  console.log('   - Password protect a PDF (for testing error handling)');
  console.log('   - Create a very large PDF (>10MB)');
  console.log('   - Scan a printed resume (for OCR testing)\n');

  console.log('4. 🚀 Run this test:');
  console.log('   node tests/manual-pdf-test.js path/to/your/resume.pdf\n');
}

// Main execution
const pdfPath = process.argv[2];

if (!pdfPath) {
  console.log('🔧 Manual PDF Testing Tool\n');
  generateTestInstructions();
  console.log('Usage: node tests/manual-pdf-test.js path/to/resume.pdf');
  process.exit(1);
}

testPDFManually(pdfPath).catch(error => {
  console.error('❌ Manual test failed:', error);
  process.exit(1);
});
