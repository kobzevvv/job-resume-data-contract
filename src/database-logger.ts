import { Env } from './types';

/**
 * Simple database logging service using Cloudflare D1
 */

export interface RequestLogEntry {
  requestId: string;
  timestamp: string;
  method: string;
  endpoint: string;
  cfCountry?: string; // Make optional
  cfRay?: string; // Make optional
  userAgent?: string; // Make optional
  inputType: 'text' | 'pdf';
  inputSizeBytes: number;
  inputLanguage: string;
  inputPreview: string; // Sanitized first 200 chars
  success: boolean;
  processingTimeMs: number;
  aiModelUsed: string;
  extractedFieldsCount: number;
  validationErrorsCount: number;
  partialFieldsCount: number;
  // PDF-specific fields
  pdfPages?: number;
  pdfSizeKb?: number;
}

export interface ErrorLogEntry {
  requestId: string;
  timestamp: string;
  errorCode: string;
  errorMessage: string;
  stackTrace?: string; // Make optional to match the interface
  endpoint: string;
}

/**
 * Database logging service
 */
export class DatabaseLogger {
  constructor(private env: Env) {}

  /**
   * Simple log request to database - just timestamp and JSON payload
   */
  async logRequestSimple(
    requestId: string,
    endpoint: string,
    payload: any
  ): Promise<void> {
    if (!this.env.RESUME_DB) {
      console.warn(
        'Database logging disabled: RESUME_DB binding not available',
        { envKeys: Object.keys(this.env) }
      );
      return;
    }

    try {
      console.log('Simple logging request to database:', {
        requestId,
        endpoint,
        payloadKeys: Object.keys(payload),
      });

      await this.env.RESUME_DB.prepare(
        `INSERT INTO request_logs_simple (request_id, timestamp, endpoint, payload) VALUES (?, ?, ?, ?)`
      )
        .bind(
          requestId,
          new Date().toISOString(),
          endpoint,
          JSON.stringify(payload)
        )
        .run();

      console.log('Successfully logged simple request to database:', requestId);
    } catch (error) {
      console.error('Failed to log simple request to database:', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Log a complete request/response cycle
   */
  async logRequest(entry: RequestLogEntry): Promise<void> {
    if (!this.env.RESUME_DB) {
      console.warn(
        'Database logging disabled: RESUME_DB binding not available',
        { envKeys: Object.keys(this.env) }
      );
      return;
    }

    try {
      console.log('Attempting to log request to database:', {
        requestId: entry.requestId,
        endpoint: entry.endpoint,
        inputType: entry.inputType,
      });

      await this.env.RESUME_DB.prepare(
        `
        INSERT INTO request_logs (
          request_id, timestamp, method, endpoint, cf_country, cf_ray, user_agent,
          input_type, input_size_bytes, input_language, input_preview,
          success, processing_time_ms, ai_model_used,
          extracted_fields_count, validation_errors_count, partial_fields_count,
          pdf_pages, pdf_size_kb
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
        .bind(
          entry.requestId,
          entry.timestamp,
          entry.method,
          entry.endpoint,
          entry.cfCountry || null,
          entry.cfRay || null,
          entry.userAgent || null,
          entry.inputType,
          entry.inputSizeBytes,
          entry.inputLanguage,
          entry.inputPreview,
          entry.success,
          entry.processingTimeMs,
          entry.aiModelUsed,
          entry.extractedFieldsCount,
          entry.validationErrorsCount,
          entry.partialFieldsCount,
          entry.pdfPages || null,
          entry.pdfSizeKb || null
        )
        .run();

      console.log('Successfully logged request to database:', entry.requestId);

      // Update hourly stats
      await this.updateHourlyStats(entry);
    } catch (error) {
      console.error('Failed to log request to database:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        entry: {
          requestId: entry.requestId,
          endpoint: entry.endpoint,
          inputType: entry.inputType,
        },
      });
      // Don't fail the main request if logging fails
    }
  }

  /**
   * Log an error
   */
  async logError(entry: ErrorLogEntry): Promise<void> {
    if (!this.env.RESUME_DB) {
      return;
    }

    try {
      await this.env.RESUME_DB.prepare(
        `
        INSERT INTO error_logs (request_id, timestamp, error_code, error_message, stack_trace, endpoint)
        VALUES (?, ?, ?, ?, ?, ?)
      `
      )
        .bind(
          entry.requestId,
          entry.timestamp,
          entry.errorCode,
          entry.errorMessage,
          entry.stackTrace,
          entry.endpoint
        )
        .run();
    } catch (error) {
      console.error('Failed to log error to database:', error);
    }
  }

  /**
   * Update hourly statistics
   */
  private async updateHourlyStats(entry: RequestLogEntry): Promise<void> {
    if (!this.env.RESUME_DB) {
      return;
    }

    const now = new Date(entry.timestamp);
    const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const hour = now.getHours();

    try {
      console.log(
        'Updating hourly stats for:',
        entry.requestId,
        'at hour:',
        hour
      );

      // Use INSERT OR REPLACE to update stats
      const result = await this.env.RESUME_DB.prepare(
        `
        INSERT INTO processing_stats (
          date, hour, total_requests, successful_requests, failed_requests,
          text_requests, pdf_requests,
          english_requests, russian_requests, other_language_requests
        ) VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(date, hour) DO UPDATE SET
          total_requests = total_requests + 1,
          successful_requests = successful_requests + excluded.successful_requests,
          failed_requests = failed_requests + excluded.failed_requests,
          text_requests = text_requests + excluded.text_requests,
          pdf_requests = pdf_requests + excluded.pdf_requests,
          english_requests = english_requests + excluded.english_requests,
          russian_requests = russian_requests + excluded.russian_requests,
          other_language_requests = other_language_requests + excluded.other_language_requests
      `
      )
        .bind(
          date,
          hour,
          entry.success ? 1 : 0, // successful_requests
          entry.success ? 0 : 1, // failed_requests
          entry.inputType === 'text' ? 1 : 0, // text_requests
          entry.inputType === 'pdf' ? 1 : 0, // pdf_requests
          entry.inputLanguage === 'en' ? 1 : 0, // english_requests
          entry.inputLanguage === 'ru' ? 1 : 0, // russian_requests
          !['en', 'ru'].includes(entry.inputLanguage) ? 1 : 0 // other_language_requests
        )
        .run();

      console.log('Successfully updated hourly stats:', result);
    } catch (error) {
      console.error('Failed to update hourly stats:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        entry: { requestId: entry.requestId, date, hour },
      });
    }
  }

  /**
   * Get recent analytics
   */
  async getAnalytics(days: number = 7): Promise<any> {
    if (!this.env.RESUME_DB) {
      return null;
    }

    try {
      const stats = await this.env.RESUME_DB.prepare(
        `
        SELECT 
          date,
          SUM(total_requests) as total_requests,
          SUM(successful_requests) as successful_requests,
          SUM(failed_requests) as failed_requests,
          SUM(text_requests) as text_requests,
          SUM(pdf_requests) as pdf_requests,
          ROUND(AVG(avg_processing_time_ms), 2) as avg_processing_time_ms
        FROM processing_stats 
        WHERE date >= date('now', '-${days} days')
        GROUP BY date
        ORDER BY date DESC
      `
      ).all();

      return stats.results || [];
    } catch (error) {
      console.error('Failed to get analytics:', error);
      return null;
    }
  }

  /**
   * Cleanup old logs (run periodically)
   */
  async cleanupOldLogs(retentionDays: number = 90): Promise<void> {
    if (!this.env.RESUME_DB) {
      return;
    }

    try {
      // Delete old request logs
      await this.env.RESUME_DB.prepare(
        `
        DELETE FROM request_logs 
        WHERE timestamp < datetime('now', '-${retentionDays} days')
      `
      ).run();

      // Delete old error logs
      await this.env.RESUME_DB.prepare(
        `
        DELETE FROM error_logs 
        WHERE timestamp < datetime('now', '-${retentionDays} days')
      `
      ).run();

      // Keep stats longer (1 year)
      await this.env.RESUME_DB.prepare(
        `
        DELETE FROM processing_stats 
        WHERE date < date('now', '-365 days')
      `
      ).run();
    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
    }
  }
}

/**
 * Helper function to create a request log entry
 */
export function createRequestLogEntry(
  requestId: string,
  request: Request,
  inputData: {
    type: 'text' | 'pdf';
    sizeBytes: number;
    language: string;
    preview: string;
  },
  result: {
    success: boolean;
    processingTimeMs: number;
    aiModelUsed: string;
    extractedFieldsCount: number;
    validationErrorsCount: number;
    partialFieldsCount: number;
    pdfPages?: number;
    pdfSizeKb?: number;
  }
): RequestLogEntry {
  const url = new URL(request.url);

  const cfCountry = (request.cf as any)?.country;
  const cfRay = request.headers.get('cf-ray');
  const userAgent = request.headers.get('user-agent');

  return {
    requestId,
    timestamp: new Date().toISOString(),
    method: request.method,
    endpoint: url.pathname,
    ...(cfCountry && { cfCountry }),
    ...(cfRay && { cfRay }),
    ...(userAgent && { userAgent }),
    inputType: inputData.type,
    inputSizeBytes: inputData.sizeBytes,
    inputLanguage: inputData.language,
    inputPreview: sanitizeForDatabase(inputData.preview),
    success: result.success,
    processingTimeMs: result.processingTimeMs,
    aiModelUsed: result.aiModelUsed,
    extractedFieldsCount: result.extractedFieldsCount,
    validationErrorsCount: result.validationErrorsCount,
    partialFieldsCount: result.partialFieldsCount,
    ...(result.pdfPages && { pdfPages: result.pdfPages }),
    ...(result.pdfSizeKb && { pdfSizeKb: result.pdfSizeKb }),
  };
}

/**
 * Enhanced sanitization for database storage
 */
export function sanitizeForDatabase(text: string): string {
  return text
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]')
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
    .replace(/\b\d{3}-\d{3}-\d{4}\b/g, '[PHONE]')
    .replace(/\b\d{16}\b/g, '[CARD]')
    .replace(/\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, '[CARD]')
    .substring(0, 200); // Max 200 chars for preview
}
