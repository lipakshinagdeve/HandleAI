export declare const HTTP_STATUS: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly NO_CONTENT: 204;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly CONFLICT: 409;
    readonly UNPROCESSABLE_ENTITY: 422;
    readonly TOO_MANY_REQUESTS: 429;
    readonly INTERNAL_SERVER_ERROR: 500;
    readonly SERVICE_UNAVAILABLE: 503;
};
export declare const JOB_TYPES: {
    readonly FULL_TIME: "full-time";
    readonly PART_TIME: "part-time";
    readonly CONTRACT: "contract";
    readonly INTERNSHIP: "internship";
    readonly TEMPORARY: "temporary";
};
export declare const EXPERIENCE_LEVELS: {
    readonly ENTRY: "entry";
    readonly MID: "mid";
    readonly SENIOR: "senior";
    readonly EXECUTIVE: "executive";
};
export declare const SOURCE_PORTALS: {
    readonly LINKEDIN: "linkedin";
    readonly INDEED: "indeed";
    readonly GLASSDOOR: "glassdoor";
    readonly NAUKRI: "naukri";
    readonly MONSTER: "monster";
    readonly OTHER: "other";
};
export declare const APPLICATION_STATUS: {
    readonly PENDING: "pending";
    readonly APPLIED: "applied";
    readonly REVIEWING: "reviewing";
    readonly INTERVIEW: "interview";
    readonly REJECTED: "rejected";
    readonly ACCEPTED: "accepted";
};
export declare const APPLICATION_METHOD: {
    readonly AUTOMATED: "automated";
    readonly MANUAL: "manual";
};
export declare const JOB_STATUS: {
    readonly ACTIVE: "active";
    readonly EXPIRED: "expired";
    readonly FILLED: "filled";
};
export declare const ERROR_MESSAGES: {
    readonly INVALID_CREDENTIALS: "Invalid email or password";
    readonly USER_NOT_FOUND: "User not found";
    readonly USER_EXISTS: "User with this email already exists";
    readonly UNAUTHORIZED: "Not authorized to access this route";
    readonly TOKEN_INVALID: "Invalid token";
    readonly TOKEN_EXPIRED: "Token expired";
    readonly VALIDATION_ERROR: "Validation error";
    readonly SERVER_ERROR: "Internal server error";
    readonly JOB_NOT_FOUND: "Job not found";
    readonly APPLICATION_EXISTS: "Application already exists for this job";
    readonly OPENAI_ERROR: "AI service temporarily unavailable";
};
export declare const SUCCESS_MESSAGES: {
    readonly USER_REGISTERED: "User registered successfully";
    readonly USER_LOGGED_IN: "User logged in successfully";
    readonly USER_LOGGED_OUT: "User logged out successfully";
    readonly PROFILE_UPDATED: "Profile updated successfully";
    readonly APPLICATION_SUBMITTED: "Application submitted successfully";
    readonly JOBS_SCRAPED: "Jobs scraped successfully";
    readonly COVER_LETTER_GENERATED: "Cover letter generated successfully";
};
export declare const VALIDATION_RULES: {
    readonly PASSWORD_MIN_LENGTH: 6;
    readonly NAME_MIN_LENGTH: 2;
    readonly NAME_MAX_LENGTH: 50;
    readonly SKILLS_MIN_LENGTH: 10;
    readonly SKILLS_MAX_LENGTH: 1000;
    readonly PHONE_REGEX: RegExp;
};
export declare const RATE_LIMITS: {
    readonly AUTH: {
        readonly windowMs: number;
        readonly max: 5;
    };
    readonly API: {
        readonly windowMs: number;
        readonly max: 100;
    };
    readonly AI: {
        readonly windowMs: number;
        readonly max: 50;
    };
};
export declare const SCRAPING_CONFIG: {
    readonly MAX_JOBS_PER_PORTAL: 50;
    readonly DELAY_BETWEEN_REQUESTS: 2000;
    readonly MAX_RETRIES: 3;
    readonly TIMEOUT: 30000;
};
//# sourceMappingURL=constants.d.ts.map