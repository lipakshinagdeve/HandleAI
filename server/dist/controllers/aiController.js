"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAISuggestions = exports.optimizeApplication = exports.answerMultipleQuestions = exports.answerJobQuestion = exports.generateCoverLetter = void 0;
const supabase_1 = require("../config/supabase");
const aiService_1 = require("../services/aiService");
const constants_1 = require("../utils/constants");
const aiService = new aiService_1.AIService();
const fetchJobDetails = async (jobId) => {
    const { data: jobArray, error } = await supabase_1.supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .limit(1);
    if (error) {
        console.error('Supabase fetch error:', error);
        throw new Error('Database query failed');
    }
    const job = jobArray?.[0];
    return job || null;
};
const generateCoverLetter = async (req, res) => {
    try {
        const { jobId } = req.body;
        const job = await fetchJobDetails(jobId);
        if (!job) {
            res.status(constants_1.HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: constants_1.ERROR_MESSAGES.JOB_NOT_FOUND
            });
            return;
        }
        const coverLetter = await aiService.generateCoverLetter(job, req.user);
        res.status(constants_1.HTTP_STATUS.OK).json({
            success: true,
            coverLetter,
            jobTitle: job.title,
            company: job.company
        });
    }
    catch (error) {
        console.error('Cover letter generation error:', error);
        res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message === 'Database query failed' ? constants_1.ERROR_MESSAGES.SERVER_ERROR : constants_1.ERROR_MESSAGES.OPENAI_ERROR
        });
    }
};
exports.generateCoverLetter = generateCoverLetter;
const answerJobQuestion = async (req, res) => {
    try {
        const { jobId, question } = req.body;
        if (!question || question.trim().length === 0) {
            res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Question is required'
            });
            return;
        }
        const job = await fetchJobDetails(jobId);
        if (!job) {
            res.status(constants_1.HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: constants_1.ERROR_MESSAGES.JOB_NOT_FOUND
            });
            return;
        }
        const answer = await aiService.answerJobQuestion(question, job, req.user);
        res.status(constants_1.HTTP_STATUS.OK).json({
            success: true,
            question,
            answer,
            jobTitle: job.title,
            company: job.company
        });
    }
    catch (error) {
        console.error('Question answering error:', error);
        res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message === 'Database query failed' ? constants_1.ERROR_MESSAGES.SERVER_ERROR : constants_1.ERROR_MESSAGES.OPENAI_ERROR
        });
    }
};
exports.answerJobQuestion = answerJobQuestion;
const answerMultipleQuestions = async (req, res) => {
    try {
        const { jobId, questions } = req.body;
        if (!questions || !Array.isArray(questions) || questions.length === 0) {
            res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Questions array is required'
            });
            return;
        }
        if (questions.length > 10) {
            res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Maximum 10 questions allowed per request'
            });
            return;
        }
        const job = await fetchJobDetails(jobId);
        if (!job) {
            res.status(constants_1.HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: constants_1.ERROR_MESSAGES.JOB_NOT_FOUND
            });
            return;
        }
        const answers = await aiService.generateCustomAnswers(questions, job, req.user);
        res.status(constants_1.HTTP_STATUS.OK).json({
            success: true,
            answers,
            jobTitle: job.title,
            company: job.company,
            totalQuestions: questions.length
        });
    }
    catch (error) {
        console.error('Multiple questions answering error:', error);
        res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message === 'Database query failed' ? constants_1.ERROR_MESSAGES.SERVER_ERROR : constants_1.ERROR_MESSAGES.OPENAI_ERROR
        });
    }
};
exports.answerMultipleQuestions = answerMultipleQuestions;
const optimizeApplication = async (req, res) => {
    try {
        const { jobId } = req.body;
        const job = await fetchJobDetails(jobId);
        if (!job) {
            res.status(constants_1.HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: constants_1.ERROR_MESSAGES.JOB_NOT_FOUND
            });
            return;
        }
        const optimization = await aiService.optimizeApplication(job, req.user);
        res.status(constants_1.HTTP_STATUS.OK).json({
            success: true,
            jobTitle: job.title,
            company: job.company,
            optimization
        });
    }
    catch (error) {
        console.error('Application optimization error:', error);
        res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message === 'Database query failed' ? constants_1.ERROR_MESSAGES.SERVER_ERROR : constants_1.ERROR_MESSAGES.OPENAI_ERROR
        });
    }
};
exports.optimizeApplication = optimizeApplication;
const getAISuggestions = async (req, res) => {
    try {
        const skills = req.user.skills.toLowerCase();
        const suggestions = [];
        if (skills.includes('python') || skills.includes('javascript')) {
            suggestions.push('Highlight your programming projects and contributions', 'Mention specific frameworks and libraries you\'ve used', 'Include links to your GitHub or portfolio');
        }
        if (skills.includes('react') || skills.includes('frontend')) {
            suggestions.push('Showcase your UI/UX design experience', 'Mention responsive design capabilities', 'Include examples of user-friendly interfaces you\'ve built');
        }
        if (skills.includes('backend') || skills.includes('api')) {
            suggestions.push('Emphasize your database design experience', 'Highlight API development and integration skills', 'Mention scalability and performance optimization experience');
        }
        const generalSuggestions = [
            'Tailor each application to the specific job requirements',
            'Use keywords from the job description in your application',
            'Quantify your achievements with specific numbers and results',
            'Research the company culture and values before applying',
            'Follow up professionally after submitting applications'
        ];
        res.status(constants_1.HTTP_STATUS.OK).json({
            success: true,
            skillBasedSuggestions: suggestions.slice(0, 3),
            generalSuggestions
        });
    }
    catch (error) {
        console.error('AI suggestions error:', error);
        res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: constants_1.ERROR_MESSAGES.SERVER_ERROR
        });
    }
};
exports.getAISuggestions = getAISuggestions;
//# sourceMappingURL=aiController.js.map