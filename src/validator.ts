import {
  ResumeData,
  Skill,
  Experience,
  SalaryExpectation,
  ValidationError,
  PartialResumeData,
} from './types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validation_errors?: ValidationError[];
  partial_fields?: string[];
  confidence_scores?: { [key: string]: number };
}

/**
 * Validates resume data against the schema requirements
 */
export function validateResumeData(
  data: Partial<ResumeData>,
  options: { flexible_validation?: boolean; strict_validation?: boolean } = {}
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const validationErrors: ValidationError[] = [];
  const partialFields: string[] = [];
  const confidenceScores: { [key: string]: number } = {};

  const { flexible_validation = false, strict_validation = false } = options;

  // Validate required fields with flexible validation support
  if (!data.desired_titles || data.desired_titles.length === 0) {
    const error = {
      field: 'desired_titles',
      error: 'missing' as const,
      suggestion:
        "Add 'Desired Position' or 'Objective' section to your resume",
      severity: (flexible_validation ? 'warning' : 'error') as
        | 'warning'
        | 'error',
    };
    validationErrors.push(error);

    if (flexible_validation) {
      partialFields.push('desired_titles');
      confidenceScores.desired_titles = 0;
      warnings.push(
        'desired_titles is missing - consider adding desired position information'
      );
    } else {
      errors.push('desired_titles is required and must not be empty');
    }
  } else {
    // Check uniqueness and non-empty titles
    const uniqueTitles = new Set(data.desired_titles);
    if (uniqueTitles.size !== data.desired_titles.length) {
      validationErrors.push({
        field: 'desired_titles',
        error: 'duplicate',
        suggestion:
          'Remove duplicate job titles from the desired positions list',
        severity: 'warning',
      });
      warnings.push('desired_titles contains duplicates');
    }

    if (data.desired_titles.some(title => !title.trim())) {
      validationErrors.push({
        field: 'desired_titles',
        error: 'empty',
        suggestion: 'Remove empty entries from desired job titles',
        severity: 'error',
      });
      errors.push('desired_titles cannot contain empty strings');
    } else {
      confidenceScores.desired_titles = 0.9;
    }
  }

  if (!data.summary || data.summary.trim().length === 0) {
    const error = {
      field: 'summary',
      error: 'missing' as const,
      suggestion:
        "Add a 'Professional Summary' or 'About' section describing your experience",
      severity: (flexible_validation ? 'warning' : 'error') as
        | 'warning'
        | 'error',
    };
    validationErrors.push(error);

    if (flexible_validation) {
      partialFields.push('summary');
      confidenceScores.summary = 0;
      warnings.push(
        'summary is missing - consider adding a professional summary'
      );
    } else {
      errors.push('summary is required and cannot be empty');
    }
  } else {
    confidenceScores.summary = Math.min(1.0, data.summary.length / 200); // Confidence based on length
  }

  if (!data.skills || data.skills.length === 0) {
    const error = {
      field: 'skills',
      error: 'missing' as const,
      suggestion:
        "Add a 'Skills' section listing your technical and soft skills",
      severity: (flexible_validation ? 'warning' : 'error') as
        | 'warning'
        | 'error',
    };
    validationErrors.push(error);

    if (flexible_validation) {
      partialFields.push('skills');
      confidenceScores.skills = 0;
      warnings.push('skills section is missing - consider adding your skills');
    } else {
      errors.push('skills is required and must not be empty');
    }
  } else {
    validateSkills(data.skills, errors, warnings, validationErrors);
    confidenceScores.skills = Math.min(1.0, data.skills.length / 10); // Confidence based on number of skills
  }

  if (!data.experience || data.experience.length === 0) {
    const error = {
      field: 'experience',
      error: 'missing' as const,
      suggestion:
        "Add an 'Experience' or 'Work History' section with your previous positions",
      severity: (flexible_validation ? 'warning' : 'error') as
        | 'warning'
        | 'error',
    };
    validationErrors.push(error);

    if (flexible_validation) {
      partialFields.push('experience');
      confidenceScores.experience = 0;
      warnings.push(
        'experience section is missing - consider adding work history'
      );
    } else {
      errors.push('experience is required and must not be empty');
    }
  } else {
    validateExperience(data.experience, errors, warnings, validationErrors);
    confidenceScores.experience = Math.min(1.0, data.experience.length / 3); // Confidence based on number of positions
  }

  // Validate optional fields
  if (data.location_preference) {
    validateLocationPreference(data.location_preference, errors, warnings);
  }

  if (data.schedule) {
    const validSchedules = [
      'full_time',
      'part_time',
      'contract',
      'freelance',
      'internship',
      'temporary',
      'полный день',
      'частичная занятость',
      'удаленная работа',
      'Full-time',
      'Part-time',
      'Remote work',
    ];
    if (!validSchedules.includes(data.schedule)) {
      // For flexible validation, just warn instead of error
      if (flexible_validation) {
        warnings.push(
          `Schedule format may need standardization: ${data.schedule}`
        );
      } else {
        errors.push(`Invalid schedule: ${data.schedule}`);
      }
    }
  }

  if (data.salary_expectation) {
    validateSalaryExpectation(data.salary_expectation, errors, warnings);
  }

  if (data.links) {
    validateLinks(data.links, errors, warnings);
  }

  return {
    isValid:
      errors.length === 0 &&
      (flexible_validation || partialFields.length === 0),
    errors,
    warnings,
    validation_errors: validationErrors,
    partial_fields: partialFields,
    confidence_scores: confidenceScores,
  };
}

