#!/usr/bin/env node

/**
 * Debug script for Russian resume processing
 * Shows detailed output and saves results to files
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const WORKER_URL = process.env.WORKER_URL || 'https://resume-processor-worker.dev-a96.workers.dev';

async function debugRussianResume() {
  console.log('🇷🇺 Russian Resume Processing Debug Tool');
  console.log('========================================\n');
  
  try {
    // Read the Russian resume
    const resumePath = join(__dirname, 'tests', 'sample-resumes', 'russian-it-specialist.txt');
    const resumeText = readFileSync(resumePath, 'utf8');
    
    console.log('📄 Resume Information:');
    console.log(`   File: ${resumePath}`);
    console.log(`   Size: ${resumeText.length} characters`);
    console.log(`   Lines: ${resumeText.split('\n').length}`);
    console.log(`   Preview: ${resumeText.substring(0, 100)}...\n`);
    
    // Test with different language settings
    const testCases = [
      { name: 'Auto-detection (no language)', language: null },
      { name: 'Explicit Russian (ru)', language: 'ru' },
      { name: 'Wrong language (en)', language: 'en' }
    ];
    
    for (const testCase of testCases) {
      console.log(`🧪 Testing: ${testCase.name}`);
      console.log('─'.repeat(50));
      
      const requestBody = {
        resume_text: resumeText,
        options: {
          include_unmapped: true,
          strict_validation: false
        }
      };
      
      if (testCase.language) {
        requestBody.language = testCase.language;
      }
      
      const startTime = Date.now();
      
      try {
        const response = await fetch(`${WORKER_URL}/process-resume`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });
        
        const processingTime = Date.now() - startTime;
        const data = await response.json();
        
        console.log(`✅ Status: ${response.status}`);
        console.log(`⏱️  Processing time: ${processingTime}ms`);
        console.log(`🎯 Success: ${data.success}`);
        console.log(`❌ Errors: ${data.errors.length > 0 ? data.errors.join(', ') : 'None'}`);
        console.log(`📋 Unmapped fields: ${data.unmapped_fields.length > 0 ? data.unmapped_fields.join(', ') : 'None'}`);
        
        if (data.success && data.data) {
          console.log(`📊 Extracted data:`);
          console.log(`   • Desired titles: ${data.data.desired_titles?.length || 0} items`);
          console.log(`   • Skills: ${data.data.skills?.length || 0} items`);
          console.log(`   • Experience: ${data.data.experience?.length || 0} items`);
          console.log(`   • Summary: ${data.data.summary ? 'Present' : 'Missing'}`);
          
          // Show sample data
          if (data.data.desired_titles?.length > 0) {
            console.log(`   • Sample titles: ${data.data.desired_titles.slice(0, 2).join(', ')}`);
          }
          
          if (data.data.skills?.length > 0) {
            const sampleSkills = data.data.skills.slice(0, 3).map(s => s.name || s).join(', ');
            console.log(`   • Sample skills: ${sampleSkills}`);
          }
          
          // Check for Russian text preservation
          const hasRussianText = JSON.stringify(data.data).includes('а') || 
                                JSON.stringify(data.data).includes('б') ||
                                JSON.stringify(data.data).includes('в');
          console.log(`   • Russian text preserved: ${hasRussianText ? '✅ Yes' : '❌ No'}`);
        }
        
        // Save detailed output to file
        const outputFile = join(__dirname, `debug-output-${testCase.language || 'auto'}.json`);
        writeFileSync(outputFile, JSON.stringify(data, null, 2));
        console.log(`💾 Full output saved to: ${outputFile}`);
        
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
      }
      
      console.log('');
    }
    
    // Show how to access logs
    console.log('📋 How to Access Logs:');
    console.log('=====================');
    console.log('1. Cloudflare Worker Logs:');
    console.log('   • Go to Cloudflare Dashboard → Workers & Pages');
    console.log('   • Select your worker → Logs tab');
    console.log('   • View real-time logs and errors');
    console.log('');
    console.log('2. Local Development Logs:');
    console.log('   • Run: pnpm dev');
    console.log('   • Check terminal output for detailed logs');
    console.log('');
    console.log('3. Test with Verbose Logging:');
    console.log('   • Add console.log statements in your worker code');
    console.log('   • Use structured logging with timestamps');
    console.log('');
    console.log('4. Debug Specific Issues:');
    console.log('   • Check AI model responses');
    console.log('   • Validate JSON parsing');
    console.log('   • Monitor processing times');
    console.log('');
    
  } catch (error) {
    console.error('❌ Debug script failed:', error.message);
  }
}

// Run the debug tool
debugRussianResume().catch(console.error);
