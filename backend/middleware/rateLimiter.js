// backend/middleware/rateLimiter.js
function createRateLimiter({ windowMs = 60 * 1000, max = 30, message = 'Too many requests, please try again later.' }) {
    const hits = new Map();

    // Clean up expired entries periodically
    const interval = setInterval(() => {
        const now = Date.now();
        for (const [key, record] of hits.entries()) {
            if (now > record.resetTime) {
                hits.delete(key);
            }
        }
    }, Math.min(windowMs, 60000));
    interval.unref();

    return function rateLimiter(req, res, next) {
        const identifier = req.user ? `user_${req.user.id}` : (req.ip || req.socket.remoteAddress || 'unknown');
        const now = Date.now();
        const record = hits.get(identifier);

        if (!record || now > record.resetTime) {
            hits.set(identifier, { count: 1, resetTime: now + windowMs });
            res.setHeader('X-RateLimit-Limit', max);
            res.setHeader('X-RateLimit-Remaining', max - 1);
            return next();
        }

        record.count++;
        const remaining = Math.max(0, max - record.count);
        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', remaining);

        if (record.count > max) {
            const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
            res.setHeader('Retry-After', retryAfterSec);
            return res.status(429).json({ error: message, retryAfter: retryAfterSec });
        }

        next();
    };
}

const authLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 mins
    max: 20, // 20 attempts per 15 min
    message: 'Too many authentication attempts. Please try again in 15 minutes.'
});

const aiLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute
    message: 'AI request limit reached. Please wait a moment before trying again.'
});

module.exports = {
    createRateLimiter,
    authLimiter,
    aiLimiter
};
