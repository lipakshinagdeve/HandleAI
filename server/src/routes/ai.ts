import express from 'express';
import {
  generateCoverLetter,
  answerJobQuestion,
  answerMultipleQuestions,
  optimizeApplication,
  getAISuggestions
} from '@controllers/aiController';
import { protect } from '@middleware/auth';

const router = express.Router();

// All routes are protected
router.use(protect);

// @desc    Generate AI-powered cover letter for a job
// @route   POST /api/ai/cover-letter
// @access  Private
router.post('/cover-letter', generateCoverLetter);

// @desc    Generate AI-powered answer to a job application question
// @route   POST /api/ai/answer-question
// @access  Private
router.post('/answer-question', answerJobQuestion);

// @desc    Generate AI-powered answers to multiple job application questions
// @route   POST /api/ai/answer-multiple-questions
// @access  Private
router.post('/answer-multiple-questions', answerMultipleQuestions);

// @desc    Get AI-powered suggestions for optimizing job application
// @route   POST /api/ai/optimize-application
// @access  Private
router.post('/optimize-application', optimizeApplication);

// @desc    Get general AI suggestions for job applications
// @route   GET /api/ai/suggestions
// @access  Private
router.get('/suggestions', getAISuggestions);

export default router;