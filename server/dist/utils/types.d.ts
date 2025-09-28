import { Request } from 'express';
export interface IUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    skills: string;
    isActive: boolean;
    jobPreferences: {
        jobTypes: string[];
        locations: string[];
        salaryRange: {
            min: number;
            max: number;
        };
        remoteWork: boolean;
    };
    applicationStats: {
        totalApplications: number;
        successfulApplications: number;
        lastApplicationDate?: string;
    };
    createdAt: string;
    updatedAt: string;
}
export interface IJob {
    id: string;
    title: string;
    company: string;
    location: string;
    description: string;
    requirements: string[];
    salary?: {
        min?: number;
        max?: number;
        currency: string;
    };
    jobType: 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary';
    remote: boolean;
    applicationUrl: string;
    sourcePortal: 'linkedin' | 'indeed' | 'glassdoor' | 'naukri' | 'monster' | 'other';
    postedDate: string;
    expiryDate?: string;
    skills: string[];
    benefits: string[];
    companySize?: string;
    industry?: string;
    experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
    status: 'active' | 'expired' | 'filled';
    scrapedAt: string;
    createdAt: string;
    updatedAt: string;
}
export interface IApplication {
    id: string;
    userId: string;
    jobId: string;
    status: 'pending' | 'applied' | 'reviewing' | 'interview' | 'rejected' | 'accepted';
    appliedDate: string;
    coverLetter: string;
    customAnswers: Array<{
        question: string;
        answer: string;
    }>;
    applicationMethod: 'automated' | 'manual';
    responseReceived: boolean;
    responseDate?: string;
    responseDetails?: string;
    interviewDate?: string;
    notes?: string;
    automationLog: Array<{
        timestamp: string;
        action: string;
        status: string;
        details: string;
    }>;
    createdAt: string;
    updatedAt: string;
    user?: IUser;
    job?: IJob;
}
export interface AuthRequest extends Request {
    user?: IUser;
}
export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}
export interface PaginationQuery {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
export interface ScrapedJobData {
    title: string;
    company: string;
    location: string;
    description: string;
    requirements: string[];
    applicationUrl: string;
    sourcePortal: IJob['sourcePortal'];
    skills: string[];
    jobType: IJob['jobType'];
    remote: boolean;
    experienceLevel: IJob['experienceLevel'];
}
export interface CoverLetterRequest {
    jobId: string;
    customPrompt?: string;
}
export interface QuestionAnswerRequest {
    jobId: string;
    question: string;
}
export interface OptimizationSuggestion {
    matchScore: number;
    matchingSkills: string[];
    skillsToHighlight: string[];
    keyPoints: string[];
    concerns: string[];
}
export interface Database {
    public: {
        Tables: {
            user_profiles: {
                Row: IUser;
                Insert: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'>;
                Update: Partial<Omit<IUser, 'id' | 'createdAt' | 'updatedAt'>>;
            };
            jobs: {
                Row: IJob;
                Insert: Omit<IJob, 'id' | 'createdAt' | 'updatedAt'>;
                Update: Partial<Omit<IJob, 'id' | 'createdAt' | 'updatedAt'>>;
            };
            applications: {
                Row: IApplication;
                Insert: Omit<IApplication, 'id' | 'createdAt' | 'updatedAt'>;
                Update: Partial<Omit<IApplication, 'id' | 'createdAt' | 'updatedAt'>>;
            };
        };
    };
}
//# sourceMappingURL=types.d.ts.map