/**
 * Validates skills array
 */
function validateSkills(
  skills: Skill[],
  errors: string[],
  warnings: string[],
  validationErrors?: ValidationError[]
): void {
  skills.forEach((skill, index) => {
    if (typeof skill === 'string') {
      if (!skill.trim()) {
        errors.push(`Skill at index ${index} cannot be empty string`);
      }
    } else if (typeof skill === 'object') {
      if (!skill.name || !skill.name.trim()) {
        errors.push(`Skill at index ${index} must have a non-empty name`);
      }

      if (skill.level !== undefined) {
        if (
          !Number.isInteger(skill.level) ||
          skill.level < 1 ||
          skill.level > 5
        ) {
          errors.push(
            `Skill "${skill.name}" has invalid level: ${skill.level} (must be 1-5)`
          );
        }

        // Validate label matches level
        if (skill.label) {
          const levelLabels = {
            1: 'basic',
            2: 'limited',
            3: 'proficient',
            4: 'advanced',
            5: 'expert',
          };

          if (
            skill.label !== levelLabels[skill.level as keyof typeof levelLabels]
          ) {
            warnings.push(
              `Skill "${skill.name}" label "${skill.label}" doesn't match level ${skill.level}`
            );
          }
        }
      }

      if (skill.type) {
        const validTypes = [
          'programming_language',
          'spoken_language',
          'framework',
          'tool',
          'domain',
          'methodology',
          'soft_skill',
          'other',
        ];
        if (!validTypes.includes(skill.type)) {
          warnings.push(
            `Skill "${skill.name}" has invalid type: ${skill.type}`
          );
        }
      }
    } else {
      errors.push(`Skill at index ${index} has invalid type: ${typeof skill}`);
    }
  });
}

/**
 * Validates experience array
 */
function validateExperience(
  experience: Experience[],
  errors: string[],
  warnings: string[],
  validationErrors?: ValidationError[]
): void {
  experience.forEach((exp, index) => {
    if (!exp.title || !exp.title.trim()) {
      errors.push(`Experience at index ${index} must have a non-empty title`);
    }

    if (!exp.start) {
      errors.push(`Experience at index ${index} must have a start date`);
    } else if (!validateDateFormat(exp.start)) {
      errors.push(
        `Experience at index ${index} has invalid start date format: ${exp.start} (expected YYYY-MM)`
      );
    }

    if (exp.end && exp.end !== 'present' && exp.end !== 'Present') {
      if (!validateDateFormat(exp.end)) {
        errors.push(
          `Experience at index ${index} has invalid end date format: ${exp.end} (expected YYYY-MM or "present")`
        );
      }
    }

    if (!exp.description || !exp.description.trim()) {
      errors.push(
        `Experience at index ${index} must have a non-empty description`
      );
    }
  });
}

/**
 * Validates location preference
 */
function validateLocationPreference(
  locationPref: any,
  errors: string[],
  warnings: string[]
): void {
  if (locationPref.type) {
    const validTypes = ['remote', 'hybrid', 'onsite', 'specific', 'flexible'];
    if (!validTypes.includes(locationPref.type)) {
      errors.push(`Invalid location preference type: ${locationPref.type}`);
    }
  }

  if (
    locationPref.preferred_locations &&
    !Array.isArray(locationPref.preferred_locations)
  ) {
    errors.push('preferred_locations must be an array');
  }
}

/**
 * Validates salary expectation
 */
function validateSalaryExpectation(
  salary: SalaryExpectation,
  errors: string[],
  warnings: string[]
): void {
  if (!salary.currency) {
    errors.push('salary_expectation must have currency');
  } else if (!/^[A-Z]{3}$/.test(salary.currency)) {
    errors.push(
      `Invalid currency format: ${salary.currency} (expected 3-letter code like USD)`
    );
  }

  if (!salary.periodicity) {
    errors.push('salary_expectation must have periodicity');
  } else {
    const validPeriods = ['year', 'month', 'day', 'hour', 'project'];
    if (!validPeriods.includes(salary.periodicity)) {
      errors.push(`Invalid periodicity: ${salary.periodicity}`);
    }
  }

  if (salary.min !== undefined && salary.min < 0) {
    errors.push('salary_expectation min cannot be negative');
  }

  if (salary.max !== undefined && salary.max < 0) {
    errors.push('salary_expectation max cannot be negative');
  }

  if (
    salary.min !== undefined &&
    salary.max !== undefined &&
    salary.min > salary.max
  ) {
    warnings.push('salary_expectation min is greater than max');
  }
}

/**
 * Validates links array
 */
function validateLinks(
  links: any[],
  errors: string[],
  warnings: string[]
): void {
  links.forEach((link, index) => {
    if (!link.label || !link.label.trim()) {
      errors.push(`Link at index ${index} must have a non-empty label`);
    }

    if (!link.url) {
      errors.push(`Link at index ${index} must have a URL`);
    } else if (!isValidUrl(link.url)) {
      errors.push(`Link at index ${index} has invalid URL: ${link.url}`);
    }
  });
}

/**
 * Validates date format (YYYY-MM)
 */
function validateDateFormat(date: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(date);
}

/**
 * Validates URL format
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
