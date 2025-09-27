import { Router } from 'express';
const router = Router();

// Your routes
router.get('/', (_req, res) => {
  res.send('Users route');
});

export default router; // ← THIS is required
