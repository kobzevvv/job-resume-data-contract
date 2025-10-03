#!/usr/bin/env node

/**
 * PDF vs Text Comparison Tool
 * Compares how well PDF data is processed vs text data
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const WORKER_URL = 'https://resume-processor-worker.dev-a96.workers.dev';

/**
 * Compare PDF processing vs text processing
 */
async function comparePDFvsText(pdfPath, textPath) {
  console.log('🔄 PDF vs Text Processing Comparison');
  console.log('=====================================\n');

  try {
    // Read both files
    const pdfBuffer = readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');
    const textContent = readFileSync(textPath, 'utf8');

    console.log(`📄 PDF File: ${pdfPath.split('/').pop()}`);
    console.log(`📄 Text File: ${textPath.split('/').pop()}`);
    console.log(`📊 PDF Size: ${Math.round(pdfBuffer.length / 1024)}KB`);
    console.log(`📊 Text Size: ${Math.round(textContent.length / 1024)}KB\n`);

    // Process PDF data (as text)
    console.log('🔍 Processing PDF Data (as text)...');
    const pdfRequestBody = {
      resume_text: `PDF File: ${pdfPath.split('/').pop()}\nBase64 Data: ${pdfBase64.substring(0, 100)}...`,
      language: 'en',
      options: {
        flexible_validation: true,
        include_unmapped: true,
      },
    };

    const pdfResponse = await fetch(`${WORKER_URL}/process-resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pdfRequestBody),
    });

    const pdfData = await pdfResponse.json();

    // Process text data
    console.log('🔍 Processing Text Data...');
    const textRequestBody = {
      resume_text: textContent,
      language: 'en',
      options: {
        flexible_validation: true,
        include_unmapped: true,
      },
    };

    const textResponse = await fetch(`${WORKER_URL}/process-resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(textRequestBody),
    });

    const textData = await textResponse.json();

    // Compare results
    console.log('\n📊 COMPARISON RESULTS');
    console.log('=====================\n');

    // Processing time comparison
    console.log('⏱️  PROCESSING TIME:');
    console.log(`   PDF Processing: ${pdfData.processing_time_ms}ms`);
    console.log(`   Text Processing: ${textData.processing_time_ms}ms`);
    console.log(
      `   Difference: ${Math.abs(pdfData.processing_time_ms - textData.processing_time_ms)}ms\n`
    );

    // Success comparison
    console.log('✅ SUCCESS RATE:');
    console.log(
      `   PDF Processing: ${pdfData.success ? '✅ Success' : '❌ Failed'}`
    );
    console.log(
      `   Text Processing: ${textData.success ? '✅ Success' : '❌ Failed'}\n`
    );

    if (pdfData.success && textData.success) {
      // Detailed field comparison
      console.log('📋 FIELD-BY-FIELD COMPARISON');
      console.log('============================\n');

      // Desired titles comparison
      console.log('🎯 DESIRED TITLES:');
      console.log(`   PDF: ${pdfData.data.desired_titles?.length || 0} titles`);
      if (pdfData.data.desired_titles?.length > 0) {
        pdfData.data.desired_titles.forEach((title, index) => {
          console.log(`      ${index + 1}. "${title}"`);
        });
      }
      console.log(
        `   Text: ${textData.data.desired_titles?.length || 0} titles`
      );
      if (textData.data.desired_titles?.length > 0) {
        textData.data.desired_titles.forEach((title, index) => {
          console.log(`      ${index + 1}. "${title}"`);
        });
      }
      console.log('');

      // Summary comparison
      console.log('📝 SUMMARY:');
      console.log(`   PDF: ${pdfData.data.summary?.length || 0} characters`);
      if (pdfData.data.summary) {
        console.log(`      "${pdfData.data.summary}"`);
      }
      console.log(`   Text: ${textData.data.summary?.length || 0} characters`);
      if (textData.data.summary) {
        console.log(`      "${textData.data.summary}"`);
      }
      console.log('');

      // Skills comparison
      console.log('🛠️  SKILLS:');
      console.log(`   PDF: ${pdfData.data.skills?.length || 0} skills`);
      if (pdfData.data.skills?.length > 0) {
        pdfData.data.skills.forEach((skill, index) => {
          if (typeof skill === 'object' && skill.name) {
            console.log(
              `      ${index + 1}. ${skill.name} (Level: ${skill.level || 'N/A'})`
            );
          } else {
            console.log(`      ${index + 1}. "${skill}"`);
          }
        });
      }
      console.log(`   Text: ${textData.data.skills?.length || 0} skills`);
      if (textData.data.skills?.length > 0) {
        textData.data.skills.forEach((skill, index) => {
          if (typeof skill === 'object' && skill.name) {
            console.log(
              `      ${index + 1}. ${skill.name} (Level: ${skill.level || 'N/A'})`
            );
          } else {
            console.log(`      ${index + 1}. "${skill}"`);
          }
        });
      }
      console.log('');

      // Experience comparison
      console.log('💼 EXPERIENCE:');
      console.log(`   PDF: ${pdfData.data.experience?.length || 0} positions`);
      if (pdfData.data.experience?.length > 0) {
        pdfData.data.experience.forEach((exp, index) => {
          console.log(
            `      ${index + 1}. ${exp.title || 'No Title'} at ${exp.employer || 'Unknown'}`
          );
          console.log(
            `         Period: ${exp.start || 'N/A'} - ${exp.end || 'N/A'}`
          );
        });
      }
      console.log(
        `   Text: ${textData.data.experience?.length || 0} positions`
      );
      if (textData.data.experience?.length > 0) {
        textData.data.experience.forEach((exp, index) => {
          console.log(
            `      ${index + 1}. ${exp.title || 'No Title'} at ${exp.employer || 'Unknown'}`
          );
          console.log(
            `         Period: ${exp.start || 'N/A'} - ${exp.end || 'N/A'}`
          );
        });
      }
      console.log('');

      // Quality scores comparison
      console.log('📊 QUALITY SCORES:');
      const pdfQuality = calculateOverallQuality(pdfData.data);
      const textQuality = calculateOverallQuality(textData.data);
      console.log(
        `   PDF Quality: ${pdfQuality}/100 (${getQualityGrade(pdfQuality)})`
      );
      console.log(
        `   Text Quality: ${textQuality}/100 (${getQualityGrade(textQuality)})`
      );
      console.log(
        `   Difference: ${Math.abs(pdfQuality - textQuality)} points\n`
      );

      // Missing fields comparison
      console.log('⚠️  MISSING FIELDS:');
      const pdfMissing = analyzeMissingFields(pdfData.data);
      const textMissing = analyzeMissingFields(textData.data);
      console.log(`   PDF Missing: ${pdfMissing.length} fields`);
      if (pdfMissing.length > 0) {
        pdfMissing.forEach(field => {
          console.log(`      ❌ ${field}`);
        });
      }
      console.log(`   Text Missing: ${textMissing.length} fields`);
      if (textMissing.length > 0) {
        textMissing.forEach(field => {
          console.log(`      ❌ ${field}`);
        });
      }
      console.log('');

      // Similarity analysis
      console.log('🔄 SIMILARITY ANALYSIS:');
      const titleSimilarity = calculateSimilarity(
        pdfData.data.desired_titles || [],
        textData.data.desired_titles || []
      );
      const skillSimilarity = calculateSimilarity(
        pdfData.data.skills || [],
        textData.data.skills || []
      );
      const expSimilarity = calculateSimilarity(
        pdfData.data.experience || [],
        textData.data.experience || []
      );

      console.log(`   Title Similarity: ${Math.round(titleSimilarity * 100)}%`);
      console.log(`   Skill Similarity: ${Math.round(skillSimilarity * 100)}%`);
      console.log(
        `   Experience Similarity: ${Math.round(expSimilarity * 100)}%`
      );
      console.log(
        `   Overall Similarity: ${Math.round(((titleSimilarity + skillSimilarity + expSimilarity) / 3) * 100)}%\n`
      );
    } else {
      console.log('❌ Cannot compare - one or both processing attempts failed');
      if (!pdfData.success && pdfData.errors) {
        console.log('PDF Errors:', pdfData.errors.join(', '));
      }
      if (!textData.success && textData.errors) {
        console.log('Text Errors:', textData.errors.join(', '));
      }
    }

    console.log('✅ Comparison Complete!');
    console.log('\n📝 Key Insights:');
    console.log(
      '   - PDF processing currently treats PDF as text (limited success)'
    );
    console.log('   - Text processing extracts much more detailed information');
    console.log(
      '   - When PDF processing is implemented, results should be similar to text processing'
    );
    console.log(
      '   - Current PDF processing is mainly useful for testing API structure'
    );
  } catch (error) {
    console.error('❌ Comparison failed:', error.message);
  }
}

