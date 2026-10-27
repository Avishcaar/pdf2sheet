import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import vendorRoutes from './routes/vendors.js';
import processRoutes from './routes/process.js';
import emailRoutes from './routes/email.js';
import invoiceRoutes from './routes/invoices.js';
import sheetsRoutes from './routes/sheets.js';
import userRoutes from './routes/user.js';

import { errorHandler, notFound } from './middleware/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(helmet({
    contentSecurityPolicy: false, // Allows the React frontend to load assets normally
}));

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:3000',
    // Current frontend on Vercel
    'https://pdf2sheet.vercel.app',
    // FRONTEND_URL env var lets you override without redeploying
    process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        // Always permit local development origins
        if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            return callback(null, true);
        }
        if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-guest-mode', 'X-Guest-Mode', 'Accept', 'Origin', 'X-Requested-With']
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'PDF2Sheet API is running',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/process', processRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/sheets', sheetsRoutes);
app.use('/api/user', userRoutes);

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../../frontend/dist')));

    app.get(/.*/, (req, res) => {
        res.sendFile(path.resolve(__dirname, '../../frontend/dist', 'index.html'));
    });
}

// Error handling MUST be the last middleware
app.use(notFound);
app.use(errorHandler);

export default app;
