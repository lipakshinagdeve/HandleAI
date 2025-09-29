"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: parseInt(process.env['PORT'] || '5000'),
    nodeEnv: process.env['NODE_ENV'] || 'development',
    jwtExpire: process.env.JWT_EXPIRE || '7d',
    jwtCookieExpire: parseInt(process.env.JWT_COOKIE_EXPIRE || '7'),
    supabaseUrl: process.env['SUPABASE_URL'] || '',
    supabaseAnonKey: process.env['SUPABASE_ANON_KEY'] || '',
    supabaseServiceRoleKey: process.env['SUPABASE_SERVICE_ROLE_KEY'] || '',
    jwtSecret: process.env['JWT_SECRET'] || '',
    openaiApiKey: process.env['OPENAI_API_KEY'] || '',
    resendApiKey: process.env['RESEND_API_KEY'] || '',
    emailHost: process.env['EMAIL_HOST'] || 'smtp.gmail.com',
    emailPort: parseInt(process.env['EMAIL_PORT'] || '587'),
    emailUser: process.env['EMAIL_USER'] || '',
    emailPass: process.env['EMAIL_PASS'] || '',
    clientUrl: process.env['CLIENT_URL'] || 'http://localhost:3000',
    rateLimitWindow: parseInt(process.env['RATE_LIMIT_WINDOW'] || '15'),
    rateLimitMaxRequests: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'),
    isDevelopment: process.env['NODE_ENV'] === 'development',
    isProduction: process.env['NODE_ENV'] === 'production'
};
//# sourceMappingURL=environment.js.map