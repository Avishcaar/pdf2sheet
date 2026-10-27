import app from './src/app.js';
import connectDatabase from './src/config/database.js';
import { connectImap } from './src/services/imapService.js';

connectDatabase();
connectImap();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`\n Server is running on port ${PORT}`);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(` Health check: http://localhost:${PORT}/health`);
    console.log(` Auth API: http://localhost:${PORT}/api/auth\n`);
});

process.on('unhandledRejection', (err) => {
    console.error(' [Server Warning] Unhandled Rejection:', err?.message || err);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log(' Process terminated');
    });
});
