import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticateToken = async (req, res, next) => {
    try {
        const isGuestModeHeader = req.headers['x-guest-mode'] === 'true' || req.query?.guest === 'true';
        const authHeader = req.headers['authorization'];
        const token = (authHeader && authHeader.split(' ')[1]) || req.query?.token;

        // 1. Priority: If explicit guest mode requested OR token is guest-demo-token OR no token provided:
        if (isGuestModeHeader || token === 'guest-demo-token' || !token) {
            let guestUser = await User.findOne({ email: 'guest@pdf2sheet.com' });
            if (!guestUser) {
                try {
                    guestUser = await User.create({
                        name: 'Guest Reviewer',
                        email: 'guest@pdf2sheet.com',
                        password: 'guest-hashed-placeholder',
                        googleId: 'guest-demo-mode-static'
                    });
                } catch (createErr) {
                    guestUser = await User.findOne({ email: 'guest@pdf2sheet.com' });
                }
            }

            if (guestUser) {
                req.user = {
                    userId: guestUser._id,
                    email: guestUser.email,
                    isGuest: true
                };
                return next();
            }
        }

        // 2. Authenticate as specific registered user via JWT (e.g. test@test.com)
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId);
            if (user) {
                req.user = {
                    userId: user._id,
                    email: user.email,
                    isGuest: false
                };
                return next();
            }
        } catch (jwtError) {
            // If JWT expired or invalid, fallback cleanly to isolated guest user
            let guestUser = await User.findOne({ email: 'guest@pdf2sheet.com' });
            if (guestUser) {
                req.user = {
                    userId: guestUser._id,
                    email: guestUser.email,
                    isGuest: true
                };
                return next();
            }
            return res.status(401).json({
                success: false,
                error: 'Session expired. Please log in again.'
            });
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
