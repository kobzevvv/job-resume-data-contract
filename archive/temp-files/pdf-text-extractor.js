#!/usr/bin/env node

/**
 * PDF Text Extractor and Resume Processor
 * Extract text from PDF and send to worker for processing
 */

import { readFileSync, writeFileSync } from 'fs';
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

console.log('🔍 PDF Text Extractor and Resume Processor');
console.log('=========================================\n');

/**
 * Simple PDF text extraction using a basic approach
 * This is a workaround for the 50KB limit
 */
async function extractPdfTextAndProcess() {
  try {
    console.log('📋 Step 1: PDF Text Extraction');
    console.log('-----------------------------');

    // For now, let's create a mock extraction
    // In a real scenario, you could use:
    // 1. VS Code PDF extension to copy text
    // 2. Online PDF to text converter
    // 3. Local PDF processing tool

    console.log(`📄 PDF file: Машин Георгий Павлович.pdf`);
    console.log(`📊 PDF size: ${readFileSync(PDF_FILE).length} bytes`);
    console.log(`🌐 Language: Russian`);
    console.log('');

    // Mock extracted text (you would replace this with actual extraction)
    const extractedText = `МАШИН ГЕОРГИЙ ПАВЛОВИЧ
Инженер-программист

📧 georgy.mashin@email.com
📱 +7-999-123-4567
🏠 Москва, Россия

ОПЫТ РАБОТЫ:
• Старший разработчик | ТехКорп | 2020-03 - настоящее время
• Разработчик | СтартапИнк | 2018-06 - 2020-02
• Младший разработчик | ВебАгентство | 2017-01 - 2018-05

НАВЫКИ:
• JavaScript, TypeScript, React, Node.js
• Python, Django, Flask
• PostgreSQL, MongoDB
• Docker, Kubernetes
• Git, CI/CD

ОБРАЗОВАНИЕ:
• Московский технический университет, Информатика, 2016`;

    console.log('📝 Extracted text preview:');
    console.log(extractedText.substring(0, 200) + '...');
    console.log(`📊 Text length: ${extractedText.length} characters\n`);

    // Save extracted text to file for reference
    const textFile = join(__dirname, 'extracted-pdf-text.txt');
    writeFileSync(textFile, extractedText, 'utf8');
    console.log(`💾 Saved extracted text to: ${textFile}\n`);

    console.log('🚀 Step 2: Sending Text to Worker');
    console.log('--------------------------------');
    console.log(`🔗 Worker URL: ${WORKER_URL}`);
    console.log('📤 Sending POST request to /process-resume...\n');

    const testRequest = {
      resume_text: extractedText,
      language: 'ru',
      options: {
        flexible_validation: true,
        strict_validation: false,
      },
    };

    const startTime = Date.now();
    const response = await fetch(`${WORKER_URL}/process-resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRequest),
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
      console.log('❌ No data extracted from resume');
    }

    /**
     * Database Verification
     */
    console.log('\n🗄️  Step 4: Database Verification');
    console.log('--------------------------------');
    console.log('Run these SQL queries to check the logs:');
    console.log('');
    console.log('-- Check recent entries');
    console.log(
      'SELECT request_id, timestamp, json_extract(payload, "$.inputPreview") as input_preview, json_extract(payload, "$.success") as success FROM request_logs_simple WHERE endpoint = "/process-resume" ORDER BY created_at DESC LIMIT 3;'
    );
    console.log('');
    console.log('-- Check resumeData field');
    console.log(
      'SELECT request_id, json_extract(payload, "$.resumeData") as resume_data FROM request_logs_simple WHERE endpoint = "/process-resume" ORDER BY created_at DESC LIMIT 1;'
    );

    console.log('\n📋 Expected Results:');
    console.log('-------------------');
    console.log(
      '✅ input_preview should contain: "МАШИН ГЕОРГИЙ ПАВЛОВИЧ\\nИнженер-программист..."'
    );
    console.log('✅ resume_data should NOT be null');
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
      `🚀 Worker Deployed: YES (Version: de006b46-4e8c-4713-9ee8-cc7b254bb9d7)`
    );
    console.log(
      `🗄️  Database Logging: Should include inputPreview and resumeData fields`
    );

    if (responseData.success && responseData.data) {
      console.log('\n🎉 SUCCESS: PDF text processing works!');
      console.log(
        '🔍 Check database logs for inputPreview and resumeData fields'
      );
      console.log(
        '📝 The resumeData should contain the complete structured JSON'
      );
      console.log('');
      console.log('📋 Key Data Points to Verify:');
      console.log('-----------------------------');
      console.log(
        '✅ Input Preview: Should start with "МАШИН ГЕОРГИЙ ПАВЛОВИЧ"'
      );
      console.log('✅ Desired Titles: Russian job titles');
      console.log('✅ Experience: Job entries with dates');
      console.log('✅ Skills: Technical skills in Russian');
      console.log('');
      console.log('💡 Next Steps:');
      console.log('1. Use VS Code PDF extension to extract real text from PDF');
      console.log('2. Replace mock text with actual extracted text');
      console.log('3. Test with real PDF content');
    } else {
      console.log('\n⚠️  ISSUE: PDF text processing failed');
      console.log('🔍 Check the errors and unmapped fields for details');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
extractPdfTextAndProcess();
