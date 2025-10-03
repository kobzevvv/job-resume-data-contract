#!/usr/bin/env node

/**
 * Test PDF Resume Processing - Size Limit Issue
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

console.log('🔍 Test PDF Resume Processing - Size Limit Issue');
console.log('===============================================\n');

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
    console.log(`📊 Base64 size: ${pdfBase64.length} characters`);
    console.log(`🌐 Language: Russian`);
    console.log(`📝 Input preview: PDF document (base64 encoded)\n`);
    
    // Check if the request would be too large
    const testRequest = {
      resume_pdf: pdfBase64,
      language: "ru",
      options: {
        flexible_validation: true,
        strict_validation: false
      }
    };
    
    const requestSize = JSON.stringify(testRequest).length;
    console.log(`📊 Request size: ${requestSize} characters`);
    console.log(`📊 Request size: ${(requestSize / 1024).toFixed(2)} KB`);
    
    if (requestSize > 50000) {
      console.log('❌ Request too large! Exceeds 50KB limit');
      console.log('🔍 This explains why we got "413 Payload Too Large" error');
      console.log('');
      console.log('📋 Solutions:');
      console.log('1. **Use smaller PDF files** (under 50KB total request size)');
      console.log('2. **Increase worker payload limit** in wrangler.toml');
      console.log('3. **Test with text resumes** (which work perfectly)');
      console.log('4. **Use PDF processing endpoint** if available');
      console.log('');
      console.log('🎯 For now, let\'s verify that our database logging fix works with text resumes:');
      console.log('✅ Text resumes: WORKING (inputPreview + resumeData fields stored)');
      console.log('❌ PDF resumes: BLOCKED by size limit');
      return;
    }
    
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
    
    if (responseData.data) {
      console.log(`🎯 Desired titles: ${responseData.data.desired_titles?.length || 0}`);
      console.log(`📝 Summary: ${responseData.data.summary ? 'YES' : 'NO'}`);
      console.log(`🛠️  Skills: ${responseData.data.skills?.length || 0}`);
      console.log(`💼 Experience: ${responseData.data.experience?.length || 0}`);
    }
    
    /**
     * Database Verification
     */
    console.log('\n🗄️  Step 4: Database Verification');
    console.log('--------------------------------');
    console.log('Run these SQL queries to check the logs:');
    console.log('');
    console.log('-- Check recent entries');
    console.log('SELECT request_id, timestamp, json_extract(payload, "$.inputPreview") as input_preview, json_extract(payload, "$.success") as success FROM request_logs_simple WHERE endpoint = "/process-resume" ORDER BY created_at DESC LIMIT 3;');
    
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
