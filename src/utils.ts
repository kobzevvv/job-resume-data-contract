import { APIError } from './types';

/**
 * Structured logging utility
 */
export function logEvent(
  level: 'info' | 'warn' | 'error',
  message: string,
  data?: any
): void {
  const logEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    worker: 'resume-processor',
    ...data,
  };

  console.log(JSON.stringify(logEntry));
}

/**
 * Creates standardized API error responses
 */
export function createErrorResponse(
  status: number,
  code: string,
  message: string,
  details?: string
): Response {
  const error: APIError = {
    error: message,
    code,
    timestamp: new Date().toISOString(),
    ...(details && { details }),
  };

  logEvent('error', `API Error: ${code}`, { status, error: message, details });

  return new Response(JSON.stringify(error), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

/**
 * Creates successful API responses
 */
export function createSuccessResponse(data: any): Response {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

/**
 * Handles CORS preflight requests
 */
export function handleCORS(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}

/**
 * Validates request content type
 */
export function validateContentType(request: Request): boolean {
  const contentType = request.headers.get('content-type');
  return contentType?.includes('application/json') ?? false;
}

/**
 * Safely parses JSON request body
 */
export async function parseJsonRequest<T>(request: Request): Promise<T> {
  try {
    const body = await request.text();
    if (!body.trim()) {
      throw new Error('Request body is empty');
    }
    return JSON.parse(body) as T;
  } catch (error) {
    throw new Error(
      `Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Measures execution time
 */
export function measureTime(): () => number {
  const startTime = Date.now();
  return () => Date.now() - startTime;
}

/**
 * Validates request size
 */
export function validateRequestSize(
  request: Request,
  maxSizeBytes: number = 50000
): boolean {
  const contentLength = request.headers.get('content-length');
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    return size <= maxSizeBytes;
  }
  return true; // If no content-length header, allow it (will be checked during parsing)
}

/**
 * Extracts useful request metadata for logging
 */
export function getRequestMetadata(request: Request): any {
  return {
    method: request.method,
    url: request.url,
    user_agent: request.headers.get('user-agent'),
    cf_country: request.cf?.country,
    cf_ray: request.headers.get('cf-ray'),
  };
}

/**
 * Sanitizes text for logging (removes sensitive information)
 */
export function sanitizeForLog(text: string, maxLength: number = 200): string {
  // Remove potential sensitive information
  const sanitized = text
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]') // Social Security Numbers
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]') // Email addresses
    .replace(/\b\d{3}-\d{3}-\d{4}\b/g, '[PHONE]') // Phone numbers
    .replace(/\b\d{16}\b/g, '[CARD]'); // Credit card numbers (basic pattern)

  return sanitized.length > maxLength
    ? sanitized.substring(0, maxLength) + '...'
    : sanitized;
}

/**
 * Rate limiting check (simple in-memory implementation)
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  clientId: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const key = clientId;

  const existing = requestCounts.get(key);
  if (!existing || now > existing.resetTime) {
    requestCounts.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (existing.count >= maxRequests) {
    return false;
  }

  existing.count++;
  return true;
}

/**
 * Cleanup rate limiting data (call periodically)
 */
export function cleanupRateLimit(): void {
  const now = Date.now();
  for (const [key, data] of requestCounts.entries()) {
    if (now > data.resetTime) {
      requestCounts.delete(key);
    }
  }
}
