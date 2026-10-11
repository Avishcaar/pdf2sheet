import express from 'express';
import jwt from 'jsonwebtoken';
import { google } from 'googleapis';
import User from '../models/User.js';
import { register, login, getProfile } from '../controllers/authController.js';
import { validate, registerSchema, loginSchema } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/profile', authenticateToken, getProfile);

router.get('/google', (req, res) => {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.FRONTEND_URL}/auth/google/callback`
    );

    const scopes = [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
    ];

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'select_account'
    });

    res.redirect(url);
});

router.get('/google/callback', async (req, res) => {
    const { code } = req.query;

    try {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            `${process.env.FRONTEND_URL}/auth/google/callback`
        );

        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const { data } = await oauth2.userinfo.get();

        let user = await User.findOne({ email: data.email });

        if (!user) {
            user = await User.create({
                email: data.email,
                firstName: data.given_name || 'User',
                lastName: data.family_name || '',
                password: Math.random().toString(36).slice(-12)
            });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}`);
    } catch (error) {
        console.error('Google OAuth error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }
});

export default router;
