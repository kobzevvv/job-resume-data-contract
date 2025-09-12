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
          content: "You are an expert resume parser. Extract structured data from resumes and return valid JSON only. If you cannot extract a field, omit it from the response."
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
Extract the following information from this resume and return ONLY a valid JSON object:

REQUIRED FIELDS:
- desired_titles: Array of target job titles/roles
- summary: Professional summary or objective
- skills: Array of skills with levels (1-5) and types
- experience: Array of work experiences with titles, dates, descriptions

OPTIONAL FIELDS:
- location_preference: Remote/hybrid/onsite preferences
- schedule: Employment type (full_time, part_time, etc.)
- salary_expectation: Salary info with currency and range
- availability: When can start
- links: Professional links (LinkedIn, GitHub, etc.)

SKILL LEVELS: 1=Basic, 2=Limited, 3=Proficient, 4=Advanced, 5=Expert
DATE FORMAT: Use YYYY-MM for dates, "present" for current positions

EXAMPLE SKILL FORMAT:
{
  "name": "Python",
  "level": 4,
  "label": "advanced",
  "type": "programming_language",
  "notes": "5+ years experience"
}

RESUME TEXT:
${resumeText}

Return only valid JSON:`;
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
    
    // Ensure required fields are present
    if (!parsed.desired_titles || !parsed.summary || !parsed.skills || !parsed.experience) {
      console.warn('AI response missing required fields');
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
 * Identifies fields that couldn't be mapped from the original text
 */
function findUnmappedFields(originalText: string, extractedData: Partial<ResumeData> | null): string[] {
  const unmappedFields: string[] = [];
  
  if (!extractedData) {
    return ['All fields - AI extraction failed'];
  }
  
  // Check for common resume sections that might not have been extracted
  const commonSections = [
    'education',
    'certifications',
    'projects',
    'awards',
    'languages',
    'references',
    'volunteer',
    'publications'
  ];
  
  const lowerCaseText = originalText.toLowerCase();
  
  commonSections.forEach(section => {
    if (lowerCaseText.includes(section) && !hasRelatedField(extractedData, section)) {
      unmappedFields.push(section);
    }
  });
  
  // Check for missing standard fields
  if (!extractedData.desired_titles?.length) unmappedFields.push('desired_titles');
  if (!extractedData.summary) unmappedFields.push('summary');
  if (!extractedData.skills?.length) unmappedFields.push('skills');
  if (!extractedData.experience?.length) unmappedFields.push('experience');
  
  return unmappedFields;
}

/**
 * Checks if extracted data has fields related to a section
 */
function hasRelatedField(data: Partial<ResumeData>, section: string): boolean {
  switch (section) {
    case 'education':
      // No education field in schema, might be in experience or skills
      return data.experience?.some(exp => 
        exp.description?.toLowerCase().includes('education') ||
        exp.title?.toLowerCase().includes('student')
      ) || false;
    
    case 'languages':
      return data.skills?.some(skill => 
        typeof skill === 'object' && skill.type === 'spoken_language'
      ) || false;
    
    case 'projects':
      return data.experience?.some(exp =>
        exp.description?.toLowerCase().includes('project')
      ) || false;
    
    default:
      return false;
  }
}
