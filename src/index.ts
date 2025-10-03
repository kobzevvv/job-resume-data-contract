import { Env } from './types';
import { DatabaseLogger } from './database-logger';
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
} from './utils';
import {
  ProcessResumeRequest,
  ProcessResumeResponse,
  ProcessResumeStreamRequest,
  ProcessResumeStreamResponse,
  ProcessResumeBatchRequest,
  ProcessResumeBatchResponse,
  BatchResumeResult,
  HealthResponse,
  ResumeData,
  PartialResumeData,
} from './types';

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

        case '/process-resume-pdf':
          return await handleProcessResumePdf(request, env);

        case '/process-resume-stream':
          return await handleProcessResumeStream(request, env);

        case '/process-resume-batch':
          return await handleProcessResumeBatch(request, env);

        case '/analytics':
          return await handleAnalytics(request, env);

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
    ctx.waitUntil(performScheduledCleanup(env));
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
      endpoints: [
        '/',
        '/health',
        '/process-resume',
        '/process-resume-stream',
        '/process-resume-batch',
        '/analytics',
      ],
      ai_status: aiStatus,
    };

    logEvent('info', 'Health check completed', { ai_status: aiStatus });

    return createSuccessResponse(health);
  } catch (error) {
    const health: HealthResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: WORKER_VERSION,
      endpoints: [
        '/',
        '/health',
        '/process-resume',
        '/process-resume-stream',
        '/process-resume-batch',
        '/analytics',
      ],
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
  const requestId = crypto.randomUUID();
  const logger = new DatabaseLogger(env);

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
    const useFlexibleValidation =
      requestData.options?.flexible_validation ?? true;

    const aiResult = await processResumeWithAI(
      requestData.resume_text,
      env,
      language,
      {
        use_fallback: true,
        detect_format: true,
      }
    );

    if (!aiResult.data) {
      // Log error to database
      await logger
        .logError({
          requestId,
          timestamp: new Date().toISOString(),
          errorCode: 'AI_PROCESSING_FAILED',
          errorMessage: 'Failed to extract resume data with AI',
          endpoint: '/process-resume',
        })
        .catch(() => {
          // Silent fail - don't log logging failures to console
        });

      return createErrorResponse(
        422,
        'AI_PROCESSING_FAILED',
        'Failed to extract resume data with AI'
      );
    }

    // Validate extracted data with flexible validation support
    const validation = validateResumeData(aiResult.data, {
      flexible_validation: useFlexibleValidation,
      strict_validation: requestData.options?.strict_validation ?? false,
    });

    // Determine if we should return partial data
    const shouldReturnPartial = useFlexibleValidation && !validation.isValid;
    const hasPartialFields =
      validation.partial_fields && validation.partial_fields.length > 0;

    // Prepare response data
    let responseData: ResumeData | PartialResumeData | null = null;
    if (validation.isValid) {
      responseData = aiResult.data as ResumeData;
    } else if (shouldReturnPartial) {
      // Create partial data response
      const partialData = aiResult.data as Partial<ResumeData>;
      responseData = {
        ...partialData,
        partial_fields: validation.partial_fields,
        confidence_scores: validation.confidence_scores,
      } as PartialResumeData;
    }

    // Log validation warnings
    if (validation.warnings.length > 0) {
      logEvent('warn', 'Validation warnings', {
        warnings: validation.warnings,
        partial_fields: validation.partial_fields,
      });
    }

    // Prepare response
    const response: ProcessResumeResponse = {
      success: validation.isValid || shouldReturnPartial,
      data: responseData,
      unmapped_fields:
        requestData.options?.include_unmapped !== false
          ? aiResult.unmapped_fields
          : [],
      errors: validation.errors,
      ...(validation.validation_errors && {
        validation_errors: validation.validation_errors,
      }),
      ...(validation.partial_fields && {
        partial_fields: validation.partial_fields,
      }),
      processing_time_ms: getElapsed(),
      metadata: {
        worker_version: WORKER_VERSION,
        ai_model_used: '@cf/meta/llama-2-7b-chat-int8',
        timestamp: new Date().toISOString(),
        ...(aiResult.format_detected && {
          format_detected: aiResult.format_detected,
        }),
        ...(aiResult.format_confidence !== undefined && {
          format_confidence: aiResult.format_confidence,
        }),
      },
    };

    // Log completion
    logEvent('info', 'Resume processing completed', {
      request_id: requestId,
      success: response.success,
      processing_time_ms: response.processing_time_ms,
      errors_count: response.errors.length,
      unmapped_fields_count: response.unmapped_fields.length,
      data_extracted: response.data !== null,
    });

    // Log to database
    const logPayload = {
      requestId,
      method: request.method,
      endpoint: '/process-resume',
      inputType: 'text',
      inputSize: requestData.resume_text.length,
      inputPreview: requestData.resume_text.substring(0, 200), // First 200 chars for identification
      language,
      success: response.success,
      processingTimeMs: response.processing_time_ms,
      extractedFieldsCount: response.data
        ? Object.keys(response.data).length
        : 0,
      validationErrorsCount: response.errors.length,
      partialFieldsCount: response.partial_fields?.length || 0,
      errors: response.errors,
      unmappedFields: response.unmapped_fields,
      metadata: response.metadata,
      // Add the actual structured resume JSON output
      resumeData: response.data,
    };

    // Debug: Log the payload structure
    console.log('DEBUG: LogPayload structure:', {
      requestId,
      payloadKeys: Object.keys(logPayload),
      hasResumeData: !!logPayload.resumeData,
      resumeDataKeys: logPayload.resumeData
        ? Object.keys(logPayload.resumeData)
        : null,
    });

    // Log to database synchronously (temporary debug change)
    try {
      await logger.logRequestSimple(requestId, '/process-resume', logPayload);
      console.log('✅ Database logging completed successfully:', requestId);
    } catch (error) {
      console.error('❌ Database logging failed:', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      // Don't throw - we still want to return the response
    }

    return createSuccessResponse(response);
  } catch (error) {
    logEvent('error', 'Resume processing failed', {
      request_id: requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      processing_time_ms: getElapsed(),
    });

    // Log error to database
    await logger
      .logError({
        requestId,
        timestamp: new Date().toISOString(),
        errorCode: 'INTERNAL_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        ...(error instanceof Error &&
          error.stack && { stackTrace: error.stack }),
        endpoint: '/process-resume',
      })
      .catch(() => {
        // Silent fail - don't compound errors
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
 * PDF resume processing endpoint
 */
async function handleProcessResumePdf(
  request: Request,
  env: Env
): Promise<Response> {
  const requestId = crypto.randomUUID();
  const getElapsed = measureTime();

  try {
    console.log('📄 Processing PDF resume:', requestId);

    // Parse form data
    const formData = await request.formData();
    const pdfFile = formData.get('pdf') as File;
    const language = (formData.get('language') as string) || 'en';
    const options = {
      flexible_validation: formData.get('flexible_validation') === 'true',
      strict_validation: formData.get('strict_validation') === 'true',
    };

    if (!pdfFile) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No PDF file provided',
          request_id: requestId,
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    console.log('📊 PDF file info:', {
      name: pdfFile.name,
      size: pdfFile.size,
      type: pdfFile.type,
    });

    // Convert PDF to base64 using a more robust method
    const pdfBuffer = await pdfFile.arrayBuffer();
    const uint8Array = new Uint8Array(pdfBuffer);

    // Convert to base64 in chunks to avoid string length limits
    let binaryString = '';
    const chunkSize = 8192; // Process in 8KB chunks
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      binaryString += String.fromCharCode(...chunk);
    }
    const pdfBase64 = btoa(binaryString);

    console.log('📊 Base64 conversion info:', {
      originalSize: pdfBuffer.byteLength,
      binaryStringLength: binaryString.length,
      base64Length: pdfBase64.length,
      base64Preview: pdfBase64.substring(0, 50) + '...',
    });

    console.log('📤 Step 1: Uploading PDF to PDF.co...');

    // Step 1: Upload PDF to PDF.co
    const uploadResponse = await fetch('https://api.pdf.co/v1/file/upload/base64', {
      method: 'POST',
      headers: {
        'x-api-key': env.PDF_CO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: pdfBase64,
        fileName: pdfFile.name || 'resume.pdf'
      }),
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('PDF.co upload error:', {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        errorBody: errorText
      });
      throw new Error(`PDF.co upload error: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`);
    }

    const uploadResult = await uploadResponse.json();
    console.log('PDF.co upload response (full):', JSON.stringify(uploadResult, null, 2));

    if (!uploadResult.success) {
      throw new Error(`PDF.co upload failed: ${uploadResult.message || 'Upload unsuccessful'}`);
    }

    // Check for different possible URL field names
    const fileUrl = uploadResult.url || uploadResult.fileUrl || uploadResult.file_url || uploadResult.downloadUrl;
    
    if (!fileUrl) {
      console.error('No URL found in upload response. Available fields:', Object.keys(uploadResult));
      throw new Error(`PDF.co upload failed: No URL returned. Response: ${JSON.stringify(uploadResult)}`);
    }

    console.log('📤 Step 2: Converting PDF to text...');

    // Step 2: Convert PDF to text using the uploaded file URL
    const convertResponse = await fetch('https://api.pdf.co/v1/pdf/convert/to/text', {
      method: 'POST',
      headers: {
        'x-api-key': env.PDF_CO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: fileUrl,
        inline: true,
        password: '',
        pages: '1-10',
        ocrMode: 'auto'
      }),
    });

    if (!convertResponse.ok) {
      const errorText = await convertResponse.text();
      console.error('PDF.co conversion error:', {
        status: convertResponse.status,
        statusText: convertResponse.statusText,
        errorBody: errorText
      });
      throw new Error(`PDF.co conversion error: ${convertResponse.status} ${convertResponse.statusText} - ${errorText}`);
    }

    const convertResult = await convertResponse.json();
    console.log('PDF.co conversion response:', {
      success: convertResult.success,
      message: convertResult.message,
      hasBody: !!convertResult.body
    });

    if (!convertResult.success) {
      throw new Error(`PDF.co conversion failed: ${convertResult.message}`);
    }

    const extractedText = convertResult.body;
    console.log(
      '✅ PDF text extracted successfully:',
      extractedText.length,
      'characters'
    );

    // Process extracted text with existing logic
    const resumeData = {
      resume_text: extractedText,
      language: language,
      options: options,
    };

    // Use existing resume processing logic
    const response = await processResumeWithAI(resumeData, env);

    // Create response object
    const responseData: ProcessResumeResponse = {
      success: response.success,
      data: response.data,
      errors: response.errors || [],
      unmapped_fields: response.unmapped_fields || [],
      partial_fields: response.partial_fields || [],
      processing_time_ms: getElapsed(),
      metadata: {
        worker_version: WORKER_VERSION,
        ai_model_used: env.AI?.model || 'unknown',
        timestamp: new Date().toISOString(),
        format_detected: 'pdf',
        format_confidence: 1.0,
      },
    };

    // Initialize database logger
    const logger = new DatabaseLogger(env);

    // Log to database with PDF info
    const logPayload = {
      requestId,
      method: request.method,
      endpoint: '/process-resume-pdf',
      inputType: 'pdf',
      inputSize: pdfFile.size,
      inputPreview: `PDF: ${pdfFile.name} (${pdfFile.size} bytes)`,
      language,
      success: responseData.success,
      processingTimeMs: responseData.processing_time_ms,
      extractedFieldsCount: responseData.data
        ? Object.keys(responseData.data).length
        : 0,
      validationErrorsCount: responseData.errors.length,
      partialFieldsCount: responseData.partial_fields?.length || 0,
      errors: responseData.errors,
      unmappedFields: responseData.unmapped_fields,
      metadata: responseData.metadata,
      resumeData: responseData.data, // Complete structured resume JSON
      pdfInfo: {
        fileName: pdfFile.name,
        fileSize: pdfFile.size,
        fileType: pdfFile.type,
        extractedTextLength: extractedText.length,
      },
    };

    // Debug logging
    console.log('DEBUG: PDF LogPayload structure:', {
      requestId,
      payloadKeys: Object.keys(logPayload),
      hasResumeData: !!logPayload.resumeData,
      resumeDataKeys: logPayload.resumeData
        ? Object.keys(logPayload.resumeData)
        : null,
    });

    // Log to database
    try {
      await logger.logRequestSimple(
        requestId,
        '/process-resume-pdf',
        logPayload
      );
      console.log('✅ Database logging completed successfully:', requestId);
    } catch (error) {
      console.error('❌ Database logging failed:', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
    }

    return createSuccessResponse(responseData);
  } catch (error) {
    console.error('❌ PDF processing failed:', error.message);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        request_id: requestId,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

/**
 * Streaming resume processing endpoint
 */
async function handleProcessResumeStream(
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

    // Parse request body
    let requestData: ProcessResumeStreamRequest;
    try {
      requestData = await parseJsonRequest<ProcessResumeStreamRequest>(request);
    } catch (error) {
      return createErrorResponse(
        400,
        'INVALID_JSON',
        error instanceof Error ? error.message : 'Invalid JSON'
      );
    }

    // Generate stream ID if not provided
    const streamId =
      requestData.stream_id ||
      `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // For now, we'll process synchronously but return streaming response format
    // In a real implementation, this would be queued and processed asynchronously
    const aiResult = await processResumeWithAI(
      requestData.resume_text,
      env,
      requestData.language || 'en',
      { use_fallback: true, detect_format: true }
    );

    const validation = validateResumeData(aiResult.data!, {
      flexible_validation: requestData.options?.flexible_validation ?? true,
      strict_validation: requestData.options?.strict_validation ?? false,
    });

    const response: ProcessResumeStreamResponse = {
      stream_id: streamId,
      status: 'completed',
      progress_percentage: 100,
      current_step: 'completed',
      result: {
        success:
          validation.isValid ||
          (requestData.options?.flexible_validation ?? true),
        data: validation.isValid ? (aiResult.data as ResumeData) : null,
        unmapped_fields: aiResult.unmapped_fields,
        errors: validation.errors,
        ...(validation.validation_errors && {
          validation_errors: validation.validation_errors,
        }),
        ...(validation.partial_fields && {
          partial_fields: validation.partial_fields,
        }),
        processing_time_ms: getElapsed(),
        metadata: {
          worker_version: WORKER_VERSION,
          ai_model_used: '@cf/meta/llama-2-7b-chat-int8',
          timestamp: new Date().toISOString(),
          ...(aiResult.format_detected && {
            format_detected: aiResult.format_detected,
          }),
          ...(aiResult.format_confidence !== undefined && {
            format_confidence: aiResult.format_confidence,
          }),
        },
      },
    };

    return createSuccessResponse(response);
  } catch (error) {
    logEvent('error', 'Streaming resume processing failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      processing_time_ms: getElapsed(),
    });

    return createErrorResponse(
      500,
      'STREAMING_PROCESSING_FAILED',
      'Failed to process resume in streaming mode'
    );
  }
}

/**
 * Batch resume processing endpoint
 */
async function handleProcessResumeBatch(
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

    // Parse request body
    let requestData: ProcessResumeBatchRequest;
    try {
      requestData = await parseJsonRequest<ProcessResumeBatchRequest>(request);
    } catch (error) {
      return createErrorResponse(
        400,
        'INVALID_JSON',
        error instanceof Error ? error.message : 'Invalid JSON'
      );
    }

    // Validate batch size
    if (requestData.resumes.length === 0) {
      return createErrorResponse(
        400,
        'EMPTY_BATCH',
        'Batch must contain at least one resume'
      );
    }

    if (requestData.resumes.length > 50) {
      return createErrorResponse(
        400,
        'BATCH_TOO_LARGE',
        'Batch cannot contain more than 50 resumes'
      );
    }

    // Generate batch ID
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Process resumes (for now, sequentially - in production this would be parallel)
    const maxConcurrency = requestData.options?.max_concurrency || 5;
    const results: BatchResumeResult[] = [];

    // Initialize all results as pending
    requestData.resumes.forEach(resume => {
      results.push({
        id: resume.id,
        status: 'pending',
      });
    });

    // Process resumes with limited concurrency
    const processPromises: Promise<void>[] = [];
    let processedCount = 0;

    for (let i = 0; i < requestData.resumes.length; i += maxConcurrency) {
      const batch = requestData.resumes.slice(i, i + maxConcurrency);

      const batchPromises = batch.map(async (resume, batchIndex) => {
        const globalIndex = i + batchIndex;

        try {
          results[globalIndex]!.status = 'processing';

          const aiResult = await processResumeWithAI(
            resume.resume_text,
            env,
            resume.language || 'en',
            { use_fallback: true, detect_format: true }
          );

          const validation = validateResumeData(aiResult.data!, {
            flexible_validation: resume.options?.flexible_validation ?? true,
            strict_validation: resume.options?.strict_validation ?? false,
          });

          results[globalIndex]!.status = 'completed';
          results[globalIndex]!.result = {
            success:
              validation.isValid ||
              (resume.options?.flexible_validation ?? true),
            data: validation.isValid ? (aiResult.data as ResumeData) : null,
            unmapped_fields: aiResult.unmapped_fields,
            errors: validation.errors,
            ...(validation.validation_errors && {
              validation_errors: validation.validation_errors,
            }),
            ...(validation.partial_fields && {
              partial_fields: validation.partial_fields,
            }),
            processing_time_ms: 0, // Individual processing time not tracked in batch
            metadata: {
              worker_version: WORKER_VERSION,
              ai_model_used: '@cf/meta/llama-2-7b-chat-int8',
              timestamp: new Date().toISOString(),
              ...(aiResult.format_detected && {
                format_detected: aiResult.format_detected,
              }),
              ...(aiResult.format_confidence !== undefined && {
                format_confidence: aiResult.format_confidence,
              }),
            },
          };
        } catch (error) {
          results[globalIndex]!.status = 'failed';
          results[globalIndex]!.error =
            error instanceof Error ? error.message : 'Unknown error';
        }

        processedCount++;
      });

      processPromises.push(...batchPromises);
    }

    // Wait for all processing to complete
    await Promise.all(processPromises);

    const completedCount = results.filter(r => r.status === 'completed').length;
    const failedCount = results.filter(r => r.status === 'failed').length;

    const response: ProcessResumeBatchResponse = {
      batch_id: batchId,
      status: 'completed',
      total_resumes: requestData.resumes.length,
      completed_count: completedCount,
      failed_count: failedCount,
      results,
      estimated_completion_time: getElapsed(),
    };

    logEvent('info', 'Batch processing completed', {
      batch_id: batchId,
      total_resumes: requestData.resumes.length,
      completed_count: completedCount,
      failed_count: failedCount,
      processing_time_ms: getElapsed(),
    });

    return createSuccessResponse(response);
  } catch (error) {
    logEvent('error', 'Batch processing failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      processing_time_ms: getElapsed(),
    });

    return createErrorResponse(
      500,
      'BATCH_PROCESSING_FAILED',
      'Failed to process resume batch'
    );
  }
}

/**
 * Analytics endpoint - provides usage statistics
 */
async function handleAnalytics(request: Request, env: Env): Promise<Response> {
  try {
    const logger = new DatabaseLogger(env);
    const analytics = await logger.getAnalytics();

    return new Response(JSON.stringify(analytics), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return createErrorResponse(
      500,
      'ANALYTICS_ERROR',
      'Failed to retrieve analytics data'
    );
  }
}

/**
 * Scheduled cleanup tasks
 */
async function performScheduledCleanup(env?: Env): Promise<void> {
  try {
    logEvent('info', 'Starting scheduled cleanup');
    if (env?.RESUME_DB) {
      const logger = new DatabaseLogger(env);
      await logger.cleanupOldLogs();
    }
    logEvent('info', 'Scheduled cleanup completed');
  } catch (error) {
    logEvent('error', 'Scheduled cleanup failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
