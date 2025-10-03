import { Env, ResumeData, PartialResumeData, Skill } from './types';

// AI model to use for resume processing
const AI_MODEL = '@cf/meta/llama-2-7b-chat-int8';

/**
 * Processes resume text using Cloudflare AI to extract structured data
 */
export async function processResumeWithAI(
  resumeText: string,
  env: Env,
  language: string = 'en',
  options: { use_fallback?: boolean; detect_format?: boolean } = {}
): Promise<{
  data: Partial<ResumeData> | PartialResumeData | null;
  unmapped_fields: string[];
  format_detected?: 'chronological' | 'functional' | 'hybrid';
  format_confidence?: number;
}> {
  try {
    const { use_fallback = true, detect_format = true } = options;

    // Detect resume format first if requested
    let formatDetected: 'chronological' | 'functional' | 'hybrid' | undefined;
    let formatConfidence: number | undefined;

    if (detect_format) {
      const formatResult = detectResumeFormat(resumeText);
      formatDetected = formatResult.format;
      formatConfidence = formatResult.confidence;
    }

    const prompt = createExtractionPrompt(resumeText, language, formatDetected);
    const systemMessage = getSystemMessage(language);

    const response = await env.AI.run(AI_MODEL, {
      messages: [
        {
          role: 'system',
          content: systemMessage,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 2048,
      temperature: 0.1, // Low temperature for consistent extraction
    });

    // Parse AI response
    const aiOutput = response.response || '';
    let extractedData = parseAIResponse(aiOutput);
    let unmappedFields = findUnmappedFields(resumeText, extractedData);

    // Apply fallback extraction if enabled and data is incomplete
    if (use_fallback && extractedData) {
      const fallbackResult = applyFallbackExtraction(
        resumeText,
        extractedData,
        language
      );
      extractedData = fallbackResult.data;
      unmappedFields = fallbackResult.unmapped_fields;
    }

    // Always apply experience description fallback if missing or empty
    if (extractedData && extractedData.experience && Array.isArray(extractedData.experience)) {
      extractedData.experience = extractedData.experience.map((exp: any) => {
        if (!exp.description || exp.description.trim().length === 0) {
          // Generate a meaningful description based on job title and company
          const title = exp.title || 'Position';
          const employer = exp.employer || 'Company';
          
          // Choose description based on job title keywords
          if (title.toLowerCase().includes('engineer') || title.toLowerCase().includes('developer')) {
            exp.description = `Developed and maintained software solutions, collaborated with cross-functional teams, and contributed to technical projects at ${employer}`;
          } else if (title.toLowerCase().includes('manager') || title.toLowerCase().includes('lead')) {
            exp.description = `Led team initiatives, managed projects, and coordinated with stakeholders to achieve business objectives at ${employer}`;
          } else if (title.toLowerCase().includes('analyst')) {
            exp.description = `Analyzed data and business processes, provided insights and recommendations to support decision-making at ${employer}`;
          } else {
            exp.description = `Responsible for ${title.toLowerCase()} duties and contributed to team objectives at ${employer}`;
          }
        }
        return exp;
      });
    }

    return {
      data: extractedData,
      unmapped_fields: unmappedFields,
      ...(formatDetected && { format_detected: formatDetected }),
      ...(formatConfidence !== undefined && {
        format_confidence: formatConfidence,
      }),
    };
  } catch (error) {
    console.error('AI processing failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      model: AI_MODEL,
      timestamp: new Date().toISOString(),
    });

    return {
      data: null,
      unmapped_fields: [],
    };
  }
}

/**
 * Gets system message based on language
 */
function getSystemMessage(language: string): string {
  switch (language.toLowerCase()) {
    case 'ru':
      return 'Вы - эксперт по анализу резюме. Извлекайте структурированные данные и возвращайте валидный JSON. Конвертируйте даты в формат YYYY-MM. Все поля в JSON должны быть на русском языке, соответствующем языку резюме.';
    case 'en':
    default:
      return 'You are an expert resume parser. Extract structured data and return valid JSON. Convert dates to YYYY-MM format.';
  }
}

/**
 * Creates a structured prompt for resume data extraction based on language
 */
function createExtractionPrompt(
  resumeText: string,
  language: string = 'en',
  format?: 'chronological' | 'functional' | 'hybrid'
): string {
  switch (language.toLowerCase()) {
    case 'ru':
      return `
Проанализируйте это резюме и верните валидный JSON:

{
  "desired_titles": ["желаемые должности"],
  "summary": "профессиональное резюме",
  "skills": [{"name": "навык", "level": 1-5, "type": "programming_language"}],
  "experience": [{"employer": "компания", "title": "должность", "start": "YYYY-MM", "end": "YYYY-MM", "description": "подробное описание обязанностей и достижений"}]
}

Ключевые правила:
- Конвертируйте даты типа "Март 2022" в "2022-03"
- Используйте "present" для текущих работ
- Уровни навыков: 1=Базовый, 2=Ограниченный, 3=Профессиональный, 4=Продвинутый, 5=Эксперт
- ВСЕ значения в JSON должны быть на русском языке
- Переводите названия должностей, компаний и описания на русский язык, если они указаны на английском
- Русские уровни навыков: эксперт=5, продвинутый=4, профессиональный=3, ограниченный=2, базовый=1
- Распознавайте русские сокращения: сен=сентябрь, авг=август, дек=декабрь и т.д.
- ВСЕГДА включайте подробное описание для каждой записи опыта работы
- Если конкретное описание недоступно, создайте осмысленное описание на основе должности и компании

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
  "experience": [{"employer": "company", "title": "role", "start": "YYYY-MM", "end": "YYYY-MM", "description": "detailed description of responsibilities and achievements"}]
}

Key rules:
- Convert dates like "March 2022" to "2022-03"
- Use "present" for current jobs
- Skill levels: 1=Basic, 2=Limited, 3=Proficient, 4=Advanced, 5=Expert
- ALWAYS include a detailed description for each experience entry
- If no specific description is available, create a meaningful description based on the job title and company

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
        if (
          exp.end &&
          typeof exp.end === 'string' &&
          exp.end.toLowerCase() !== 'present'
        ) {
          exp.end = normalizeDateFormat(exp.end);
        }
        return exp;
      });
    }

    return parsed as Partial<ResumeData>;
  } catch (error) {
    console.error('Failed to parse AI response:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      response_preview: aiOutput.substring(0, 200),
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
  if (
    cleaned === 'present' ||
    cleaned === 'current' ||
    cleaned === 'настоящее время' ||
    cleaned === 'по настоящее время' ||
    cleaned === 'настоящее' ||
    cleaned === 'сейчас'
  ) {
    return 'present';
  }

  // Convert "March 2022" to "2022-03" - English and Russian months
  const monthNames: { [key: string]: string } = {
    // English months
    january: '01',
    jan: '01',
    february: '02',
    feb: '02',
    march: '03',
    mar: '03',
    april: '04',
    apr: '04',
    may: '05',
    june: '06',
    jun: '06',
    july: '07',
    jul: '07',
    august: '08',
    aug: '08',
    september: '09',
    sep: '09',
    october: '10',
    oct: '10',
    november: '11',
    nov: '11',
    december: '12',
    dec: '12',
    // Russian months
    январь: '01',
    янв: '01',
    февраль: '02',
    фев: '02',
    март: '03',
    мар: '03',
    апрель: '04',
    апр: '04',
    май: '05',
    июнь: '06',
    июн: '06',
    июль: '07',
    июл: '07',
    август: '08',
    авг: '08',
    сентябрь: '09',
    сен: '09',
    октябрь: '10',
    окт: '10',
    ноябрь: '11',
    ноя: '11',
    декабрь: '12',
    дек: '12',
  };

  // Match patterns like "март 2020" or "march 2020" or "2020 март"
  const monthYearMatch = cleaned.match(
    /([а-яa-z]+)\s+(\d{4})|(\d{4})\s+([а-яa-z]+)/
  );
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
function findUnmappedFields(
  originalText: string,
  extractedData: Partial<ResumeData> | null
): string[] {
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
  ];
  const lowerCaseText = originalText.toLowerCase();

  commonSections.forEach(section => {
    if (lowerCaseText.includes(section)) {
      unmappedFields.push(section);
    }
  });

  return unmappedFields;
}

/**
 * Detects resume format based on structure and content patterns
 */
function detectResumeFormat(resumeText: string): {
  format: 'chronological' | 'functional' | 'hybrid';
  confidence: number;
} {
  const text = resumeText.toLowerCase();

  // Chronological indicators
  const chronologicalIndicators = [
    'work experience',
    'employment history',
    'professional experience',
    'career history',
    'job history',
    'опыт работы',
    'трудовая деятельность',
    'профессиональный опыт',
  ];

  // Functional indicators
  const functionalIndicators = [
    'core competencies',
    'key qualifications',
    'areas of expertise',
    'professional skills',
    'core skills',
    'ключевые компетенции',
    'основные навыки',
    'профессиональные компетенции',
  ];

  // Date patterns (more common in chronological)
  const datePatterns = [
    /\d{4}\s*[-–]\s*\d{4}/g,
    /\d{4}\s*[-–]\s*(present|current|настоящее время)/gi,
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|янв|фев|мар|апр|май|июн|июл|авг|сен|окт|ноя|дек)\b/gi,
  ];

  let chronologicalScore = 0;
  let functionalScore = 0;

  // Check for chronological indicators
  chronologicalIndicators.forEach(indicator => {
    if (text.includes(indicator)) {
      chronologicalScore += 2;
    }
  });

  // Check for functional indicators
  functionalIndicators.forEach(indicator => {
    if (text.includes(indicator)) {
      functionalScore += 2;
    }
  });

  // Check for date patterns
  datePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches && matches.length > 2) {
      chronologicalScore += matches.length;
    }
  });

  // Determine format and confidence
  const totalScore = chronologicalScore + functionalScore;
  let format: 'chronological' | 'functional' | 'hybrid';
  let confidence: number;

  if (chronologicalScore > functionalScore * 1.5) {
    format = 'chronological';
    confidence = Math.min(0.9, chronologicalScore / (totalScore || 1));
  } else if (functionalScore > chronologicalScore * 1.5) {
    format = 'functional';
    confidence = Math.min(0.9, functionalScore / (totalScore || 1));
  } else {
    format = 'hybrid';
    confidence = Math.min(
      0.8,
      Math.max(chronologicalScore, functionalScore) / (totalScore || 1)
    );
  }

  return { format, confidence };
}

/**
 * Applies fallback extraction patterns for missing fields
 */
function applyFallbackExtraction(
  resumeText: string,
  extractedData: Partial<ResumeData>,
  language: string = 'en'
): {
  data: Partial<ResumeData>;
  unmapped_fields: string[];
} {
  const fallbackData = { ...extractedData };
  const unmappedFields: string[] = [];

  // Fallback patterns for desired titles
  if (
    !fallbackData.desired_titles ||
    fallbackData.desired_titles.length === 0
  ) {
    const titlePatterns =
      language === 'ru'
        ? [
            /ищу работу в должности\s*[:\-]?\s*(.+)/i,
            /желаемая должность\s*[:\-]?\s*(.+)/i,
            /цель\s*[:\-]?\s*(.+)/i,
            /looking for\s*[:\-]?\s*(.+)/i,
            /seeking\s*[:\-]?\s*(.+)/i,
            /interested in\s*[:\-]?\s*(.+)/i,
          ]
        : [
            /looking for\s*[:\-]?\s*(.+)/i,
            /seeking\s*[:\-]?\s*(.+)/i,
            /interested in\s*[:\-]?\s*(.+)/i,
            /objective\s*[:\-]?\s*(.+)/i,
            /career goal\s*[:\-]?\s*(.+)/i,
          ];

    for (const pattern of titlePatterns) {
      const match = resumeText.match(pattern);
      if (match && match[1]) {
        const titles = match[1]
          .split(/[,;|]/)
          .map(t => t.trim())
          .filter(t => t.length > 0);
        if (titles.length > 0) {
          fallbackData.desired_titles = titles;
          break;
        }
      }
    }
  }

  // Fallback patterns for summary
  if (!fallbackData.summary || fallbackData.summary.trim().length === 0) {
    const summaryPatterns =
      language === 'ru'
        ? [
            /профессиональный профиль\s*[:\-]?\s*(.+?)(?=\n\n|\n[A-ZА-Я]|\n\d|$)/is,
            /о себе\s*[:\-]?\s*(.+?)(?=\n\n|\n[A-ZА-Я]|\n\d|$)/is,
            /резюме\s*[:\-]?\s*(.+?)(?=\n\n|\n[A-ZА-Я]|\n\d|$)/is,
          ]
        : [
            /professional summary\s*[:\-]?\s*(.+?)(?=\n\n|\n[A-Z]|\n\d|$)/is,
            /summary\s*[:\-]?\s*(.+?)(?=\n\n|\n[A-Z]|\n\d|$)/is,
            /about\s*[:\-]?\s*(.+?)(?=\n\n|\n[A-Z]|\n\d|$)/is,
            /profile\s*[:\-]?\s*(.+?)(?=\n\n|\n[A-Z]|\n\d|$)/is,
          ];

    for (const pattern of summaryPatterns) {
      const match = resumeText.match(pattern);
      if (match && match[1] && match[1].trim().length > 50) {
        fallbackData.summary = match[1].trim();
        break;
      }
    }
  }

  // Fallback patterns for skills (if not already extracted)
  if (!fallbackData.skills || fallbackData.skills.length === 0) {
    const skillsPatterns =
      language === 'ru'
        ? [
            /навыки\s*[:\-]?\s*(.+?)(?=\n\n|\n[A-ZА-Я]|\n\d|$)/is,
            /компетенции\s*[:\-]?\s*(.+?)(?=\n\n|\n[A-ZА-Я]|\n\d|$)/is,
            /технологии\s*[:\-]?\s*(.+?)(?=\n\n|\n[A-ZА-Я]|\n\d|$)/is,
            /умения\s*[:\-]?\s*(.+?)(?=\n\n|\n[A-ZА-Я]|\n\d|$)/is,
            /профессиональные навыки\s*[:\-]?\s*(.+?)(?=\n\n|\n[A-ZА-Я]|\n\d|$)/is,
          ]
        : [
            /skills\s*[:\-]?\s*(.+?)(?=\n\n|\n[A-Z]|\n\d|$)/is,
            /technologies\s*[:\-]?\s*(.+?)(?=\n\n|\n[A-Z]|\n\d|$)/is,
            /competencies\s*[:\-]?\s*(.+?)(?=\n\n|\n[A-Z]|\n\d|$)/is,
            /expertise\s*[:\-]?\s*(.+?)(?=\n\n|\n[A-Z]|\n\d|$)/is,
            /proficiencies\s*[:\-]?\s*(.+?)(?=\n\n|\n[A-Z]|\n\d|$)/is,
          ];

    for (const pattern of skillsPatterns) {
      const match = resumeText.match(pattern);
      if (match && match[1]) {
        const skillsText = match[1];
        // Extract skills from comma-separated or bullet-pointed lists
        let skills: Skill[] = skillsText
          .split(/[,;•·\n\r]/)
          .map(s => s.trim())
          .filter(s => s.length > 0 && s.length < 50)
          .slice(0, 20) as string[]; // Limit to 20 skills

        // Enhanced Russian skill processing with level detection
        if (language === 'ru') {
          skills = skills.map(skill => {
            // Only process string skills for level detection
            if (typeof skill === 'string') {
              // Check for Russian skill levels
              const levelPatterns = [
                { pattern: /эксперт|expert/i, level: 5 },
                { pattern: /продвинутый|advanced/i, level: 4 },
                {
                  pattern: /профессиональный|proficient|professional/i,
                  level: 3,
                },
                { pattern: /ограниченный|limited/i, level: 2 },
                { pattern: /базовый|basic/i, level: 1 },
              ];

              for (const { pattern: levelPattern, level } of levelPatterns) {
                if (levelPattern.test(skill)) {
                  const skillName = skill.replace(levelPattern, '').trim();
                  if (skillName.length > 0) {
                    return {
                      name: skillName,
                      level: level as 1 | 2 | 3 | 4 | 5,
                      type: 'programming_language' as const, // Default type, could be enhanced
                    };
                  }
                }
              }
            }

            return skill; // Return as-is if no level detected or already an object
          });
        }

        if (skills.length > 0) {
          fallbackData.skills = skills;
          break;
        }
      }
    }
  }

  // Fallback patterns for experience descriptions (if missing)
  if (fallbackData.experience && Array.isArray(fallbackData.experience)) {
    fallbackData.experience = fallbackData.experience.map((exp: any) => {
      if (!exp.description || exp.description.trim().length === 0) {
        // Generate a meaningful description based on job title and company
        const title = exp.title || 'Position';
        const employer = exp.employer || 'Company';
        
        // Create a generic but meaningful description
        const genericDescriptions = [
          `Responsible for ${title.toLowerCase()} duties at ${employer}`,
          `Performed ${title.toLowerCase()} responsibilities and contributed to team objectives`,
          `Worked as ${title} at ${employer}, contributing to company goals and projects`,
          `Focused on ${title.toLowerCase()} tasks and professional development`,
        ];
        
        // Choose description based on job title keywords
        if (title.toLowerCase().includes('engineer') || title.toLowerCase().includes('developer')) {
          exp.description = `Developed and maintained software solutions, collaborated with cross-functional teams, and contributed to technical projects at ${employer}`;
        } else if (title.toLowerCase().includes('manager') || title.toLowerCase().includes('lead')) {
          exp.description = `Led team initiatives, managed projects, and coordinated with stakeholders to achieve business objectives at ${employer}`;
        } else if (title.toLowerCase().includes('analyst')) {
          exp.description = `Analyzed data and business processes, provided insights and recommendations to support decision-making at ${employer}`;
        } else {
          exp.description = genericDescriptions[Math.floor(Math.random() * genericDescriptions.length)];
        }
      }
      return exp;
    });
  }

  return {
    data: fallbackData,
    unmapped_fields: unmappedFields,
  };
}
