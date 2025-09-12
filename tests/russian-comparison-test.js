#!/usr/bin/env node

/**
 * Russian Resume Processing Comparison Test
 * Compares Russian resume processing with and without explicit language parameter
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const WORKER_URL =
  process.env.WORKER_URL ||
  'https://resume-processor-worker.dev-a96.workers.dev';

// Russian test resume content
const RUSSIAN_RESUME = `Иванов Иван Петрович
Старший разработчик Python

Контактная информация:
Email: example@email.com
Телефон: +7 999 123-45-67
Город: Москва

Опыт работы:

Январь 2020 — настоящее время
Старший разработчик Python
ООО "ТехКомпания", Москва
- Разработка и поддержка микросервисов на Django и FastAPI
- Оптимизация производительности баз данных PostgreSQL
- Внедрение практик DevOps: Docker, Kubernetes, CI/CD
- Код-ревью и менторство младших разработчиков

Март 2018 — Декабрь 2019
Python разработчик
Яндекс, Москва
- Разработка backend сервисов для поисковой платформы
- Работа с высоконагруженными системами (>1М RPS)
- Участие в архитектурных решениях

Навыки:
- Языки программирования: Python (эксперт), JavaScript (продвинутый), SQL (продвинутый)
- Фреймворки: Django, FastAPI, Flask, React
- Базы данных: PostgreSQL, MongoDB, Redis
- DevOps: Docker, Kubernetes, Jenkins, GitLab CI
- Инструменты: Git, Linux, AWS, Elasticsearch

Образование:
2014-2018: Бакалавр, Информационные системы и технологии, МГУ

Языки:
- Русский: родной
- Английский: B2 (средний)

Желаемая позиция: Senior Python Developer, Team Lead`;

/**
 * Test processing with different language settings
 */
async function runComparisonTests() {
  console.log('🔄 Russian Resume Language Comparison Test');
  console.log('==========================================');
  console.log(`Testing worker at: ${WORKER_URL}\n`);

  let testsRun = 0;
  let testsPassed = 0;

  // Test 1: Process without explicit language (auto-detection)
  console.log('📋 Test 1: Auto-detection (no language parameter)');
  try {
    const response1 = await fetch(`${WORKER_URL}/process-resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resume_text: RUSSIAN_RESUME,
        options: { include_unmapped: true, strict_validation: false },
      }),
    });

    const data1 = await response1.json();
    testsRun++;

    if (data1.success && data1.data) {
      console.log('✅ Auto-detection test passed');
      console.log(
        `   Detected titles: ${data1.data.desired_titles?.join(', ') || 'none'}`
      );
      console.log(`   Skills extracted: ${data1.data.skills?.length || 0}`);
      testsPassed++;
    } else {
      console.log('❌ Auto-detection test failed');
      console.log(`   Errors: ${data1.errors?.join(', ') || 'none'}`);
    }
  } catch (error) {
    console.log('❌ Auto-detection test error:', error.message);
    testsRun++;
  }

  console.log('');

  // Test 2: Process with explicit Russian language parameter
  console.log('📋 Test 2: Explicit Russian language (ru)');
  try {
    const response2 = await fetch(`${WORKER_URL}/process-resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resume_text: RUSSIAN_RESUME,
        language: 'ru',
        options: { include_unmapped: true, strict_validation: false },
      }),
    });

    const data2 = await response2.json();
    testsRun++;

    if (data2.success && data2.data) {
      console.log('✅ Explicit Russian test passed');
      console.log(
        `   Detected titles: ${data2.data.desired_titles?.join(', ') || 'none'}`
      );
      console.log(`   Skills extracted: ${data2.data.skills?.length || 0}`);
      testsPassed++;

      // Check if responses contain Russian text
      const hasRussianText =
        data2.data.desired_titles?.some(title => /[а-яё]/i.test(title)) ||
        (data2.data.summary && /[а-яё]/i.test(data2.data.summary));

      if (hasRussianText) {
        console.log('✅ Russian text preserved in output');
      } else {
        console.log('⚠️  Warning: No Russian text found in output');
      }
    } else {
      console.log('❌ Explicit Russian test failed');
      console.log(`   Errors: ${data2.errors?.join(', ') || 'none'}`);
    }
  } catch (error) {
    console.log('❌ Explicit Russian test error:', error.message);
    testsRun++;
  }

  console.log('');

  // Test 3: Process with wrong language parameter (should still work)
  console.log('📋 Test 3: Wrong language parameter (en for Russian text)');
  try {
    const response3 = await fetch(`${WORKER_URL}/process-resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resume_text: RUSSIAN_RESUME,
        language: 'en',
        options: { include_unmapped: true, strict_validation: false },
      }),
    });

    const data3 = await response3.json();
    testsRun++;

    if (data3.success && data3.data) {
      console.log('✅ Wrong language test passed (graceful handling)');
      console.log(
        `   Detected titles: ${data3.data.desired_titles?.join(', ') || 'none'}`
      );
      testsPassed++;
    } else {
      console.log('❌ Wrong language test failed');
      console.log(`   Errors: ${data3.errors?.join(', ') || 'none'}`);
    }
  } catch (error) {
    console.log('❌ Wrong language test error:', error.message);
    testsRun++;
  }

  console.log('');

  // Test 4: Performance comparison
  console.log('📋 Test 4: Performance comparison');
  try {
    const startTime1 = Date.now();
    await fetch(`${WORKER_URL}/process-resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resume_text: RUSSIAN_RESUME,
        options: { include_unmapped: false, strict_validation: false },
      }),
    });
    const time1 = Date.now() - startTime1;

    const startTime2 = Date.now();
    await fetch(`${WORKER_URL}/process-resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resume_text: RUSSIAN_RESUME,
        language: 'ru',
        options: { include_unmapped: false, strict_validation: false },
      }),
    });
    const time2 = Date.now() - startTime2;

    console.log(`   Auto-detection time: ${time1}ms`);
    console.log(`   Explicit language time: ${time2}ms`);
    console.log(`   Performance difference: ${Math.abs(time1 - time2)}ms`);

    testsRun++;
    testsPassed++; // Performance test always passes if no errors
  } catch (error) {
    console.log('❌ Performance test error:', error.message);
    testsRun++;
  }

  // Summary
  console.log('\n📊 Comparison Test Results');
  console.log('==========================');
  console.log(`Tests run: ${testsRun}`);
  console.log(`Tests passed: ${testsPassed}`);
  console.log(
    `Success rate: ${testsRun > 0 ? Math.round((testsPassed / testsRun) * 100) : 0}%`
  );

  if (testsPassed === testsRun && testsRun > 0) {
    console.log('\n🎉 All comparison tests passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Some comparison tests failed.');
    process.exit(1);
  }
}

// Run the comparison tests
runComparisonTests().catch(error => {
  console.error('❌ Comparison test suite failed:', error);
  process.exit(1);
});
