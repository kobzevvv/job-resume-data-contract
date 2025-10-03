#!/usr/bin/env node

/**
 * Detailed PDF Testing Script
 * Shows parsed content and validates data element matching
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const WORKER_URL = 'https://resume-processor-worker.dev-a96.workers.dev';

/**
 * Test PDF processing with detailed content analysis
 */
async function testPDFDetailed(pdfPath) {
  console.log('🔍 Detailed PDF Content Analysis');
  console.log('==================================\n');

  try {
    // Read PDF file
    const pdfBuffer = readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');

    console.log(`📄 PDF File: ${pdfPath.split('/').pop()}`);
    console.log(`📊 File Size: ${Math.round(pdfBuffer.length / 1024)}KB`);
    console.log(`🔢 Base64 Size: ${Math.round(pdfBase64.length / 1024)}KB\n`);

    // Extract text from PDF using pdftotext
    console.log('🔍 Extracting text from PDF...');
    const { execSync } = await import('child_process');
    const tempTextFile = `/tmp/extracted_${Date.now()}.txt`;

    try {
      execSync(`pdftotext "${pdfPath}" "${tempTextFile}"`, { stdio: 'pipe' });
      const extractedText = readFileSync(tempTextFile, 'utf8');

      if (extractedText.trim().length === 0) {
        console.log(
          '⚠️  No text could be extracted from PDF (may be image-based)'
        );
        console.log('Using base64 data as fallback...\n');

        const requestBody = {
          resume_text: `PDF File: ${pdfPath.split('/').pop()}\nBase64 Data: ${pdfBase64.substring(0, 100)}...`,
          language: 'en',
          options: {
            flexible_validation: true,
            include_unmapped: true,
          },
        };
      } else {
        console.log(`✅ Extracted ${extractedText.length} characters from PDF`);
        console.log(`📝 Text preview: ${extractedText.substring(0, 200)}...\n`);

        // Test current API with extracted text
        console.log('🔍 Testing Current API with extracted text...\n');

        const requestBody = {
          resume_text: extractedText,
          language: 'en',
          options: {
            flexible_validation: true,
            include_unmapped: true,
          },
        };
      }
    } catch (error) {
      console.log('⚠️  PDF text extraction failed:', error.message);
      console.log('Using base64 data as fallback...\n');

      const requestBody = {
        resume_text: `PDF File: ${pdfPath.split('/').pop()}\nBase64 Data: ${pdfBase64.substring(0, 100)}...`,
        language: 'en',
        options: {
          flexible_validation: true,
          include_unmapped: true,
        },
      };
    }

    const response = await fetch(`${WORKER_URL}/process-resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    console.log(`✅ API Status: ${response.status}`);
    console.log(`✅ Success: ${data.success}`);
    console.log(`⏱️  Processing Time: ${data.processing_time_ms}ms\n`);

    // Detailed content analysis
    if (data.success && data.data) {
      console.log('📋 DETAILED PARSED CONTENT ANALYSIS');
      console.log('====================================\n');

      // 1. Desired Titles Analysis
      console.log('🎯 DESIRED TITLES:');
      if (data.data.desired_titles && data.data.desired_titles.length > 0) {
        data.data.desired_titles.forEach((title, index) => {
          console.log(`   ${index + 1}. "${title}"`);
        });
      } else {
        console.log('   ❌ No job titles found');
      }
      console.log('');

      // 2. Summary Analysis
      console.log('📝 SUMMARY:');
      if (data.data.summary) {
        console.log(`   Length: ${data.data.summary.length} characters`);
        console.log(`   Content: "${data.data.summary}"`);
        console.log(`   Quality: ${analyzeSummaryQuality(data.data.summary)}`);
      } else {
        console.log('   ❌ No summary found');
      }
      console.log('');

      // 3. Skills Analysis
      console.log('🛠️  SKILLS:');
      if (data.data.skills && data.data.skills.length > 0) {
        console.log(`   Total Skills: ${data.data.skills.length}`);
        data.data.skills.forEach((skill, index) => {
          if (typeof skill === 'object' && skill.name) {
            console.log(
              `   ${index + 1}. ${skill.name} (Level: ${skill.level || 'N/A'}, Type: ${skill.type || 'N/A'})`
            );
          } else {
            console.log(`   ${index + 1}. "${skill}"`);
          }
        });
        console.log(`   Quality: ${analyzeSkillsQuality(data.data.skills)}`);
      } else {
        console.log('   ❌ No skills found');
      }
      console.log('');

      // 4. Experience Analysis
      console.log('💼 EXPERIENCE:');
      if (data.data.experience && data.data.experience.length > 0) {
        console.log(`   Total Positions: ${data.data.experience.length}`);
        data.data.experience.forEach((exp, index) => {
          console.log(`   ${index + 1}. ${exp.title || 'No Title'}`);
          console.log(`      Employer: ${exp.employer || 'Not specified'}`);
          console.log(
            `      Period: ${exp.start || 'N/A'} - ${exp.end || 'N/A'}`
          );
          console.log(`      Location: ${exp.location || 'Not specified'}`);
          console.log(
            `      Description: "${exp.description ? exp.description.substring(0, 100) + '...' : 'No description'}"`
          );
        });
        console.log(
          `   Quality: ${analyzeExperienceQuality(data.data.experience)}`
        );
      } else {
        console.log('   ❌ No experience found');
      }
      console.log('');

      // 5. Location Preference Analysis
      console.log('📍 LOCATION PREFERENCE:');
      if (data.data.location_preference) {
        console.log(
          `   Type: ${data.data.location_preference.type || 'Not specified'}`
        );
        if (data.data.location_preference.preferred_locations) {
          console.log(
            `   Preferred Locations: ${data.data.location_preference.preferred_locations.join(', ')}`
          );
        }
      } else {
        console.log('   ❌ No location preference found');
      }
      console.log('');

      // 6. Schedule Analysis
      console.log('⏰ SCHEDULE:');
      if (data.data.schedule) {
        console.log(`   Schedule: ${data.data.schedule}`);
      } else {
        console.log('   ❌ No schedule preference found');
      }
      console.log('');

      // 7. Salary Expectation Analysis
      console.log('💰 SALARY EXPECTATION:');
      if (data.data.salary_expectation) {
        const salary = data.data.salary_expectation;
        console.log(`   Currency: ${salary.currency || 'Not specified'}`);
        console.log(
          `   Range: ${salary.min || 'N/A'} - ${salary.max || 'N/A'}`
        );
        console.log(`   Periodicity: ${salary.periodicity || 'Not specified'}`);
      } else {
        console.log('   ❌ No salary expectation found');
      }
      console.log('');

      // 8. Availability Analysis
      console.log('📅 AVAILABILITY:');
      if (data.data.availability) {
        console.log(`   Availability: "${data.data.availability}"`);
      } else {
        console.log('   ❌ No availability information found');
      }
      console.log('');

      // 9. Links Analysis
      console.log('🔗 LINKS:');
      if (data.data.links && data.data.links.length > 0) {
        data.data.links.forEach((link, index) => {
          console.log(`   ${index + 1}. ${link.label}: ${link.url}`);
        });
      } else {
        console.log('   ❌ No links found');
      }
      console.log('');

      // 10. Data Quality Assessment
      console.log('📊 OVERALL DATA QUALITY ASSESSMENT');
      console.log('===================================');
      const qualityScore = calculateOverallQuality(data.data);
      console.log(`   Overall Quality Score: ${qualityScore}/100`);
      console.log(`   Grade: ${getQualityGrade(qualityScore)}`);
      console.log(`   Status: ${getQualityStatus(qualityScore)}\n`);

      // 11. Missing Fields Analysis
      console.log('⚠️  MISSING FIELDS ANALYSIS');
      console.log('===========================');
      const missingFields = analyzeMissingFields(data.data);
      if (missingFields.length > 0) {
        console.log('   Missing or incomplete fields:');
        missingFields.forEach(field => {
          console.log(`   ❌ ${field}`);
        });
      } else {
        console.log('   ✅ All major fields are present');
      }
      console.log('');
    } else {
      console.log('❌ No data extracted from PDF');
      if (data.errors && data.errors.length > 0) {
        console.log('Errors:');
        data.errors.forEach(error => {
          console.log(`   - ${error}`);
        });
      }
    }

    // Show unmapped fields
    if (data.unmapped_fields && data.unmapped_fields.length > 0) {
      console.log('🔍 UNMAPPED FIELDS:');
      console.log('===================');
      data.unmapped_fields.forEach(field => {
        console.log(`   - ${field}`);
      });
      console.log('');
    }

    // Show validation errors
    if (data.validation_errors && data.validation_errors.length > 0) {
      console.log('⚠️  VALIDATION ERRORS:');
      console.log('======================');
      data.validation_errors.forEach(error => {
        console.log(`   - ${error.field}: ${error.error} (${error.severity})`);
        if (error.suggestion) {
          console.log(`     Suggestion: ${error.suggestion}`);
        }
      });
      console.log('');
    }

    // Show metadata
    if (data.metadata) {
      console.log('📋 METADATA:');
      console.log('============');
      console.log(
        `   Format Detected: ${data.metadata.format_detected || 'Unknown'}`
      );
      console.log(
        `   Format Confidence: ${data.metadata.format_confidence || 'N/A'}`
      );
      console.log(`   AI Model: ${data.metadata.ai_model_used || 'Unknown'}`);
      console.log(
        `   Worker Version: ${data.metadata.worker_version || 'Unknown'}`
      );
      console.log(`   Timestamp: ${data.metadata.timestamp || 'Unknown'}`);
      console.log('');
    }

    console.log('✅ Detailed PDF Analysis Complete!');
    console.log('\n📝 Summary:');
    console.log(
      '   - This shows how well the current API processes PDF data as text'
    );
    console.log('   - PDF processing is not yet implemented (returns 404)');
    console.log(
      '   - When PDF processing is available, text extraction will be much better'
    );
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

/**
 * Analyze summary quality
 */
function analyzeSummaryQuality(summary) {
  if (!summary) return 'Poor';

  const length = summary.length;
  if (length < 50) return 'Poor (too short)';
  if (length < 100) return 'Fair (short)';
  if (length < 200) return 'Good';
  return 'Excellent';
}

/**
 * Analyze skills quality
 */
function analyzeSkillsQuality(skills) {
  if (!skills || skills.length === 0) return 'Poor (no skills)';

  const objectSkills = skills.filter(
    skill => typeof skill === 'object' && skill.name
  );
  const totalSkills = skills.length;

  if (objectSkills.length === totalSkills) return 'Excellent (all structured)';
  if (objectSkills.length > totalSkills * 0.5)
    return 'Good (mostly structured)';
  if (objectSkills.length > 0) return 'Fair (some structured)';
  return 'Poor (all unstructured)';
}

/**
 * Analyze experience quality
 */
function analyzeExperienceQuality(experience) {
  if (!experience || experience.length === 0) return 'Poor (no experience)';

  const completeEntries = experience.filter(
    exp => exp.title && exp.start && exp.description
  );

  const totalEntries = experience.length;

  if (completeEntries.length === totalEntries)
    return 'Excellent (all complete)';
  if (completeEntries.length > totalEntries * 0.7)
    return 'Good (mostly complete)';
  if (completeEntries.length > 0) return 'Fair (some complete)';
  return 'Poor (incomplete entries)';
}

/**
 * Calculate overall quality score
 */
function calculateOverallQuality(data) {
  let score = 0;
  let maxScore = 100;

  // Desired titles (20 points)
  if (data.desired_titles && data.desired_titles.length > 0) {
    score += 20;
  }

  // Summary (15 points)
  if (data.summary && data.summary.length > 50) {
    score += 15;
  } else if (data.summary) {
    score += 5;
  }

  // Skills (20 points)
  if (data.skills && data.skills.length > 0) {
    const objectSkills = data.skills.filter(
      skill => typeof skill === 'object' && skill.name
    );
    if (objectSkills.length === data.skills.length) {
      score += 20;
    } else if (objectSkills.length > 0) {
      score += 15;
    } else {
      score += 10;
    }
  }

  // Experience (25 points)
  if (data.experience && data.experience.length > 0) {
    const completeEntries = data.experience.filter(
      exp => exp.title && exp.start && exp.description
    );
    if (completeEntries.length === data.experience.length) {
      score += 25;
    } else if (completeEntries.length > 0) {
      score += 15;
    } else {
      score += 5;
    }
  }

  // Location preference (5 points)
  if (data.location_preference) {
    score += 5;
  }

  // Schedule (5 points)
  if (data.schedule) {
    score += 5;
  }

  // Salary expectation (5 points)
  if (data.salary_expectation) {
    score += 5;
  }

  // Availability (5 points)
  if (data.availability) {
    score += 5;
  }

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
 * Get quality status
 */
function getQualityStatus(score) {
  if (score >= 80) return 'Excellent - Ready for production';
  if (score >= 60) return 'Good - Minor improvements needed';
  if (score >= 40) return 'Fair - Significant improvements needed';
  return 'Poor - Major issues to address';
}

/**
 * Analyze missing fields
 */
function analyzeMissingFields(data) {
  const missing = [];

  if (!data.desired_titles || data.desired_titles.length === 0) {
    missing.push('Desired Titles');
  }

  if (!data.summary || data.summary.length < 50) {
    missing.push('Summary (or too short)');
  }

  if (!data.skills || data.skills.length === 0) {
    missing.push('Skills');
  }

  if (!data.experience || data.experience.length === 0) {
    missing.push('Experience');
  }

  if (!data.location_preference) {
    missing.push('Location Preference');
  }

  if (!data.schedule) {
    missing.push('Schedule');
  }

  if (!data.salary_expectation) {
    missing.push('Salary Expectation');
  }

  if (!data.availability) {
    missing.push('Availability');
  }

  if (!data.links || data.links.length === 0) {
    missing.push('Links');
  }

  return missing;
}

/**
 * Show usage instructions
 */
function showUsage() {
  console.log('🔍 Detailed PDF Content Analysis Tool');
  console.log('=====================================\n');

  console.log('Usage:');
  console.log('  node test-pdf-detailed.js <path-to-pdf>');
  console.log('');

  console.log('Examples:');
  console.log('  # Test existing PDFs with detailed analysis:');
  console.log(
    '  node test-pdf-detailed.js "tests/sample-resumes/pdf/international/Ивановская Мария.pdf"'
  );
  console.log(
    '  node test-pdf-detailed.js "tests/sample-resumes/pdf/simple/sumanprasad_08Jun_30.pdf"'
  );
  console.log('');
  console.log('  # Test your own PDF:');
  console.log('  node test-pdf-detailed.js "/path/to/your/resume.pdf"');
  console.log('');

  console.log('This tool will:');
  console.log('  ✅ Show detailed parsed content from each data element');
  console.log('  ✅ Analyze data quality and completeness');
  console.log('  ✅ Identify missing or incomplete fields');
  console.log('  ✅ Provide quality scoring and recommendations');
  console.log('  ✅ Show validation errors and suggestions');
}

// Main execution
const pdfPath = process.argv[2];

if (!pdfPath) {
  showUsage();
  process.exit(1);
}

testPDFDetailed(pdfPath).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
