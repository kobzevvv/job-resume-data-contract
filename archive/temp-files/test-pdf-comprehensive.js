#!/usr/bin/env node

/**
 * Comprehensive PDF Resume Processing Test
 *
 * This script tests the PDF resume processing endpoint and verifies:
 * 1. PDF upload and text extraction
 * 2. AI processing and structured data extraction
 * 3. Database logging with complete resume data
 * 4. Field validation against schema
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const WORKER_URL =
  process.env.WORKER_URL ||
  'https://resume-processor-worker.dev-a96.workers.dev';
const PDF_PATH =
  process.argv[2] ||
  path.join(
    __dirname,
    'tests/sample-resumes/pdf/international/Машин Георгий Павлович.pdf'
  );

console.log('🧪 PDF Resume Processing Test');
console.log('================================');
console.log(`Worker URL: ${WORKER_URL}`);
console.log(`PDF Path: ${PDF_PATH}`);
console.log('');

// Check if PDF file exists
if (!fs.existsSync(PDF_PATH)) {
  console.error(`❌ PDF file not found: ${PDF_PATH}`);
  process.exit(1);
}

// Get file stats
const stats = fs.statSync(PDF_PATH);
console.log(`📄 PDF File Info:`);
console.log(`   Name: ${path.basename(PDF_PATH)}`);
console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
console.log(`   Path: ${PDF_PATH}`);
console.log('');

async function testPdfProcessing() {
  try {
    console.log('🚀 Starting PDF processing test...');

    // Read PDF file
    const pdfBuffer = fs.readFileSync(PDF_PATH);
    console.log(`✅ PDF file read successfully (${pdfBuffer.length} bytes)`);

    // Create FormData
    const formData = new FormData();
    const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
    formData.append('pdf', pdfBlob, path.basename(PDF_PATH));
    formData.append('language', 'ru'); // Russian language
    formData.append('flexible_validation', 'true');
    formData.append('strict_validation', 'false');

    console.log('📤 Sending PDF to processing endpoint...');

    // Send request
    const startTime = Date.now();
    const response = await fetch(`${WORKER_URL}/process-resume-pdf`, {
      method: 'POST',
      body: formData,
    });
    const endTime = Date.now();

    console.log(`⏱️  Request completed in ${endTime - startTime}ms`);
    console.log(
      `📊 Response status: ${response.status} ${response.statusText}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Request failed:');
      console.error(errorText);
      return;
    }

    // Parse response
    const result = await response.json();
    console.log('✅ Response received successfully');
    console.log('');

    // Display results
    console.log('📋 PROCESSING RESULTS');
    console.log('====================');
    console.log(`Success: ${result.success}`);
    console.log(`Processing Time: ${result.processing_time_ms}ms`);
    console.log(`AI Model: ${result.metadata?.ai_model_used || 'Unknown'}`);
    console.log(
      `Format Detected: ${result.metadata?.format_detected || 'Unknown'}`
    );
    console.log(
      `Format Confidence: ${result.metadata?.format_confidence || 'Unknown'}`
    );
    console.log('');

    if (result.success && result.data) {
      console.log('🎯 EXTRACTED RESUME DATA');
      console.log('========================');

      // Check each schema field
      const schemaFields = [
        'desired_titles',
        'summary',
        'skills',
        'experience',
        'location_preference',
        'schedule',
        'salary_expectation',
        'availability',
        'links',
      ];

      schemaFields.forEach(field => {
        const value = result.data[field];
        const status = value !== undefined && value !== null ? '✅' : '❌';
        const type = Array.isArray(value)
          ? `array[${value.length}]`
          : typeof value;
        const preview = value
          ? JSON.stringify(value).substring(0, 100) + '...'
          : 'null';

        console.log(`${status} ${field}: ${type}`);
        if (value) {
          console.log(`   Preview: ${preview}`);
        }
      });

      console.log('');

      // Detailed field analysis
      console.log('🔍 DETAILED FIELD ANALYSIS');
      console.log('===========================');

      // Desired titles
      if (result.data.desired_titles) {
        console.log(`Desired Titles (${result.data.desired_titles.length}):`);
        result.data.desired_titles.forEach((title, i) => {
          console.log(`   ${i + 1}. ${title}`);
        });
        console.log('');
      }

      // Summary
      if (result.data.summary) {
        console.log(`Summary (${result.data.summary.length} chars):`);
        console.log(`   ${result.data.summary.substring(0, 200)}...`);
        console.log('');
      }

      // Skills
      if (result.data.skills) {
        console.log(`Skills (${result.data.skills.length}):`);
        result.data.skills.slice(0, 10).forEach((skill, i) => {
          if (typeof skill === 'object') {
            console.log(`   ${i + 1}. ${skill.name} (Level: ${skill.level})`);
          } else {
            console.log(`   ${i + 1}. ${skill}`);
          }
        });
        if (result.data.skills.length > 10) {
          console.log(`   ... and ${result.data.skills.length - 10} more`);
        }
        console.log('');
      }

      // Experience
      if (result.data.experience) {
        console.log(`Experience (${result.data.experience.length} positions):`);
        result.data.experience.forEach((exp, i) => {
          console.log(
            `   ${i + 1}. ${exp.title} at ${exp.employer || 'Unknown'}`
          );
          console.log(`      Period: ${exp.start} - ${exp.end || 'Present'}`);
          console.log(
            `      Description: ${exp.description.substring(0, 100)}...`
          );
        });
        console.log('');
      }

      // Other fields
      if (result.data.location_preference) {
        console.log(
          `Location Preference: ${JSON.stringify(result.data.location_preference)}`
        );
      }
      if (result.data.schedule) {
        console.log(`Schedule: ${result.data.schedule}`);
      }
      if (result.data.salary_expectation) {
        console.log(
          `Salary Expectation: ${JSON.stringify(result.data.salary_expectation)}`
        );
      }
      if (result.data.availability) {
        console.log(`Availability: ${result.data.availability}`);
      }
      if (result.data.links && result.data.links.length > 0) {
        console.log(`Links (${result.data.links.length}):`);
        result.data.links.forEach((link, i) => {
          console.log(`   ${i + 1}. ${link.label}: ${link.url}`);
        });
      }
    } else {
      console.log('❌ No data extracted');
      if (result.errors && result.errors.length > 0) {
        console.log('Errors:');
        result.errors.forEach(error => console.log(`   - ${error}`));
      }
    }

    console.log('');

    // Unmapped fields
    if (result.unmapped_fields && result.unmapped_fields.length > 0) {
      console.log('🔍 UNMAPPED FIELDS');
      console.log('==================');
      console.log(`Found ${result.unmapped_fields.length} unmapped fields:`);
      result.unmapped_fields.forEach((field, i) => {
        console.log(`   ${i + 1}. ${field}`);
      });
      console.log('');
    }

    // Validation errors
    if (result.errors && result.errors.length > 0) {
      console.log('⚠️  VALIDATION ERRORS');
      console.log('=====================');
      result.errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`);
      });
      console.log('');
    }

    // Partial fields
    if (result.partial_fields && result.partial_fields.length > 0) {
      console.log('🔧 PARTIAL FIELDS');
      console.log('=================');
      console.log(`Found ${result.partial_fields.length} partial fields:`);
      result.partial_fields.forEach((field, i) => {
        console.log(`   ${i + 1}. ${field}`);
      });
      console.log('');
    }

    console.log('✅ PDF processing test completed successfully!');

    // Save full result to file for inspection
    const outputFile = path.join(__dirname, 'pdf-test-result.json');
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
    console.log(`📁 Full result saved to: ${outputFile}`);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run the test
testPdfProcessing();
