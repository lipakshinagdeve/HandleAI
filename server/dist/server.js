"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const compression_1 = __importDefault(require("compression"));
const environment_1 = require("./config/environment");
const errorHandler_1 = __importDefault(require("./middleware/errorHandler"));
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const jobs_1 = __importDefault(require("./routes/jobs"));
const ai_1 = __importDefault(require("./routes/ai"));
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
const limiter = (0, express_rate_limit_1.default)({
    windowMs: environment_1.config.rateLimitWindow * 60 * 1000,
    max: environment_1.config.rateLimitMaxRequests,
    message: {
        error: 'Too many requests from this IP, please try again later.'
    }
});
app.use('/api/', limiter);
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        if (!origin)
            return callback(null, true);
        const allowedOrigins = [
            environment_1.config.clientUrl,
            'https://handlejobs.com',
            'https://www.handlejobs.com',
            'http://localhost:3000',
            'http://localhost:3001'
        ];
        console.log('CORS Origin check:', origin);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        if (process.env.NODE_ENV === 'development') {
            return callback(null, true);
        }
        const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
        return callback(new Error(msg), false);
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use((0, compression_1.default)());
app.get('/', (_req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Handle Backend API is running with Supabase!',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: 'Supabase Connected'
    });
});
app.use('/api/auth', auth_1.default);
app.use('/api/users', users_1.default);
app.use('/api/jobs', jobs_1.default);
app.use('/api/ai', ai_1.default);
app.all('*', (_req, res) => {
    res.status(404).json({
        status: 'error',
        message: `Route ${_req.originalUrl} not found`
    });
});
app.use(errorHandler_1.default);
const PORT = environment_1.config.port;
app.listen(PORT, () => {
    console.log(`🚀 Handle Backend running on port ${PORT}`);
    console.log(`📱 Environment: ${environment_1.config.nodeEnv}`);
    console.log(`🌐 CORS Origin: ${environment_1.config.clientUrl}`);
    console.log(`🗄️  Database: Supabase`);
    console.log(`📚 API Docs: http://localhost:${PORT}/`);
});
process.on('unhandledRejection', (err, _promise) => {
    console.log(`❌ Error: ${err.message}`);
    process.exit(1);
});
//# sourceMappingURL=server.js.map