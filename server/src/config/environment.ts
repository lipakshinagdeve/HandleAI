import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env['PORT'] || '5000'),
  nodeEnv: process.env['NODE_ENV'] || 'development',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  jwtCookieExpire: parseInt(process.env.JWT_COOKIE_EXPIRE || '7'),
  
  // Supabase
  supabaseUrl: process.env['SUPABASE_URL'] || '',
  supabaseAnonKey: process.env['SUPABASE_ANON_KEY'] || '',
  supabaseServiceRoleKey: process.env['SUPABASE_SERVICE_ROLE_KEY'] || '',
  
  // JWT (from Supabase)
  jwtSecret: process.env['JWT_SECRET'] || '',
  
  // OpenAI
  openaiApiKey: process.env['OPENAI_API_KEY'] || '',
  
  // Email
  emailHost: process.env['EMAIL_HOST'] || 'smtp.gmail.com',
  emailPort: parseInt(process.env['EMAIL_PORT'] || '587'),
  emailUser: process.env['EMAIL_USER'] || '',
  emailPass: process.env['EMAIL_PASS'] || '',
  
  // CORS
  clientUrl: process.env['CLIENT_URL'] || 'http://localhost:3000',
  
  // Rate Limiting
  rateLimitWindow: parseInt(process.env['RATE_LIMIT_WINDOW'] || '15'),
  rateLimitMaxRequests: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'),
  
  // Development
  isDevelopment: process.env['NODE_ENV'] === 'development',
  isProduction: process.env['NODE_ENV'] === 'production'
};