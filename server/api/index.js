const express = require('express');
const cors = require('cors');

const app = express();

// Simple CORS configuration
app.use(cors({
  origin: [
    'https://handlejobs.com',
    'https://www.handlejobs.com',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// Simple test endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'success', 
    message: 'Handle Backend API is running!',
    timestamp: new Date().toISOString()
  });
});

// Simple registration endpoint for testing
app.post('/auth/register', (req, res) => {
  console.log('Registration attempt:', req.body);
  res.json({ 
    success: true, 
    message: 'Registration endpoint working!',
    requiresEmailConfirmation: true
  });
});

// Export for Vercel
module.exports = app;