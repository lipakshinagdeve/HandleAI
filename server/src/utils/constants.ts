export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

export const JOB_TYPES = {
  FULL_TIME: 'full-time',
  PART_TIME: 'part-time',
  CONTRACT: 'contract',
  INTERNSHIP: 'internship',
  TEMPORARY: 'temporary'
} as const;

export const EXPERIENCE_LEVELS = {
  ENTRY: 'entry',
  MID: 'mid',
  SENIOR: 'senior',
  EXECUTIVE: 'executive'
} as const;

export const SOURCE_PORTALS = {
  LINKEDIN: 'linkedin',
  INDEED: 'indeed',
  GLASSDOOR: 'glassdoor',
  NAUKRI: 'naukri',
  MONSTER: 'monster',
  OTHER: 'other'
} as const;

export const APPLICATION_STATUS = {
  PENDING: 'pending',
  APPLIED: 'applied',
  REVIEWING: 'reviewing',
  INTERVIEW: 'interview',
  REJECTED: 'rejected',
  ACCEPTED: 'accepted'
} as const;

export const APPLICATION_METHOD = {
  AUTOMATED: 'automated',
  MANUAL: 'manual'
} as const;

export const JOB_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  FILLED: 'filled'
} as const;

export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  USER_EXISTS: 'User with this email already exists',
  UNAUTHORIZED: 'Not authorized to access this route',
  TOKEN_INVALID: 'Invalid token',
  TOKEN_EXPIRED: 'Token expired',
  VALIDATION_ERROR: 'Validation error',
  SERVER_ERROR: 'Internal server error',
  JOB_NOT_FOUND: 'Job not found',
  APPLICATION_EXISTS: 'Application already exists for this job',
  OPENAI_ERROR: 'AI service temporarily unavailable'
} as const;

export const SUCCESS_MESSAGES = {
  USER_REGISTERED: 'User registered successfully',
  USER_LOGGED_IN: 'User logged in successfully',
  USER_LOGGED_OUT: 'User logged out successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  APPLICATION_SUBMITTED: 'Application submitted successfully',
  JOBS_SCRAPED: 'Jobs scraped successfully',
  COVER_LETTER_GENERATED: 'Cover letter generated successfully'
} as const;

export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  SKILLS_MIN_LENGTH: 10,
  SKILLS_MAX_LENGTH: 1000,
  PHONE_REGEX: /^[\+]?[1-9][\d]{0,15}$/
} as const;

export const RATE_LIMITS = {
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5 // limit each IP to 5 requests per windowMs
  },
  API: {
    windowMs: 15 * 60 * 1000,
    max: 100
  },
  AI: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50
  }
} as const;

export const SCRAPING_CONFIG = {
  MAX_JOBS_PER_PORTAL: 50,
  DELAY_BETWEEN_REQUESTS: 2000, // 2 seconds
  MAX_RETRIES: 3,
  TIMEOUT: 30000 // 30 seconds
} as const;