import { Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { JobScrapingService } from '../services/jobScrapingService';
import { AIService } from '../services/aiService';
import { AuthRequest, IJob, IApplication } from '../utils/types';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/constants';
import { calculatePagination, sleep } from '../utils/helpers';
import { v4 as uuidv4 } from 'uuid';

const jobScrapingService = new JobScrapingService();
const aiService = new AIService();

export const scrapeJobsFromPortal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { portalUrl } = req.body;
    
    // Get user skills for better filtering
    const userSkills = req.user!.skills.split(',').map((skill: string) => skill.trim());
    
    // Scrape jobs
    const scrapedJobs = await jobScrapingService.scrapeJobsFromUrl(portalUrl, userSkills);
    
    if (scrapedJobs.length === 0) {
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'No jobs found at the provided URL',
        jobsFound: 0,
        jobsSaved: 0
      });
      return;
    }

    // Save jobs to database
    let savedCount = 0;
    for (const jobData of scrapedJobs) {
      try {
        // Check if job already exists
        const { data: existingJob } = await supabaseAdmin
          .from('jobs')
          .select('id')
          .eq('title', jobData.title)
          .eq('company', jobData.company)
          .eq('applicationUrl', jobData.applicationUrl)
          .single();
        
        if (!existingJob) {
          const { error } = await supabaseAdmin
            .from('jobs')
            .insert({
              ...jobData,
              id: uuidv4(),
              postedDate: new Date().toISOString(),
              scrapedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });

          if (!error) savedCount++;
        }
      } catch (error) {
        console.error('Error saving job:', error);
        continue;
      }
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Successfully scraped ${scrapedJobs.length} jobs`,
      jobsFound: scrapedJobs.length,
      jobsSaved: savedCount,
      portalUrl
    });

  } catch (error: any) {
    console.error('Job scraping error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Error scraping jobs: ${error.message}`
    });
  }
};

export const searchJobs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      q,
      location,
      jobType,
      experienceLevel,
      remote,
      page = 1,
      limit = 20
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    // Build query
    let query = supabaseAdmin
      .from('jobs')
      .select('*', { count: 'exact' })
      .eq('status', 'active');

    // Apply filters
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
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: error.message
      });
      return;
    }

    // Check if user has already applied to each job
    const jobsWithApplicationStatus = await Promise.all(
      (jobs || []).map(async (job) => {
        const { data: existingApplication } = await supabaseAdmin
          .from('applications')
          .select('id')
          .eq('userId', req.user!.id)
          .eq('jobId', job.id)
          .single();

        return {
          ...job,
          description: job.description.length > 200 ? 
            job.description.substring(0, 200) + '...' : job.description,
          alreadyApplied: !!existingApplication
        };
      })
    );

    const pagination = calculatePagination(Number(page), Number(limit), count || 0);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      jobs: jobsWithApplicationStatus,
      pagination
    });

  } catch (error: any) {
    console.error('Job search error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

export const getJobDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;

    const { data: job, error } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error || !job) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.JOB_NOT_FOUND
      });
      return;
    }

    // Check if user has applied
    const { data: application } = await supabaseAdmin
      .from('applications')
      .select('*')
      .eq('userId', req.user!.id)
      .eq('jobId', jobId)
      .single();

    res.status(HTTP_STATUS.OK).json({
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

  } catch (error: any) {
    console.error('Get job details error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

export const applyToJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    const { customCoverLetter, customQuestions } = req.body;

    // Get job details
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.JOB_NOT_FOUND
      });
      return;
    }

    // Check if already applied
    const { data: existingApplication } = await supabaseAdmin
      .from('applications')
      .select('id')
      .eq('userId', req.user!.id)
      .eq('jobId', jobId)
      .single();

    if (existingApplication) {
      res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: ERROR_MESSAGES.APPLICATION_EXISTS
      });
      return;
    }

    // Generate cover letter if not provided
    let coverLetter = customCoverLetter;
    if (!coverLetter) {
      coverLetter = await aiService.generateCoverLetter(job, req.user!);
    }

    // Handle custom questions
    let customAnswers: Array<{question: string, answer: string}> = [];
    if (customQuestions && customQuestions.length > 0) {
      customAnswers = await aiService.generateCustomAnswers(customQuestions, job, req.user!);
    }

    // Create application
    const { data: application, error: appError } = await supabaseAdmin
      .from('applications')
      .insert({
        id: uuidv4(),
        userId: req.user!.id,
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
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to create application'
      });
      return;
    }

    // Update user stats
    const newStats = {
      ...req.user!.applicationStats,
      totalApplications: req.user!.applicationStats.totalApplications + 1,
      lastApplicationDate: new Date().toISOString()
    };

    await supabaseAdmin
      .from('user_profiles')
      .update({ applicationStats: newStats })
      .eq('id', req.user!.id);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: SUCCESS_MESSAGES.APPLICATION_SUBMITTED,
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

  } catch (error: any) {
    console.error('Apply to job error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Error submitting application: ${error.message}`
    });
  }
};

