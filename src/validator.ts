import { ResumeData, Skill, Experience, SalaryExpectation } from './types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates resume data against the schema requirements
 */
export function validateResumeData(data: Partial<ResumeData>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate required fields
  if (!data.desired_titles || data.desired_titles.length === 0) {
    errors.push('desired_titles is required and must not be empty');
  } else {
    // Check uniqueness and non-empty titles
    const uniqueTitles = new Set(data.desired_titles);
    if (uniqueTitles.size !== data.desired_titles.length) {
      warnings.push('desired_titles contains duplicates');
    }
    
    if (data.desired_titles.some(title => !title.trim())) {
      errors.push('desired_titles cannot contain empty strings');
    }
  }

  if (!data.summary || data.summary.trim().length === 0) {
    errors.push('summary is required and cannot be empty');
  }

  if (!data.skills || data.skills.length === 0) {
    errors.push('skills is required and must not be empty');
  } else {
    validateSkills(data.skills, errors, warnings);
  }

  if (!data.experience || data.experience.length === 0) {
    errors.push('experience is required and must not be empty');
  } else {
    validateExperience(data.experience, errors, warnings);
  }

  // Validate optional fields
  if (data.location_preference) {
    validateLocationPreference(data.location_preference, errors, warnings);
  }

  if (data.schedule) {
    const validSchedules = ['full_time', 'part_time', 'contract', 'freelance', 'internship', 'temporary'];
    if (!validSchedules.includes(data.schedule)) {
      errors.push(`Invalid schedule: ${data.schedule}`);
    }
  }

  if (data.salary_expectation) {
    validateSalaryExpectation(data.salary_expectation, errors, warnings);
  }

  if (data.links) {
    validateLinks(data.links, errors, warnings);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates skills array
 */
function validateSkills(skills: Skill[], errors: string[], warnings: string[]): void {
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
        if (!Number.isInteger(skill.level) || skill.level < 1 || skill.level > 5) {
          errors.push(`Skill "${skill.name}" has invalid level: ${skill.level} (must be 1-5)`);
        }
        
        // Validate label matches level
        if (skill.label) {
          const levelLabels = {
            1: 'basic',
            2: 'limited', 
            3: 'proficient',
            4: 'advanced',
            5: 'expert'
          };
          
          if (skill.label !== levelLabels[skill.level as keyof typeof levelLabels]) {
            warnings.push(`Skill "${skill.name}" label "${skill.label}" doesn't match level ${skill.level}`);
          }
        }
      }
      
      if (skill.type) {
        const validTypes = ['programming_language', 'spoken_language', 'framework', 'tool', 'domain', 'methodology', 'soft_skill', 'other'];
        if (!validTypes.includes(skill.type)) {
          warnings.push(`Skill "${skill.name}" has invalid type: ${skill.type}`);
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
function validateExperience(experience: Experience[], errors: string[], warnings: string[]): void {
  experience.forEach((exp, index) => {
    if (!exp.title || !exp.title.trim()) {
      errors.push(`Experience at index ${index} must have a non-empty title`);
    }
    
    if (!exp.start) {
      errors.push(`Experience at index ${index} must have a start date`);
    } else if (!validateDateFormat(exp.start)) {
      errors.push(`Experience at index ${index} has invalid start date format: ${exp.start} (expected YYYY-MM)`);
    }
    
    if (exp.end && exp.end !== 'present' && exp.end !== 'Present') {
      if (!validateDateFormat(exp.end)) {
        errors.push(`Experience at index ${index} has invalid end date format: ${exp.end} (expected YYYY-MM or "present")`);
      }
    }
    
    if (!exp.description || !exp.description.trim()) {
      errors.push(`Experience at index ${index} must have a non-empty description`);
    }
  });
}

/**
 * Validates location preference
 */
function validateLocationPreference(locationPref: any, errors: string[], warnings: string[]): void {
  if (locationPref.type) {
    const validTypes = ['remote', 'hybrid', 'onsite'];
    if (!validTypes.includes(locationPref.type)) {
      errors.push(`Invalid location preference type: ${locationPref.type}`);
    }
  }
  
  if (locationPref.preferred_locations && !Array.isArray(locationPref.preferred_locations)) {
    errors.push('preferred_locations must be an array');
  }
}

/**
 * Validates salary expectation
 */
function validateSalaryExpectation(salary: SalaryExpectation, errors: string[], warnings: string[]): void {
  if (!salary.currency) {
    errors.push('salary_expectation must have currency');
  } else if (!/^[A-Z]{3}$/.test(salary.currency)) {
    errors.push(`Invalid currency format: ${salary.currency} (expected 3-letter code like USD)`);
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
  
  if (salary.min !== undefined && salary.max !== undefined && salary.min > salary.max) {
    warnings.push('salary_expectation min is greater than max');
  }
}

/**
 * Validates links array
 */
function validateLinks(links: any[], errors: string[], warnings: string[]): void {
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
