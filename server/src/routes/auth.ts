import express from 'express';
import { 
  register, 
  login, 
  logout, 
  getMe, 
  updatePassword, 
  verifyToken 
} from '@controllers/authController';
import { protect } from '@middleware/auth';
import { validateRegister, validateLogin } from '@middleware/validation';

const router = express.Router();

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', validateRegister, register);

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', validateLogin, login);

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', logout);

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, getMe);

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
router.put('/updatepassword', protect, updatePassword);

// @desc    Verify token (check if user is still logged in)
// @route   POST /api/auth/verify
// @access  Private
router.post('/verify', protect, verifyToken);
router.post('/test', (req, res) => {
  console.log('Test endpoint hit:', req.body);
  res.json({ success: true, message: 'Test endpoint working', body: req.body });
});


export default router;