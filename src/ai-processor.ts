import { Env, ResumeData } from './types';

// AI model to use for resume processing
const AI_MODEL = '@cf/meta/llama-2-7b-chat-int8';

/**
 * Processes resume text using Cloudflare AI to extract structured data
 */
export async function processResumeWithAI(resumeText: string, env: Env, language: string = 'en'): Promise<{
  data: Partial<ResumeData> | null;
  unmapped_fields: string[];
}> {
  try {
    const prompt = createExtractionPrompt(resumeText, language);
    const systemMessage = getSystemMessage(language);
    
    const response = await env.AI.run(AI_MODEL, {
      messages: [
        {
          role: "system",
          content: systemMessage
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
 * Gets system message based on language
 */
function getSystemMessage(language: string): string {
  switch (language.toLowerCase()) {
    case 'ru':
      return "Вы - эксперт по анализу резюме. Извлекайте структурированные данные и возвращайте валидный JSON. Конвертируйте даты в формат YYYY-MM. Все поля в JSON должны быть на русском языке, соответствующем языку резюме.";
    case 'en':
    default:
      return "You are an expert resume parser. Extract structured data and return valid JSON. Convert dates to YYYY-MM format.";
  }
}

/**
 * Creates a structured prompt for resume data extraction based on language
 */
function createExtractionPrompt(resumeText: string, language: string = 'en'): string {
  switch (language.toLowerCase()) {
    case 'ru':
      return `
Проанализируйте это резюме и верните валидный JSON:

{
  "desired_titles": ["желаемые должности"],
  "summary": "профессиональное резюме",
  "skills": [{"name": "навык", "level": 1-5, "type": "programming_language"}],
  "experience": [{"employer": "компания", "title": "должность", "start": "YYYY-MM", "end": "YYYY-MM", "description": "выполненная работа"}]
}

Ключевые правила:
- Конвертируйте даты типа "Март 2022" в "2022-03"
- Используйте "present" для текущих работ
- Уровни навыков: 1=Базовый, 2=Ограниченный, 3=Профессиональный, 4=Продвинутый, 5=Эксперт
- ВСЕ значения в JSON должны быть на русском языке
- Переводите названия должностей, компаний и описания на русский язык, если они указаны на английском

Резюме:
${resumeText}

JSON:`;
    
    case 'en':
    default:
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
- Skill levels: 1=Basic, 2=Limited, 3=Proficient, 4=Advanced, 5=Expert

Resume:
${resumeText}

JSON:`;
  }
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
  
  // Handle "present" variants in multiple languages
  if (cleaned === 'present' || cleaned === 'current' || 
      cleaned === 'настоящее время' || cleaned === 'по настоящее время' ||
      cleaned === 'настоящее' || cleaned === 'сейчас') {
    return 'present';
  }
  
  // Convert "March 2022" to "2022-03" - English and Russian months
  const monthNames: { [key: string]: string } = {
    // English months
    'january': '01', 'jan': '01', 'february': '02', 'feb': '02',
    'march': '03', 'mar': '03', 'april': '04', 'apr': '04',
    'may': '05', 'june': '06', 'jun': '06', 'july': '07', 'jul': '07',
    'august': '08', 'aug': '08', 'september': '09', 'sep': '09',
    'october': '10', 'oct': '10', 'november': '11', 'nov': '11',
    'december': '12', 'dec': '12',
    // Russian months
    'январь': '01', 'янв': '01', 'февраль': '02', 'фев': '02',
    'март': '03', 'мар': '03', 'апрель': '04', 'апр': '04',
    'май': '05', 'июнь': '06', 'июн': '06', 'июль': '07', 'июл': '07',
    'август': '08', 'авг': '08', 'сентябрь': '09', 'сен': '09',
    'октябрь': '10', 'окт': '10', 'ноябрь': '11', 'ноя': '11',
    'декабрь': '12', 'дек': '12'
  };
  
  // Match patterns like "март 2020" or "march 2020" or "2020 март"
  const monthYearMatch = cleaned.match(/([а-яa-z]+)\s+(\d{4})|(\d{4})\s+([а-яa-z]+)/);
  if (monthYearMatch && monthYearMatch.length > 2) {
    const monthName = monthYearMatch[1] || monthYearMatch[4];
    const year = monthYearMatch[2] || monthYearMatch[3];
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
