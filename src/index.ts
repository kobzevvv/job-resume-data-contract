import {
  Env,
  ProcessResumeRequest,
  ProcessResumeResponse,
  HealthResponse,
  ResumeData,
} from './types';
import { processResumeWithAI } from './ai-processor';
import { validateResumeData } from './validator';
import {
  logEvent,
  createErrorResponse,
  createSuccessResponse,
  handleCORS,
  validateContentType,
  parseJsonRequest,
  measureTime,
  validateRequestSize,
  getRequestMetadata,
  sanitizeForLog,
  checkRateLimit,
  cleanupRateLimit,
} from './utils';

// Worker version for tracking
const WORKER_VERSION = '1.0.0';

/**
 * Main Cloudflare Worker entry point
 */
export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const getElapsed = measureTime();
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Handle CORS preflight requests
      if (request.method === 'OPTIONS') {
        return handleCORS();
      }

      // Rate limiting based on CF-Ray header or IP
      const clientId =
        request.headers.get('cf-ray') ||
        request.headers.get('cf-connecting-ip') ||
        'unknown';
      if (!checkRateLimit(clientId)) {
        return createErrorResponse(
          429,
          'RATE_LIMIT_EXCEEDED',
          'Too many requests'
        );
      }

      // Log incoming request
      logEvent('info', 'Incoming request', {
        ...getRequestMetadata(request),
        path,
        processing_time_ms: getElapsed(),
      });

      // Route handling
      switch (path) {
        case '/':
        case '/health':
          return handleHealth(request, env);

        case '/process-resume':
          return await handleProcessResume(request, env);

        default:
          return createErrorResponse(
            404,
            'NOT_FOUND',
            `Endpoint not found: ${path}`
          );
      }
    } catch (error) {
      logEvent('error', 'Unhandled error in main handler', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        path,
        processing_time_ms: getElapsed(),
      });

      return createErrorResponse(
        500,
        'INTERNAL_ERROR',
        'Internal server error'
      );
    }
  },

  /**
   * Scheduled handler for cleanup tasks
   */
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    ctx.waitUntil(performScheduledCleanup());
  },
};

/**
 * Health check endpoint
 */
async function handleHealth(request: Request, env: Env): Promise<Response> {
  try {
    // Test AI availability
    let aiStatus: 'available' | 'unavailable' = 'available';
    try {
      await env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1,
      });
    } catch (error) {
      aiStatus = 'unavailable';
    }

    const health: HealthResponse = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: WORKER_VERSION,
      endpoints: ['/', '/health', '/process-resume'],
      ai_status: aiStatus,
    };

    logEvent('info', 'Health check completed', { ai_status: aiStatus });

    return createSuccessResponse(health);
  } catch (error) {
    const health: HealthResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: WORKER_VERSION,
      endpoints: ['/', '/health', '/process-resume'],
    };

    return new Response(JSON.stringify(health), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Main resume processing endpoint
 */
async function handleProcessResume(
  request: Request,
  env: Env
): Promise<Response> {
  const getElapsed = measureTime();

  try {
    // Validate request method
    if (request.method !== 'POST') {
      return createErrorResponse(
        405,
        'METHOD_NOT_ALLOWED',
        'Only POST method is allowed'
      );
    }

    // Validate content type
    if (!validateContentType(request)) {
      return createErrorResponse(
        400,
        'INVALID_CONTENT_TYPE',
        'Content-Type must be application/json'
      );
    }

    // Validate request size
    if (!validateRequestSize(request)) {
      return createErrorResponse(
        413,
        'PAYLOAD_TOO_LARGE',
        'Request body too large (max 50KB)'
      );
    }

    // Parse and validate request body
    let requestData: ProcessResumeRequest;
    try {
      requestData = await parseJsonRequest<ProcessResumeRequest>(request);
    } catch (error) {
      return createErrorResponse(
        400,
        'INVALID_JSON',
        error instanceof Error ? error.message : 'Invalid JSON'
      );
    }

    // Validate required fields
    if (
      !requestData.resume_text ||
      typeof requestData.resume_text !== 'string'
    ) {
      return createErrorResponse(
        400,
        'MISSING_RESUME_TEXT',
        'resume_text is required and must be a string'
      );
    }

    if (requestData.resume_text.trim().length < 50) {
      return createErrorResponse(
        400,
        'RESUME_TEXT_TOO_SHORT',
        'resume_text must be at least 50 characters'
      );
    }

    // Log processing start
    logEvent('info', 'Starting resume processing', {
      resume_length: requestData.resume_text.length,
      options: requestData.options,
      resume_preview: sanitizeForLog(requestData.resume_text, 100),
    });

    // Process resume with AI
    const language = requestData.language || 'en';
    const aiResult = await processResumeWithAI(
      requestData.resume_text,
      env,
      language
    );

    if (!aiResult.data) {
      return createErrorResponse(
        422,
        'AI_PROCESSING_FAILED',
        'Failed to extract resume data with AI'
      );
    }

    // Validate extracted data
    const validation = validateResumeData(aiResult.data);
    const errors: string[] = [];

    if (!validation.isValid && requestData.options?.strict_validation) {
      errors.push(...validation.errors);
    }

    // Log validation warnings
    if (validation.warnings.length > 0) {
      logEvent('warn', 'Validation warnings', {
        warnings: validation.warnings,
      });
    }

    // Prepare response
    const response: ProcessResumeResponse = {
      success: validation.isValid || !requestData.options?.strict_validation,
      data: validation.isValid ? (aiResult.data as ResumeData) : null,
      unmapped_fields:
        requestData.options?.include_unmapped !== false
          ? aiResult.unmapped_fields
          : [],
      errors: errors.concat(validation.errors),
      processing_time_ms: getElapsed(),
      metadata: {
        worker_version: WORKER_VERSION,
        ai_model_used: '@cf/meta/llama-2-7b-chat-int8',
        timestamp: new Date().toISOString(),
      },
    };

    // Log completion
    logEvent('info', 'Resume processing completed', {
      success: response.success,
      processing_time_ms: response.processing_time_ms,
      errors_count: response.errors.length,
      unmapped_fields_count: response.unmapped_fields.length,
      data_extracted: response.data !== null,
    });

    return createSuccessResponse(response);
  } catch (error) {
    logEvent('error', 'Resume processing failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      processing_time_ms: getElapsed(),
    });

    const response: ProcessResumeResponse = {
      success: false,
      data: null,
      unmapped_fields: [],
      errors: ['Internal processing error'],
      processing_time_ms: getElapsed(),
    };

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

/**
 * Scheduled cleanup tasks
 */
async function performScheduledCleanup(): Promise<void> {
  try {
    // Cleanup rate limiting data
    cleanupRateLimit();

    logEvent('info', 'Scheduled cleanup completed');
  } catch (error) {
    logEvent('error', 'Scheduled cleanup failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
