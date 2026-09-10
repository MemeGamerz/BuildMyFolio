const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Route imports
const authRoutes = require('./routes/auth');
const aiRoutes = require('./routes/ai');
const projectRoutes = require('./routes/projects');
const paymentRoutes = require('./routes/payments'); // <-- This must match the file above

dotenv.config();

const app = express();

// Middleware
const { authLimiter, aiLimiter } = require('./middleware/rateLimiter');

app.disable('x-powered-by');
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));
app.use(express.json({ limit: '2mb' })); 
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Route configuration
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/payments', paymentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'BuildMyFolio Backend is running optimally.' });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
    console.error(`[SERVER ERROR] ${req.method} ${req.originalUrl}:`, err.message || err);
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' ? 'An internal server error occurred.' : (err.message || 'Internal Server Error')
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running smoothly on port ${PORT}`);
});