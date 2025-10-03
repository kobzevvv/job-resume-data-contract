#!/usr/bin/env node

/**
 * Simple PDF Testing Script
 * Easy way to test PDF resumes and see JSON results
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const WORKER_URL = 'https://resume-processor-worker.dev-a96.workers.dev';

/**
 * Test PDF processing with a simple interface
 */
async function testPDF(pdfPath) {
  console.log('🧪 Testing PDF Resume Processing');
  console.log('=================================\n');

  try {
    // Read PDF file
    const pdfBuffer = readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');

    console.log(`📄 PDF File: ${pdfPath.split('/').pop()}`);
    console.log(`📊 File Size: ${Math.round(pdfBuffer.length / 1024)}KB`);
    console.log(`🔢 Base64 Size: ${Math.round(pdfBase64.length / 1024)}KB\n`);

    // Test current API with PDF data (will fail gracefully)
    console.log('🔍 Testing Current API (Text Processing)...');

    const requestBody = {
      resume_text: `PDF File: ${pdfPath.split('/').pop()}\nBase64 Data: ${pdfBase64.substring(0, 100)}...`,
      language: 'en',
      options: {
        flexible_validation: true,
        include_unmapped: true,
      },
    };

    const response = await fetch(`${WORKER_URL}/process-resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Success: ${data.success}`);
    console.log(`⏱️  Processing Time: ${data.processing_time_ms}ms`);

    if (data.data) {
      console.log('\n📋 Extracted Data:');
      console.log(
        `   Job Titles: ${data.data.desired_titles?.join(', ') || 'None'}`
      );
      console.log(`   Skills Found: ${data.data.skills?.length || 0}`);
      console.log(
        `   Experience Entries: ${data.data.experience?.length || 0}`
      );
      console.log(
        `   Summary Length: ${data.data.summary?.length || 0} characters`
      );
    }

    if (data.unmapped_fields?.length > 0) {
      console.log(`\n⚠️  Unmapped Fields: ${data.unmapped_fields.join(', ')}`);
    }

    if (data.validation_errors?.length > 0) {
      console.log(`\n⚠️  Validation Errors: ${data.validation_errors.length}`);
    }

    // Show what future PDF API would look like
    console.log('\n🔮 Future PDF API Structure:');
    console.log('```json');
    console.log(
      JSON.stringify(
        {
          input_type: 'pdf',
          resume_pdf: {
            data: `[BASE64_DATA_${Math.round(pdfBase64.length / 1024)}KB]`,
            filename: pdfPath.split('/').pop(),
            content_type: 'application/pdf',
          },
          language: 'en',
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
        },
        null,
        2
      )
    );
    console.log('```');

    console.log('\n✅ PDF Test Complete!');
    console.log('\n📝 Notes:');
    console.log('   - PDF processing is not yet implemented (returns 404)');
    console.log(
      '   - Current API processes PDF data as text (limited success)'
    );
    console.log(
      '   - Future PDF API will extract text from PDFs automatically'
    );
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

/**
 * Show usage instructions
 */
function showUsage() {
  console.log('🚀 Simple PDF Testing Tool');
  console.log('==========================\n');

  console.log('Usage:');
  console.log('  node test-pdf-simple.js <path-to-pdf>');
  console.log('');

  console.log('Examples:');
  console.log('  # Test existing PDFs:');
  console.log(
    '  node test-pdf-simple.js "tests/sample-resumes/pdf/international/Ивановская Мария.pdf"'
  );
  console.log(
    '  node test-pdf-simple.js "tests/sample-resumes/pdf/simple/sumanprasad_08Jun_30.pdf"'
  );
  console.log('');
  console.log('  # Test your own PDF:');
  console.log('  node test-pdf-simple.js "/path/to/your/resume.pdf"');
  console.log('');

  console.log('Available test PDFs:');

  const pdfDirs = [
    'tests/sample-resumes/pdf/international/',
    'tests/sample-resumes/pdf/simple/',
  ];

  pdfDirs.forEach(dir => {
    try {
      const fullPath = join(__dirname, dir);
      const files = readFileSync(fullPath)
        .toString()
        .split('\n')
        .filter(f => f.endsWith('.pdf'));
      if (files.length > 0) {
        console.log(`\n${dir}:`);
        files.forEach(file => {
          console.log(`  - ${file}`);
        });
      }
    } catch (error) {
      // Directory doesn't exist or can't read
    }
  });
}

// Main execution
const pdfPath = process.argv[2];

if (!pdfPath) {
  showUsage();
  process.exit(1);
}

testPDF(pdfPath).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
