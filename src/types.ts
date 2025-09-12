// Environment bindings for Cloudflare Worker
export interface Env {
  AI: Ai;
  WORKER_TYPE?: string;
  ENVIRONMENT?: string;
}

// Skill type definitions based on schema
export interface SkillObject {
  name: string;
  level: 1 | 2 | 3 | 4 | 5; // 1=Basic, 2=Limited, 3=Proficient, 4=Advanced, 5=Expert
  label?: "basic" | "limited" | "proficient" | "advanced" | "expert";
  type?: "programming_language" | "spoken_language" | "framework" | "tool" | "domain" | "methodology" | "soft_skill" | "other";
  notes?: string;
}

export type Skill = SkillObject | string; // Back-compat: plain string skills

// Experience entry type
export interface Experience {
  employer?: string;
  title: string;
  start: string; // YYYY-MM format
  end?: string | "present" | "Present" | null; // YYYY-MM, 'present', or null
  description: string;
  location?: string;
}

// Location preference
export interface LocationPreference {
  type?: "remote" | "hybrid" | "onsite";
  preferred_locations?: string[];
}

// Salary expectation
export interface SalaryExpectation {
  currency: string; // 3-letter currency code
  min?: number;
  max?: number;
  periodicity: "year" | "month" | "day" | "hour" | "project";
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
  schedule?: "full_time" | "part_time" | "contract" | "freelance" | "internship" | "temporary";
  salary_expectation?: SalaryExpectation;
  availability?: string;
  links?: Link[];
}

// API request/response types
export interface ProcessResumeRequest {
  resume_text: string;
  options?: {
    include_unmapped?: boolean;
    strict_validation?: boolean;
  };
}

export interface ProcessResumeResponse {
  success: boolean;
  data: ResumeData | null;
  unmapped_fields: string[];
  errors: string[];
  processing_time_ms: number;
  metadata?: {
    worker_version: string;
    ai_model_used: string;
    timestamp: string;
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
  status: "healthy" | "unhealthy";
  timestamp: string;
  version: string;
  endpoints: string[];
  ai_status?: "available" | "unavailable";
}
