"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startJobAutomation = exports.applyToJob = exports.getJobDetails = exports.searchJobs = exports.scrapeJobsFromPortal = void 0;
const supabase_1 = require("../config/supabase");
const jobScrapingService_1 = require("../services/jobScrapingService");
const aiService_1 = require("../services/aiService");
const constants_1 = require("../utils/constants");
const helpers_1 = require("../utils/helpers");
const uuid_1 = require("uuid");
const jobScrapingService = new jobScrapingService_1.JobScrapingService();
const aiService = new aiService_1.AIService();
const scrapeJobsFromPortal = async (req, res) => {
    try {
        const { portalUrl } = req.body;
        const userSkills = req.user.skills.split(',').map((skill) => skill.trim());
        const scrapedJobs = await jobScrapingService.scrapeJobsFromUrl(portalUrl, userSkills);
        if (scrapedJobs.length === 0) {
            res.status(constants_1.HTTP_STATUS.OK).json({
                success: true,
                message: 'No jobs found at the provided URL',
                jobsFound: 0,
                jobsSaved: 0
            });
            return;
        }
        let savedCount = 0;
        for (const jobData of scrapedJobs) {
            try {
                const { data: existingJob } = await supabase_1.supabaseAdmin
                    .from('jobs')
                    .select('id')
                    .eq('title', jobData.title)
                    .eq('company', jobData.company)
                    .eq('applicationUrl', jobData.applicationUrl)
                    .single();
                if (!existingJob) {
                    const { error } = await supabase_1.supabaseAdmin
                        .from('jobs')
                        .insert({
                        ...jobData,
                        id: (0, uuid_1.v4)(),
                        postedDate: new Date().toISOString(),
                        scrapedAt: new Date().toISOString(),
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    });
                    if (!error)
                        savedCount++;
                }
            }
            catch (error) {
                console.error('Error saving job:', error);
                continue;
            }
        }
        res.status(constants_1.HTTP_STATUS.OK).json({
            success: true,
            message: `Successfully scraped ${scrapedJobs.length} jobs`,
            jobsFound: scrapedJobs.length,
            jobsSaved: savedCount,
            portalUrl
        });
    }
    catch (error) {
        console.error('Job scraping error:', error);
        res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: `Error scraping jobs: ${error.message}`
        });
    }
};
exports.scrapeJobsFromPortal = scrapeJobsFromPortal;
const searchJobs = async (req, res) => {
    try {
        const { q, location, jobType, experienceLevel, remote, page = 1, limit = 20 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        let query = supabase_1.supabaseAdmin
            .from('jobs')
            .select('*', { count: 'exact' })
            .eq('status', 'active');
        if (q) {
            query = query.or(`title.ilike.%${q}%,company.ilike.%${q}%,description.ilike.%${q}%`);
        }
        if (location) {
            query = query.ilike('location', `%${location}%`);
        }
        if (jobType) {
            query = query.eq('jobType', jobType);
        }
        if (experienceLevel) {
            query = query.eq('experienceLevel', experienceLevel);
        }
        if (remote !== undefined) {
            query = query.eq('remote', remote === 'true');
        }
        const { data: jobs, count, error } = await query
            .order('postedDate', { ascending: false })
            .range(offset, offset + Number(limit) - 1);
        if (error) {
            res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: error.message
            });
            return;
        }
        const jobsWithApplicationStatus = await Promise.all((jobs || []).map(async (job) => {
            const { data: existingApplication } = await supabase_1.supabaseAdmin
                .from('applications')
                .select('id')
                .eq('userId', req.user.id)
                .eq('jobId', job.id)
                .single();
            return {
                ...job,
                description: job.description.length > 200 ?
                    job.description.substring(0, 200) + '...' : job.description,
                alreadyApplied: !!existingApplication
            };
        }));
        const pagination = (0, helpers_1.calculatePagination)(Number(page), Number(limit), count || 0);
        res.status(constants_1.HTTP_STATUS.OK).json({
            success: true,
            jobs: jobsWithApplicationStatus,
            pagination
        });
    }
    catch (error) {
        console.error('Job search error:', error);
        res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: constants_1.ERROR_MESSAGES.SERVER_ERROR
        });
    }
};
exports.searchJobs = searchJobs;
const getJobDetails = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { data: job, error } = await supabase_1.supabaseAdmin
            .from('jobs')
            .select('*')
            .eq('id', jobId)
            .single();
        if (error || !job) {
            res.status(constants_1.HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: constants_1.ERROR_MESSAGES.JOB_NOT_FOUND
            });
            return;
        }
        const { data: application } = await supabase_1.supabaseAdmin
            .from('applications')
            .select('*')
            .eq('userId', req.user.id)
            .eq('jobId', jobId)
            .single();
        res.status(constants_1.HTTP_STATUS.OK).json({
            success: true,
            job: {
                ...job,
                applicationStatus: {
                    applied: !!application,
                    applicationDate: application?.appliedDate,
                    status: application?.status
                }
            }
        });
    }
    catch (error) {
        console.error('Get job details error:', error);
        res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: constants_1.ERROR_MESSAGES.SERVER_ERROR
        });
    }
};
exports.getJobDetails = getJobDetails;
const applyToJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { customCoverLetter, customQuestions } = req.body;
        const { data: job, error: jobError } = await supabase_1.supabaseAdmin
            .from('jobs')
            .select('*')
            .eq('id', jobId)
            .single();
        if (jobError || !job) {
            res.status(constants_1.HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: constants_1.ERROR_MESSAGES.JOB_NOT_FOUND
            });
            return;
        }
        const { data: existingApplication } = await supabase_1.supabaseAdmin
            .from('applications')
            .select('id')
            .eq('userId', req.user.id)
            .eq('jobId', jobId)
            .single();
        if (existingApplication) {
            res.status(constants_1.HTTP_STATUS.CONFLICT).json({
                success: false,
                message: constants_1.ERROR_MESSAGES.APPLICATION_EXISTS
            });
            return;
        }
        let coverLetter = customCoverLetter;
        if (!coverLetter) {
            coverLetter = await aiService.generateCoverLetter(job, req.user);
        }
        let customAnswers = [];
        if (customQuestions && customQuestions.length > 0) {
            customAnswers = await aiService.generateCustomAnswers(customQuestions, job, req.user);
        }
        const { data: application, error: appError } = await supabase_1.supabaseAdmin
            .from('applications')
            .insert({
            id: (0, uuid_1.v4)(),
            userId: req.user.id,
            jobId,
            coverLetter,
            customAnswers,
            applicationMethod: 'automated',
            status: 'applied',
            appliedDate: new Date().toISOString(),
            responseReceived: false,
            automationLog: [{
                    timestamp: new Date().toISOString(),
                    action: 'application_submitted',
                    status: 'success',
                    details: `Applied to ${job.title} at ${job.company}`
                }],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        })
            .select()
            .single();
        if (appError) {
            res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Failed to create application'
            });
            return;
        }
        const newStats = {
            ...req.user.applicationStats,
            totalApplications: req.user.applicationStats.totalApplications + 1,
            lastApplicationDate: new Date().toISOString()
        };
        await supabase_1.supabaseAdmin
            .from('user_profiles')
            .update({ applicationStats: newStats })
            .eq('id', req.user.id);
        res.status(constants_1.HTTP_STATUS.CREATED).json({
            success: true,
            message: constants_1.SUCCESS_MESSAGES.APPLICATION_SUBMITTED,
            application: {
                id: application.id,
                job: {
                    id: job.id,
                    title: job.title,
                    company: job.company
                },
                coverLetterGenerated: !customCoverLetter,
                customAnswersCount: customAnswers.length
            }
        });
    }
    catch (error) {
        console.error('Apply to job error:', error);
        res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: `Error submitting application: ${error.message}`
        });
    }
};
exports.applyToJob = applyToJob;
const startJobAutomation = async (req, res) => {
    try {
        const { portalUrl, maxApplications = 10, autoApply = false } = req.body;
        if (!portalUrl) {
            res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Portal URL is required'
            });
            return;
        }
        if (autoApply) {
            setImmediate(() => {
                automatedJobApplicationTask(portalUrl, req.user.id, maxApplications);
            });
            res.status(constants_1.HTTP_STATUS.OK).json({
                success: true,
                message: 'Automated job application process started',
                portalUrl,
                maxApplications,
                status: 'processing'
            });
        }
        else {
            const userSkills = req.user.skills.split(',').map(skill => skill.trim());
            const scrapedJobs = await jobScrapingService.scrapeJobsFromUrl(portalUrl, userSkills);
            res.status(constants_1.HTTP_STATUS.OK).json({
                success: true,
                message: 'Job scraping completed',
                jobsFound: scrapedJobs.length,
                portalUrl,
                status: 'completed'
            });
        }
    }
    catch (error) {
        console.error('Job automation error:', error);
        res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: `Error in automation: ${error.message}`
        });
    }
};
exports.startJobAutomation = startJobAutomation;
const automatedJobApplicationTask = async (portalUrl, userId, maxApplications) => {
    try {
        const { data: user } = await supabase_1.supabaseAdmin
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (!user)
            return;
        const userSkills = user.skills.split(',').map((skill) => skill.trim());
        const scrapedJobs = await jobScrapingService.scrapeJobsFromUrl(portalUrl, userSkills);
        let applicationsSubmitted = 0;
        for (const jobData of scrapedJobs) {
            if (applicationsSubmitted >= maxApplications)
                break;
            try {
                let { data: job } = await supabase_1.supabaseAdmin
                    .from('jobs')
                    .select('*')
                    .eq('title', jobData.title)
                    .eq('company', jobData.company)
                    .eq('applicationUrl', jobData.applicationUrl)
                    .single();
                if (!job) {
                    const { data: newJob } = await supabase_1.supabaseAdmin
                        .from('jobs')
                        .insert({
                        ...jobData,
                        id: (0, uuid_1.v4)(),
                        postedDate: new Date().toISOString(),
                        scrapedAt: new Date().toISOString(),
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    })
                        .select()
                        .single();
                    job = newJob;
                }
                if (!job)
                    continue;
                const { data: existingApplication } = await supabase_1.supabaseAdmin
                    .from('applications')
                    .select('id')
                    .eq('userId', userId)
                    .eq('jobId', job.id)
                    .single();
                if (existingApplication)
                    continue;
                const coverLetter = await aiService.generateCoverLetter(job, user);
                await supabase_1.supabaseAdmin
                    .from('applications')
                    .insert({
                    id: (0, uuid_1.v4)(),
                    userId,
                    jobId: job.id,
                    coverLetter,
                    customAnswers: [],
                    applicationMethod: 'automated',
                    status: 'applied',
                    appliedDate: new Date().toISOString(),
                    responseReceived: false,
                    automationLog: [{
                            timestamp: new Date().toISOString(),
                            action: 'automated_application',
                            status: 'success',
                            details: `Automatically applied to ${job.title} at ${job.company}`
                        }],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
                applicationsSubmitted++;
                const newStats = {
                    ...user.applicationStats,
                    totalApplications: user.applicationStats.totalApplications + 1,
                    lastApplicationDate: new Date().toISOString()
                };
                await supabase_1.supabaseAdmin
                    .from('user_profiles')
                    .update({ applicationStats: newStats })
                    .eq('id', userId);
                await (0, helpers_1.sleep)(2000);
            }
            catch (error) {
                console.error('Error in automated application:', error);
                continue;
            }
        }
        console.log(`Automated job application completed: ${applicationsSubmitted} applications submitted`);
    }
    catch (error) {
        console.error('Error in automation task:', error);
    }
    finally {
        await jobScrapingService.closeBrowser();
    }
};
//# sourceMappingURL=jobController.js.map