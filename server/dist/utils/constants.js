"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCRAPING_CONFIG = exports.RATE_LIMITS = exports.VALIDATION_RULES = exports.SUCCESS_MESSAGES = exports.ERROR_MESSAGES = exports.JOB_STATUS = exports.APPLICATION_METHOD = exports.APPLICATION_STATUS = exports.SOURCE_PORTALS = exports.EXPERIENCE_LEVELS = exports.JOB_TYPES = exports.HTTP_STATUS = void 0;
exports.HTTP_STATUS = {
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
};
exports.JOB_TYPES = {
    FULL_TIME: 'full-time',
    PART_TIME: 'part-time',
    CONTRACT: 'contract',
    INTERNSHIP: 'internship',
    TEMPORARY: 'temporary'
};
exports.EXPERIENCE_LEVELS = {
    ENTRY: 'entry',
    MID: 'mid',
    SENIOR: 'senior',
    EXECUTIVE: 'executive'
};
exports.SOURCE_PORTALS = {
    LINKEDIN: 'linkedin',
    INDEED: 'indeed',
    GLASSDOOR: 'glassdoor',
    NAUKRI: 'naukri',
    MONSTER: 'monster',
    OTHER: 'other'
};
exports.APPLICATION_STATUS = {
    PENDING: 'pending',
    APPLIED: 'applied',
    REVIEWING: 'reviewing',
    INTERVIEW: 'interview',
    REJECTED: 'rejected',
    ACCEPTED: 'accepted'
};
exports.APPLICATION_METHOD = {
    AUTOMATED: 'automated',
    MANUAL: 'manual'
};
exports.JOB_STATUS = {
    ACTIVE: 'active',
    EXPIRED: 'expired',
    FILLED: 'filled'
};
exports.ERROR_MESSAGES = {
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
};
exports.SUCCESS_MESSAGES = {
    USER_REGISTERED: 'User registered successfully',
    USER_LOGGED_IN: 'User logged in successfully',
    USER_LOGGED_OUT: 'User logged out successfully',
    PROFILE_UPDATED: 'Profile updated successfully',
    APPLICATION_SUBMITTED: 'Application submitted successfully',
    JOBS_SCRAPED: 'Jobs scraped successfully',
    COVER_LETTER_GENERATED: 'Cover letter generated successfully'
};
exports.VALIDATION_RULES = {
    PASSWORD_MIN_LENGTH: 6,
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 50,
    SKILLS_MIN_LENGTH: 10,
    SKILLS_MAX_LENGTH: 1000,
    PHONE_REGEX: /^[\+]?[1-9][\d]{0,15}$/
};
exports.RATE_LIMITS = {
    AUTH: {
        windowMs: 15 * 60 * 1000,
        max: 5
    },
    API: {
        windowMs: 15 * 60 * 1000,
        max: 100
    },
    AI: {
        windowMs: 60 * 60 * 1000,
        max: 50
    }
};
exports.SCRAPING_CONFIG = {
    MAX_JOBS_PER_PORTAL: 50,
    DELAY_BETWEEN_REQUESTS: 2000,
    MAX_RETRIES: 3,
    TIMEOUT: 30000
};
//# sourceMappingURL=constants.js.map