// Environment bindings for Cloudflare Worker
export interface Env {
  AI: Ai;
  WORKER_TYPE?: string;
  ENVIRONMENT?: string;
  RESUME_DB?: D1Database; // Add D1 database binding
}

// Skill type definitions based on schema
export interface SkillObject {
  name: string;
  level: 1 | 2 | 3 | 4 | 5; // 1=Basic, 2=Limited, 3=Proficient, 4=Advanced, 5=Expert
  label?: 'basic' | 'limited' | 'proficient' | 'advanced' | 'expert';
  type?:
    | 'programming_language'
    | 'spoken_language'
    | 'framework'
    | 'tool'
    | 'domain'
    | 'methodology'
    | 'soft_skill'
    | 'other';
  notes?: string;
}

export type Skill = SkillObject | string; // Back-compat: plain string skills

// Experience entry type
export interface Experience {
  employer?: string;
  title: string;
  start: string; // YYYY-MM format
  end?: string | 'present' | 'Present' | null; // YYYY-MM, 'present', or null
  description: string;
  location?: string;
}

// Location preference
export interface LocationPreference {
  type?: 'remote' | 'hybrid' | 'onsite';
  preferred_locations?: string[];
}

// Salary expectation
export interface SalaryExpectation {
  currency: string; // 3-letter currency code
  min?: number;
  max?: number;
  periodicity: 'year' | 'month' | 'day' | 'hour' | 'project';
  notes?: string;
}

// Links/URLs
export interface Link {
  label: string;
  url: string;
}

// Main resume data structure
export interface ResumeData {
  version?: string;
  desired_titles: string[];
  summary: string;
  skills: Skill[];
  experience: Experience[];
  location_preference?: LocationPreference;
  schedule?:
    | 'full_time'
    | 'part_time'
    | 'contract'
    | 'freelance'
    | 'internship'
    | 'temporary';
  salary_expectation?: SalaryExpectation;
  availability?: string;
  links?: Link[];
}

// API request/response types
export interface ProcessResumeRequest {
  resume_text: string;
  language?: string; // ISO 639-1 code (e.g., 'en', 'ru', 'de') - defaults to 'en'
  options?: {
    include_unmapped?: boolean;
    strict_validation?: boolean;
    flexible_validation?: boolean; // Allow partial results
    callback_url?: string; // For progress callbacks
    callback_secret?: string; // For callback authentication
  };
}

// Streaming request types
export interface ProcessResumeStreamRequest extends ProcessResumeRequest {
  stream_id?: string; // Optional, will be generated if not provided
}

export interface ProcessResumeStreamResponse {
  stream_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress_percentage: number;
  current_step?: string;
  estimated_completion_time?: number; // milliseconds
  result?: ProcessResumeResponse;
  error?: string;
}

// Batch processing types
export interface BatchResumeItem {
  id: string;
  resume_text: string;
  language?: string;
  options?: ProcessResumeRequest['options'];
}

export interface ProcessResumeBatchRequest {
  resumes: BatchResumeItem[];
  options?: {
    max_concurrency?: number; // Default: 5
    callback_url?: string;
    callback_secret?: string;
  };
}

export interface BatchResumeResult {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: ProcessResumeResponse;
  error?: string;
}

export interface ProcessResumeBatchResponse {
  batch_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  total_resumes: number;
  completed_count: number;
  failed_count: number;
  results: BatchResumeResult[];
  estimated_completion_time?: number;
}

// Enhanced validation error with suggestions
export interface ValidationError {
  field: string;
  error: 'missing' | 'invalid' | 'empty' | 'duplicate';
  suggestion?: string;
  severity: 'error' | 'warning';
}

// Partial data response with missing fields tracking
export interface PartialResumeData extends ResumeData {
  partial_fields?: string[];
  confidence_scores?: {
    [key: string]: number; // 0-1 confidence score for each field
  };
}

export interface ProcessResumeResponse {
  success: boolean;
  data: ResumeData | PartialResumeData | null;
  unmapped_fields: string[];
  errors: string[];
  validation_errors?: ValidationError[];
  partial_fields?: string[];
  processing_time_ms: number;
  metadata?: {
    worker_version: string;
    ai_model_used: string;
    timestamp: string;
    format_detected?: 'chronological' | 'functional' | 'hybrid';
    format_confidence?: number;
  };
}

// Error types
export interface APIError {
  error: string;
  code: string;
  details?: string;
  timestamp: string;
}

// Health check response
export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  endpoints: string[];
  ai_status?: 'available' | 'unavailable';
}