/**
 * Calculate similarity between two arrays
 */
function calculateSimilarity(arr1, arr2) {
  if (arr1.length === 0 && arr2.length === 0) return 1;
  if (arr1.length === 0 || arr2.length === 0) return 0;

  const set1 = new Set(
    arr1.map(item =>
      typeof item === 'string'
        ? item.toLowerCase()
        : item.name?.toLowerCase() || item.title?.toLowerCase() || ''
    )
  );
  const set2 = new Set(
    arr2.map(item =>
      typeof item === 'string'
        ? item.toLowerCase()
        : item.name?.toLowerCase() || item.title?.toLowerCase() || ''
    )
  );

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

/**
 * Calculate overall quality score
 */
function calculateOverallQuality(data) {
  let score = 0;

  if (data.desired_titles && data.desired_titles.length > 0) score += 20;
  if (data.summary && data.summary.length > 50) score += 15;
  else if (data.summary) score += 5;

  if (data.skills && data.skills.length > 0) {
    const objectSkills = data.skills.filter(
      skill => typeof skill === 'object' && skill.name
    );
    if (objectSkills.length === data.skills.length) score += 20;
    else if (objectSkills.length > 0) score += 15;
    else score += 10;
  }

  if (data.experience && data.experience.length > 0) {
    const completeEntries = data.experience.filter(
      exp => exp.title && exp.start && exp.description
    );
    if (completeEntries.length === data.experience.length) score += 25;
    else if (completeEntries.length > 0) score += 15;
    else score += 5;
  }

  if (data.location_preference) score += 5;
  if (data.schedule) score += 5;
  if (data.salary_expectation) score += 5;
  if (data.availability) score += 5;

  return score;
}

/**
 * Get quality grade
 */
function getQualityGrade(score) {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

/**
 * Analyze missing fields
 */
function analyzeMissingFields(data) {
  const missing = [];

  if (!data.desired_titles || data.desired_titles.length === 0)
    missing.push('Desired Titles');
  if (!data.summary || data.summary.length < 50) missing.push('Summary');
  if (!data.skills || data.skills.length === 0) missing.push('Skills');
  if (!data.experience || data.experience.length === 0)
    missing.push('Experience');
  if (!data.location_preference) missing.push('Location Preference');
  if (!data.schedule) missing.push('Schedule');
  if (!data.salary_expectation) missing.push('Salary Expectation');
  if (!data.availability) missing.push('Availability');

  return missing;
}

/**
 * Show usage instructions
 */
function showUsage() {
  console.log('🔄 PDF vs Text Comparison Tool');
  console.log('==============================\n');

  console.log('Usage:');
  console.log('  node compare-pdf-text.js <pdf-path> <text-path>');
  console.log('');

  console.log('Examples:');
  console.log('  # Compare existing files:');
  console.log(
    '  node compare-pdf-text.js "tests/sample-resumes/pdf/international/Ивановская Мария.pdf" "tests/sample-resumes/russian-it-specialist.txt"'
  );
  console.log(
    '  node compare-pdf-text.js "tests/sample-resumes/pdf/simple/sumanprasad_08Jun_30.pdf" "tests/sample-resumes/senior-backend-engineer.txt"'
  );
  console.log('');

  console.log('This tool will:');
  console.log('  ✅ Compare PDF vs text processing results');
  console.log('  ✅ Show detailed field-by-field analysis');
  console.log('  ✅ Calculate quality scores for both methods');
  console.log('  ✅ Analyze similarity between results');
  console.log('  ✅ Identify which method extracts better data');
}

// Main execution
const pdfPath = process.argv[2];
const textPath = process.argv[3];

if (!pdfPath || !textPath) {
  showUsage();
  process.exit(1);
}

comparePDFvsText(pdfPath, textPath).catch(error => {
  console.error('❌ Comparison failed:', error);
  process.exit(1);
});
