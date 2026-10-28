import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';

const STATIC_GUEST_USER = {
    userId: '6ae0f1989e78e3eb2b71ff9c',
    email: 'guest@pdf2sheet.com',
    isGuest: true
};

export const authenticateToken = async (req, res, next) => {
    try {
        const isGuestModeHeader = req.headers['x-guest-mode'] === 'true' || req.query?.guest === 'true';
        const authHeader = req.headers['authorization'];
        const token = (authHeader && authHeader.split(' ')[1]) || req.query?.token;

        // 1. Priority: If explicit guest mode requested OR token is guest-demo-token OR no token provided:
        if (isGuestModeHeader || token === 'guest-demo-token' || !token) {
            // If MongoDB is not yet connected, bypass DB query instantly to avoid buffering timeout
            if (mongoose.connection.readyState !== 1) {
                req.user = { ...STATIC_GUEST_USER };
                return next();
            }

            try {
                let guestUser = await User.findOne({ email: 'guest@pdf2sheet.com' }).lean();
                if (!guestUser) {
                    try {
                        guestUser = await User.create({
                            name: 'Guest Reviewer',
                            email: 'guest@pdf2sheet.com',
                            password: 'guest-hashed-placeholder',
                            googleId: 'guest-demo-mode-static'
                        });
                    } catch (createErr) {
                        guestUser = await User.findOne({ email: 'guest@pdf2sheet.com' }).lean();
                    }
                }

                req.user = {
                    userId: guestUser?._id ? String(guestUser._id) : STATIC_GUEST_USER.userId,
                    email: guestUser?.email || STATIC_GUEST_USER.email,
                    isGuest: true
                };
                return next();
            } catch (dbErr) {
                // Graceful fallback to static guest user if DB query errors
                req.user = { ...STATIC_GUEST_USER };
                return next();
            }
        }

        // 2. Authenticate as specific registered user via JWT (e.g. personal account)
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            if (mongoose.connection.readyState !== 1) {
                return res.status(503).json({
                    success: false,
                    error: 'Database is currently offline. Please whitelist your IP in MongoDB Atlas.'
                });
            }

            const user = await User.findById(decoded.userId);
            if (user) {
                req.user = {
                    userId: String(user._id),
                    email: user.email,
                    isGuest: false
                };
                return next();
            }
        } catch (jwtError) {
            // If JWT expired or invalid, fallback cleanly to isolated guest user
            req.user = { ...STATIC_GUEST_USER };
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
