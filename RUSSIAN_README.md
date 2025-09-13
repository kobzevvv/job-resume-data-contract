# Russian Language Support

This document describes how to use the Russian language support in the Resume Processor Worker.

## Overview

The Resume Processor Worker now supports processing Russian resumes with proper language-specific handling, including:

- ✅ Russian language detection (automatic)
- ✅ Cyrillic text processing
- ✅ Russian date format normalization (e.g., "Март 2020" → "2020-03")
- ✅ Russian job titles and descriptions
- ✅ Russian skills extraction
- ✅ Language-specific AI prompts

## Usage

### API Request with Language Parameter

```javascript
// Explicit Russian language
const response = await fetch('/process-resume', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    resume_text: 'Иванов Иван\nПрограммист...',
    language: 'ru', // Specify Russian language
    options: {
      include_unmapped: true,
      strict_validation: false,
    },
  }),
});
```

### Automatic Language Detection

```javascript
// Automatic language detection (recommended)
const response = await fetch('/process-resume', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    resume_text: 'Петров Сергей\nСистемный администратор...',
    // language parameter is optional - will auto-detect Russian
    options: {
      include_unmapped: true,
      strict_validation: false,
    },
  }),
});
```

## Supported Languages

- `en` (English) - default
- `ru` (Russian) - with Cyrillic support

## Russian-Specific Features

### Date Format Normalization

Russian month names are automatically converted to ISO format:

- "Январь 2022" → "2022-01"
- "март 2020" → "2020-03"
- "настоящее время" → "present"

### Russian Month Names Support

| Russian      | English   | ISO |
| ------------ | --------- | --- |
| Январь/янв   | January   | 01  |
| Февраль/фев  | February  | 02  |
| Март/мар     | March     | 03  |
| Апрель/апр   | April     | 04  |
| Май          | May       | 05  |
| Июнь/июн     | June      | 06  |
| Июль/июл     | July      | 07  |
| Август/авг   | August    | 08  |
| Сентябрь/сен | September | 09  |
| Октябрь/окт  | October   | 10  |
| Ноябрь/ноя   | November  | 11  |
| Декабрь/дек  | December  | 12  |

### Example Russian Resume Processing

**Input:**

```
Шемаханский Виктор
Инженер технической поддержки
Москва
Опыт работы: Июнь 2020 — настоящее время
Навыки: Windows Server, Linux, сети
```

**Expected Output:**

```json
{
  "desired_titles": ["Инженер технической поддержки"],
  "summary": "Специалист технической поддержки с опытом администрирования...",
  "skills": [
    { "name": "Windows Server", "level": 4, "type": "tool" },
    { "name": "Linux", "level": 3, "type": "tool" },
    { "name": "Сети", "level": 3, "type": "domain" }
  ],
  "experience": [
    {
      "title": "Инженер технической поддержки",
      "start": "2020-06",
      "end": "present",
      "description": "..."
    }
  ]
}
```

## Testing Russian Support

### Manual Testing

Use the GitHub Action for comprehensive Russian language testing:

1. Go to your repository's Actions tab
2. Select "Test Russian Resume Processing"
3. Click "Run workflow"
4. Choose test type:
   - `russian-only` - Test Russian resumes only
   - `all-languages` - Test all language support
   - `comparison` - Compare auto-detection vs explicit language

### Local Testing

Run Russian-specific tests locally:

```bash
# Test all resumes (including Russian)
npm test

# Test Russian comparison
node tests/russian-comparison-test.js

# Test specific Russian resume
WORKER_URL=your-worker-url node tests/test-runner.js
```

### Test Files

Russian test files are located in:

- `tests/sample-resumes/russian-it-specialist.txt` - Sanitized Russian resume
- `tests/expected-outputs/russian-it-specialist.json` - Expected validation patterns

## Language Detection Logic

The system automatically detects Russian language using:

1. **Filename patterns**: `russian-*`, `ru-*`
2. **Cyrillic detection**: Presence of Russian characters `[а-яё]`
3. **Content analysis**: Russian keywords and patterns

## Error Handling

The system gracefully handles:

- Mixed language content
- Incorrect language parameters
- Cyrillic encoding issues
- Russian-specific date formats

## Performance

Russian language processing has similar performance to English:

- Average processing time: 2-8 seconds
- Memory usage: Same as English processing
- AI model: Supports multilingual input

## Troubleshooting

### Common Issues

1. **Cyrillic characters not recognized**
   - Ensure UTF-8 encoding
   - Check for mixed character sets

2. **Dates not parsing correctly**
   - Supported formats: "Март 2020", "март 2020", "2020 март"
   - Use "настоящее время" for current positions

3. **Skills not extracting properly**
   - Mix Russian and English technical terms as needed
   - Use both Cyrillic and Latin script for technical skills

### Support

For issues with Russian language processing:

1. Check the GitHub Action test results
2. Run comparison tests locally
3. Verify input encoding and format
4. Review the expected output patterns

## Future Enhancements

Planned improvements for Russian language support:

- Ukrainian language support
- Regional Russian date formats
- Industry-specific Russian terminology
- Enhanced skill level detection for Russian text