export const startJobAutomation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { portalUrl, maxApplications = 10, autoApply = false } = req.body;

    if (!portalUrl) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Portal URL is required'
      });
      return;
    }

    if (autoApply) {
      // Start background automation process
      setImmediate(() => {
        automatedJobApplicationTask(portalUrl, req.user!.id, maxApplications);
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Automated job application process started',
        portalUrl,
        maxApplications,
        status: 'processing'
      });
    } else {
      // Just scrape jobs without applying
      const userSkills = req.user!.skills.split(',').map(skill => skill.trim());
      const scrapedJobs = await jobScrapingService.scrapeJobsFromUrl(portalUrl, userSkills);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Job scraping completed',
        jobsFound: scrapedJobs.length,
        portalUrl,
        status: 'completed'
      });
    }

  } catch (error: any) {
    console.error('Job automation error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Error in automation: ${error.message}`
    });
  }
};

// Background task for automated job applications
const automatedJobApplicationTask = async (
  portalUrl: string,
  userId: string,
  maxApplications: number
): Promise<void> => {
  try {
    // Get user data
    const { data: user } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!user) return;

    // Scrape jobs
    const userSkills = user.skills.split(',').map((skill: string) => skill.trim());
    const scrapedJobs = await jobScrapingService.scrapeJobsFromUrl(portalUrl, userSkills);

    let applicationsSubmitted = 0;

    for (const jobData of scrapedJobs) {
      if (applicationsSubmitted >= maxApplications) break;

      try {
        // Create job if it doesn't exist
        let { data: job } = await supabaseAdmin
          .from('jobs')
          .select('*')
          .eq('title', jobData.title)
          .eq('company', jobData.company)
          .eq('applicationUrl', jobData.applicationUrl)
          .single();

        if (!job) {
          const { data: newJob } = await supabaseAdmin
            .from('jobs')
            .insert({
              ...jobData,
              id: uuidv4(),
              postedDate: new Date().toISOString(),
              scrapedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            })
            .select()
            .single();
          
          job = newJob;
        }

        if (!job) continue;

        // Check if already applied
        const { data: existingApplication } = await supabaseAdmin
          .from('applications')
          .select('id')
          .eq('userId', userId)
          .eq('jobId', job.id)
          .single();

        if (existingApplication) continue;

        // Generate cover letter
        const coverLetter = await aiService.generateCoverLetter(job, user);

        // Create application
        await supabaseAdmin
          .from('applications')
          .insert({
            id: uuidv4(),
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

        // Update user stats
        const newStats = {
          ...user.applicationStats,
          totalApplications: user.applicationStats.totalApplications + 1,
          lastApplicationDate: new Date().toISOString()
        };

        await supabaseAdmin
          .from('user_profiles')
          .update({ applicationStats: newStats })
          .eq('id', userId);

        // Add delay between applications
        await sleep(2000);

      } catch (error) {
        console.error('Error in automated application:', error);
        continue;
      }
    }

    console.log(`Automated job application completed: ${applicationsSubmitted} applications submitted`);

  } catch (error) {
    console.error('Error in automation task:', error);
  } finally {
    await jobScrapingService.closeBrowser();
  }
};