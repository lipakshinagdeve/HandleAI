import express from 'express';
import {
  scrapeJobsFromPortal,
  searchJobs,
  getJobDetails,
  applyToJob,
  startJobAutomation
} from '@controllers/jobController';
import { protect } from '@middleware/auth';
import { validateJobPortal } from '@middleware/validation';

const router = express.Router();

// All routes are protected
router.use(protect);

// @desc    Scrape jobs from a job portal URL
// @route   POST /api/jobs/scrape
// @access  Private
router.post('/scrape', validateJobPortal, scrapeJobsFromPortal);

// @desc    Search for jobs with filters
// @route   GET /api/jobs/search
// @access  Private
router.get('/search', searchJobs);

// @desc    Get detailed information about a specific job
// @route   GET /api/jobs/:jobId
// @access  Private
router.get('/:jobId', getJobDetails);

// @desc    Apply to a specific job
// @route   POST /api/jobs/apply/:jobId
// @access  Private
router.post('/apply/:jobId', applyToJob);

// @desc    Start automated job application process
// @route   POST /api/jobs/automate
// @access  Private
router.post('/automate', startJobAutomation);

export default router;