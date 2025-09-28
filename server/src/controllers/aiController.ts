// src/controllers/aiController.ts

import { Response } from 'express';
// 🎯 FIX: Import the Supabase Client
import { supabase } from '../config/supabase'; 
import { AIService } from '../services/aiService';
// 🎯 NOTE: Import IJob for strong typing the job object
import { AuthRequest, IJob } from '../utils/types'; 
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants';

const aiService = new AIService();

// Helper function to fetch job details from Supabase
const fetchJobDetails = async (jobId: string): Promise<IJob | null> => {
    // Assuming your jobs table is named 'jobs' and the primary key is 'id'
    const { data: jobArray, error } = await supabase
        .from('jobs') 
        .select('*')
        .eq('id', jobId)
        .limit(1);

    if (error) {
        console.error('Supabase fetch error:', error);
        throw new Error('Database query failed');
    }

    // Cast and extract the single job object
    const job: IJob | undefined = jobArray?.[0] as IJob | undefined;
    
    return job || null;
}


export const generateCoverLetter = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { jobId } = req.body;

        // Get job details using Supabase helper
        const job = await fetchJobDetails(jobId);

        if (!job) {
            res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: ERROR_MESSAGES.JOB_NOT_FOUND
            });
            return;
        }

        // Generate cover letter using AI service
        const coverLetter = await aiService.generateCoverLetter(job, req.user!);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            coverLetter,
            jobTitle: job.title,
            company: job.company
        });

    } catch (error: any) {
        console.error('Cover letter generation error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            // Use a more specific error if the fetch failed due to a database issue
            message: error.message === 'Database query failed' ? ERROR_MESSAGES.SERVER_ERROR : ERROR_MESSAGES.OPENAI_ERROR
        });
    }
};

// --------------------------------------------------------------------------------------

export const answerJobQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { jobId, question } = req.body;

        if (!question || question.trim().length === 0) {
            res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Question is required'
            });
            return;
        }

        // Get job details using Supabase helper
        const job = await fetchJobDetails(jobId);

        if (!job) {
            res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: ERROR_MESSAGES.JOB_NOT_FOUND
            });
            return;
        }

        // Generate answer using AI service
        const answer = await aiService.answerJobQuestion(question, job, req.user!);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            question,
            answer,
            jobTitle: job.title,
            company: job.company
        });

    } catch (error: any) {
        console.error('Question answering error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message === 'Database query failed' ? ERROR_MESSAGES.SERVER_ERROR : ERROR_MESSAGES.OPENAI_ERROR
        });
    }
};

// --------------------------------------------------------------------------------------

export const answerMultipleQuestions = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { jobId, questions } = req.body;

        if (!questions || !Array.isArray(questions) || questions.length === 0) {
            res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Questions array is required'
            });
            return;
        }

        if (questions.length > 10) {
            res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Maximum 10 questions allowed per request'
            });
            return;
        }

        // Get job details using Supabase helper
        const job = await fetchJobDetails(jobId);

        if (!job) {
            res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: ERROR_MESSAGES.JOB_NOT_FOUND
            });
            return;
        }

        // Generate answers using AI service
        const answers = await aiService.generateCustomAnswers(questions, job, req.user!);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            answers,
            jobTitle: job.title,
            company: job.company,
            totalQuestions: questions.length
        });

    } catch (error: any) {
        console.error('Multiple questions answering error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message === 'Database query failed' ? ERROR_MESSAGES.SERVER_ERROR : ERROR_MESSAGES.OPENAI_ERROR
        });
    }
};

// --------------------------------------------------------------------------------------

export const optimizeApplication = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { jobId } = req.body;

        // Get job details using Supabase helper
        const job = await fetchJobDetails(jobId);

        if (!job) {
            res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: ERROR_MESSAGES.JOB_NOT_FOUND
            });
            return;
        }

        // Get optimization suggestions using AI service
        const optimization = await aiService.optimizeApplication(job, req.user!);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            jobTitle: job.title,
            company: job.company,
            optimization
        });

    } catch (error: any) {
        console.error('Application optimization error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message === 'Database query failed' ? ERROR_MESSAGES.SERVER_ERROR : ERROR_MESSAGES.OPENAI_ERROR
        });
    }
};

// --------------------------------------------------------------------------------------

export const getAISuggestions = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Based on user's skills, provide general suggestions
        const skills = req.user!.skills.toLowerCase();
        const suggestions: string[] = [];

        // Skill-based suggestions
        if (skills.includes('python') || skills.includes('javascript')) {
            suggestions.push(
                'Highlight your programming projects and contributions',
                'Mention specific frameworks and libraries you\'ve used',
                'Include links to your GitHub or portfolio'
            );
        }

        if (skills.includes('react') || skills.includes('frontend')) {
            suggestions.push(
                'Showcase your UI/UX design experience',
                'Mention responsive design capabilities',
                'Include examples of user-friendly interfaces you\'ve built'
            );
        }

        if (skills.includes('backend') || skills.includes('api')) {
            suggestions.push(
                'Emphasize your database design experience',
                'Highlight API development and integration skills',
                'Mention scalability and performance optimization experience'
            );
        }

        // General suggestions
        const generalSuggestions = [
            'Tailor each application to the specific job requirements',
            'Use keywords from the job description in your application',
            'Quantify your achievements with specific numbers and results',
            'Research the company culture and values before applying',
            'Follow up professionally after submitting applications'
        ];

        res.status(HTTP_STATUS.OK).json({
            success: true,
            skillBasedSuggestions: suggestions.slice(0, 3),
            generalSuggestions
        });

    } catch (error: any) {
        console.error('AI suggestions error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
};//