#!/usr/bin/env node

/**
 * Simple test script for Russian resume processing
 * Perfect for developers to quickly test the API with Russian resumes
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

/**
 * Test Russian resume processing with retry logic
 */
async function testRussianResume(maxRetries = 3) {
  console.log('🇷🇺 Russian Resume API Test');
  console.log('===========================\n');

  try {
    // Read the sample Russian resume
    const resumePath = join(
      __dirname,
      'tests',
      'sample-resumes',
      'russian-it-specialist.txt'
    );
    const resumeText = readFileSync(resumePath, 'utf8');

    console.log('📄 Processing Russian resume...');
    console.log(`   Size: ${resumeText.length} characters`);
    console.log(`   Preview: ${resumeText.substring(0, 100)}...\n`);

    let result;
    let processingTime;

    // Try with retry logic
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`🔄 Attempt ${attempt}/${maxRetries}...`);

      const startTime = Date.now();
      const response = await fetch(`${WORKER_URL}/process-resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resume_text: resumeText,
          language: 'ru',
          options: {
            include_unmapped: true,
            strict_validation: false,
          },
        }),
      });

      processingTime = Date.now() - startTime;
      result = await response.json();

      // Check if we need to retry
      if (
        !result.success &&
        result.errors.includes('Internal processing error')
      ) {
        if (attempt < maxRetries) {
          console.log(
            `   ❌ Attempt ${attempt} failed with internal error, retrying in ${attempt * 2} seconds...`
          );
          await new Promise(resolve => setTimeout(resolve, attempt * 2000));
          continue;
        }
      } else {
        console.log(`   ✅ Attempt ${attempt} completed`);
        break;
      }
    }

    // Display results
    console.log('\n✅ Processing Results:');
    console.log(`   Success: ${result.success}`);
    console.log(`   Processing time: ${processingTime}ms`);
    console.log(`   Worker time: ${result.processing_time_ms}ms`);
    console.log(
      `   Errors: ${result.errors.length > 0 ? result.errors.join(', ') : 'None'}`
    );
    console.log(
      `   Unmapped fields: ${result.unmapped_fields.length > 0 ? result.unmapped_fields.join(', ') : 'None'}\n`
    );

    if (result.success && result.data) {
      console.log('📊 Extracted Data:');
      console.log(
        `   • Desired titles: ${result.data.desired_titles?.length || 0} items`
      );
      console.log(`   • Skills: ${result.data.skills?.length || 0} items`);
      console.log(
        `   • Experience: ${result.data.experience?.length || 0} items`
      );
      console.log(
        `   • Summary: ${result.data.summary ? 'Present' : 'Missing'}\n`
      );

      // Show sample data
      if (result.data.desired_titles?.length > 0) {
        console.log('🎯 Sample Desired Titles:');
        result.data.desired_titles.slice(0, 3).forEach((title, i) => {
          console.log(`   ${i + 1}. ${title}`);
        });
        console.log('');
      }

      if (result.data.skills?.length > 0) {
        console.log('🛠️  Sample Skills:');
        result.data.skills.slice(0, 5).forEach((skill, i) => {
          const skillName = typeof skill === 'string' ? skill : skill.name;
          const skillLevel = typeof skill === 'object' ? skill.level : 'N/A';
          console.log(`   ${i + 1}. ${skillName} (Level: ${skillLevel})`);
        });
        console.log('');
      }

      if (result.data.experience?.length > 0) {
        console.log('💼 Sample Experience:');
        result.data.experience.slice(0, 2).forEach((exp, i) => {
          console.log(`   ${i + 1}. ${exp.title} at ${exp.employer}`);
          console.log(`      Period: ${exp.start} - ${exp.end}`);
          console.log(
            `      Description: ${exp.description?.substring(0, 100)}...`
          );
        });
        console.log('');
      }

      // Check Russian text preservation
      const hasRussianText =
        JSON.stringify(result.data).includes('а') ||
        JSON.stringify(result.data).includes('б') ||
        JSON.stringify(result.data).includes('в');
      console.log(
        `🇷🇺 Russian text preserved: ${hasRussianText ? '✅ Yes' : '❌ No'}\n`
      );
    }

    // Save full output
    const outputFile = join(__dirname, 'russian-resume-output.json');
    writeFileSync(outputFile, JSON.stringify(result, null, 2));
    console.log(`💾 Full JSON output saved to: ${outputFile}`);

    // Show how to use in code
    console.log('💡 How to use in your code:');
    console.log('===========================');
    console.log('```javascript');
    console.log(
      'const response = await fetch("https://resume-processor-worker.dev-a96.workers.dev/process-resume", {'
    );
    console.log('  method: "POST",');
    console.log('  headers: { "Content-Type": "application/json" },');
    console.log('  body: JSON.stringify({');
    console.log('    resume_text: "Ваш русский текст резюме...",');
    console.log('    language: "ru"');
    console.log('  })');
    console.log('});');
    console.log('const result = await response.json();');
    console.log('```\n');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testRussianResume().catch(console.error);
