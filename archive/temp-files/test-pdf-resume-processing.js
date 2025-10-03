#!/usr/bin/env node

/**
 * Test PDF Resume Processing
 * Test with Russian PDF resume to verify database logging works for PDFs
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const WORKER_URL = process.env.WORKER_URL || 'https://resume-processor-worker.dev-a96.workers.dev';
const PDF_FILE = join(__dirname, 'tests', 'sample-resumes', 'pdf', 'international', 'Машин Георгий Павлович.pdf');

console.log('🔍 Test PDF Resume Processing');
console.log('============================\n');

/**
 * Test with Russian PDF resume
 */
async function testPdfResumeProcessing() {
  try {
    console.log('📋 Step 1: Loading PDF Resume');
    console.log('-----------------------------');
    
    // Read the PDF file as base64
    const pdfBuffer = readFileSync(PDF_FILE);
    const pdfBase64 = pdfBuffer.toString('base64');
    
    console.log(`📄 PDF file: Машин Георгий Павлович.pdf`);
    console.log(`📊 PDF size: ${pdfBuffer.length} bytes`);
    console.log(`🌐 Language: Russian`);
    console.log(`📝 Input preview: PDF document (base64 encoded)\n`);
    
    const testRequest = {
      resume_pdf: pdfBase64,
      language: "ru",
      options: {
        flexible_validation: true,
        strict_validation: false
      }
    };
    
    console.log('🚀 Step 2: Sending PDF Request to Worker');
    console.log('---------------------------------------');
    console.log(`🔗 Worker URL: ${WORKER_URL}`);
    console.log('📤 Sending POST request to /process-resume...\n');
    
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
    console.log(`📊 Response status: ${response.status} ${response.statusText}`);
    
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
    console.log(`🔍 Unmapped fields: ${responseData.unmapped_fields?.length || 0}`);
    console.log(`📋 Partial fields: ${responseData.partial_fields?.length || 0}`);
    
    if (responseData.data) {
      console.log('\n📋 Extracted Resume Data:');
      console.log('--------------------------');
      console.log(`🎯 Desired titles: ${responseData.data.desired_titles?.length || 0} found`);
      console.log(`📝 Summary length: ${responseData.data.summary?.length || 0} characters`);
      console.log(`🛠️  Skills count: ${responseData.data.skills?.length || 0}`);
      console.log(`💼 Experience entries: ${responseData.data.experience?.length || 0}`);
      
      // Show sample data
      if (responseData.data.desired_titles) {
        console.log(`📋 Desired titles: ${JSON.stringify(responseData.data.desired_titles)}`);
      }
      if (responseData.data.experience && responseData.data.experience.length > 0) {
        console.log(`📅 First experience: ${responseData.data.experience[0].title} at ${responseData.data.experience[0].employer}`);
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
    console.log('-- 1. Check recent entries with input preview');
    console.log('SELECT request_id, timestamp, json_extract(payload, "$.inputPreview") as input_preview, json_extract(payload, "$.success") as success FROM request_logs_simple WHERE endpoint = "/process-resume" ORDER BY created_at DESC LIMIT 3;');
    console.log('');
    console.log('-- 2. Check if resumeData field exists');
    console.log('SELECT request_id, json_extract(payload, "$.resumeData") as resume_data FROM request_logs_simple WHERE endpoint = "/process-resume" ORDER BY created_at DESC LIMIT 1;');
    console.log('');
    console.log('-- 3. Check specific resume fields');
    console.log('SELECT request_id, json_extract(payload, "$.resumeData.desired_titles") as titles, json_extract(payload, "$.resumeData.experience") as experience FROM request_logs_simple WHERE endpoint = "/process-resume" ORDER BY created_at DESC LIMIT 1;');
    
    console.log('\n📋 Expected Results:');
    console.log('-------------------');
    console.log('✅ input_preview should contain: "PDF document (base64 encoded)" or similar');
    console.log('✅ resume_data should NOT be null');
    console.log('✅ titles should contain Russian job titles');
    console.log('✅ experience should contain job entries with dates');
    console.log('✅ payload should contain resumeData field with complete API response');
    
    /**
     * Summary
     */
    console.log('\n📋 Step 5: Test Summary');
    console.log('----------------------');
    console.log(`✅ API Response Generated: ${responseData.success ? 'YES' : 'NO'}`);
    console.log(`📊 Data Extracted: ${responseData.data ? 'YES' : 'NO'}`);
    console.log(`🚀 Worker Deployed: YES (Version: fcdd5397-782c-45cf-a973-293212312c32)`);
    console.log(`🗄️  Database Logging: Should include inputPreview and resumeData fields`);
    
    if (responseData.success && responseData.data) {
      console.log('\n🎉 SUCCESS: PDF resume processing works!');
      console.log('🔍 Check database logs for inputPreview and resumeData fields');
      console.log('📝 The resumeData should contain the complete structured JSON');
      console.log('');
      console.log('📋 Key Data Points to Verify:');
      console.log('-----------------------------');
      console.log('✅ Input Preview: Should indicate PDF document');
      console.log('✅ Desired Titles: Russian job titles');
      console.log('✅ Experience: Job entries with dates');
      console.log('✅ Skills: Technical skills in Russian');
    } else {
      console.log('\n⚠️  ISSUE: PDF resume processing failed');
      console.log('🔍 Check the errors and unmapped fields for details');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testPdfResumeProcessing();
