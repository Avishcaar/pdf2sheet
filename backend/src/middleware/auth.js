import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = (authHeader && authHeader.split(' ')[1]) || req.query?.token;

        // 1. If a valid JWT token is provided, authenticate as that specific user
        if (token && token !== 'guest-demo-token') {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.userId);
                if (user) {
                    req.user = {
                        userId: user._id,
                        email: user.email
                    };
                    return next();
                }
            } catch (jwtError) {
                // If it was an explicitly provided JWT that failed, only fallback to guest if explicitly requested
                if (req.headers['x-guest-mode'] !== 'true') {
                    return res.status(401).json({
                        success: false,
                        error: 'Session expired. Please log in again.'
                    });
                }
            }
        }

        // 2. Guest / Demo Mode (no token, guest-demo-token, or x-guest-mode header)
        // Bind strictly to the isolated guest user (guest@pdf2sheet.com)
        const guestUser = await User.findOne({ email: 'guest@pdf2sheet.com' });
        if (guestUser) {
            req.user = {
                userId: guestUser._id,
                email: guestUser.email
            };
            return next();
        }

        return res.status(401).json({
            success: false,
            error: 'Authentication failed'
        });
    } catch (error) {
        return res.status(403).json({
            success: false,
            error: error.message || 'Authentication failed'
        });
    }
};
