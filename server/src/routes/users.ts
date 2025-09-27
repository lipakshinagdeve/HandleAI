import { Router } from 'express';
// Assuming the protect middleware is located here:
import { protect } from '../middleware/auth'; 
// Assuming deleteAccount is located here:
import { deleteAccount } from '../controllers/authController'; 

const router = Router();

// Your existing GET route
router.get('/', (_req, res) => {
  res.send('Users route');
});

// -----------------------------------------------------------------
// FIX: Defines the route for DELETE /api/users/account
// -----------------------------------------------------------------
router.delete('/account', protect, deleteAccount); 
// -----------------------------------------------------------------

export default router;
