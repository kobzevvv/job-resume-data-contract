import { Env, ResumeData } from './types';

// AI model to use for resume processing
const AI_MODEL = '@cf/meta/llama-2-7b-chat-int8';

/**
 * Processes resume text using Cloudflare AI to extract structured data
 */
export async function processResumeWithAI(resumeText: string, env: Env): Promise<{
  data: Partial<ResumeData> | null;
  unmapped_fields: string[];
}> {
  try {
    const prompt = createExtractionPrompt(resumeText);
    
    const response = await env.AI.run(AI_MODEL, {
      messages: [
        {
          role: "system",
          content: "You are an expert resume parser. Extract structured data and return valid JSON. Convert dates to YYYY-MM format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2048,
      temperature: 0.1, // Low temperature for consistent extraction
    });

    // Parse AI response
    const aiOutput = response.response || '';
    const extractedData = parseAIResponse(aiOutput);
    const unmappedFields = findUnmappedFields(resumeText, extractedData);

    return {
      data: extractedData,
      unmapped_fields: unmappedFields
    };

  } catch (error) {
    console.error('AI processing failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      model: AI_MODEL,
      timestamp: new Date().toISOString()
    });
    
    return {
      data: null,
      unmapped_fields: []
    };
  }
}

/**
 * Creates a structured prompt for resume data extraction
 */
function createExtractionPrompt(resumeText: string): string {
  return `
Parse this resume and return valid JSON:

{
  "desired_titles": ["job titles wanted"],
  "summary": "professional summary",
  "skills": [{"name": "skill", "level": 1-5, "type": "programming_language"}],
  "experience": [{"employer": "company", "title": "role", "start": "YYYY-MM", "end": "YYYY-MM", "description": "work done"}]
}

Key rules:
- Convert dates like "March 2022" to "2022-03"
- Use "present" for current jobs
- Skill levels: 1=Basic, 5=Expert

Resume:
${resumeText}

JSON:`;
}

/**
 * Parses AI response and extracts structured data
 */
function parseAIResponse(aiOutput: string): Partial<ResumeData> | null {
  try {
    // Clean up the response - remove markdown, explanations, etc.
    let cleanJson = aiOutput.trim();
    
    // Find JSON object in the response
    const jsonStart = cleanJson.indexOf('{');
    const jsonEnd = cleanJson.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('No JSON object found in AI response');
    }
    
    cleanJson = cleanJson.substring(jsonStart, jsonEnd + 1);
    
    // Parse and validate basic structure
    const parsed = JSON.parse(cleanJson);
    
    // Basic date normalization
    if (parsed.experience && Array.isArray(parsed.experience)) {
      parsed.experience = parsed.experience.map((exp: any) => {
        if (exp.start && typeof exp.start === 'string') {
          exp.start = normalizeDateFormat(exp.start);
        }
        if (exp.end && typeof exp.end === 'string' && exp.end.toLowerCase() !== 'present') {
          exp.end = normalizeDateFormat(exp.end);
        }
        return exp;
      });
    }
    
    return parsed as Partial<ResumeData>;
    
  } catch (error) {
    console.error('Failed to parse AI response:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      response_preview: aiOutput.substring(0, 200)
    });
    return null;
  }
}

/**
 * Simple date format normalization
 */
function normalizeDateFormat(dateStr: string): string {
  const cleaned = dateStr.trim().toLowerCase();
  
  // Already in correct format
  if (/^\d{4}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }
  
  // Handle "present" variants
  if (cleaned === 'present' || cleaned === 'current') {
    return 'present';
  }
  
  // Convert "March 2022" to "2022-03"
  const monthNames: { [key: string]: string } = {
    'january': '01', 'jan': '01', 'february': '02', 'feb': '02',
    'march': '03', 'mar': '03', 'april': '04', 'apr': '04',
    'may': '05', 'june': '06', 'jun': '06', 'july': '07', 'jul': '07',
    'august': '08', 'aug': '08', 'september': '09', 'sep': '09',
    'october': '10', 'oct': '10', 'november': '11', 'nov': '11',
    'december': '12', 'dec': '12'
  };
  
  const monthYearMatch = cleaned.match(/([a-z]+)\s+(\d{4})/);
  if (monthYearMatch && monthYearMatch.length > 2) {
    const monthName = monthYearMatch[1];
    const year = monthYearMatch[2];
    if (monthName && year && monthNames[monthName]) {
      return `${year}-${monthNames[monthName]}`;
    }
  }
  
  return dateStr;
}

/**
 * Identifies fields that couldn't be mapped from the original text
 */
function findUnmappedFields(originalText: string, extractedData: Partial<ResumeData> | null): string[] {
  const unmappedFields: string[] = [];
  
  if (!extractedData) {
    return ['All fields - AI extraction failed'];
  }
  
  // Check for common resume sections that might not have been extracted
  const commonSections = ['education', 'certifications', 'projects', 'awards', 'languages'];
  const lowerCaseText = originalText.toLowerCase();
  
  commonSections.forEach(section => {
    if (lowerCaseText.includes(section)) {
      unmappedFields.push(section);
    }
  });
  
  return unmappedFields;
}
