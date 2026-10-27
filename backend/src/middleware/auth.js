import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = (authHeader && authHeader.split(' ')[1]) || req.query?.token;

        // Resume / Portfolio Guest Mode:
        // If no token is provided, guest token is used, or x-guest-mode header is set,
        // seamlessly bind to the primary demo user (test@test.com) so interviewers have 100% full access.
        if (!token || token === 'guest-demo-token' || req.headers['x-guest-mode'] === 'true') {
            const demoUser = await User.findOne({ email: 'test@test.com' }) || await User.findOne();
            if (demoUser) {
                req.user = {
                    userId: demoUser._id,
                    email: demoUser.email
                };
                return next();
            }
        }

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
            // If token is expired or invalid, fallback to demo user so recruiters are never blocked
            const demoUser = await User.findOne({ email: 'test@test.com' }) || await User.findOne();
            if (demoUser) {
                req.user = {
                    userId: demoUser._id,
                    email: demoUser.email
                };
                return next();
            }
            throw jwtError;
        }

        return res.status(401).json({
            success: false,
            error: 'User not found'
        });
    } catch (error) {
        return res.status(403).json({
            success: false,
            error: error.message || 'Authentication failed'
        });
    }
};
