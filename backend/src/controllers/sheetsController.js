import { getOAuth2Client } from '../config/googleSheets.js';
import User from '../models/User.js';
import { google } from 'googleapis';

export const getAuthUrl = (req, res) => {
    const oauth2Client = getOAuth2Client();

    const scopes = [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
    ];

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent'
    });

    res.json({ url });
};

export const oauthCallback = async (req, res) => {
    const { code, userId } = req.body;

    try {
        const oauth2Client = getOAuth2Client();
        const { tokens } = await oauth2Client.getToken(code);

        await User.findByIdAndUpdate(userId, {
            googleAccessToken: tokens.access_token,
            googleRefreshToken: tokens.refresh_token,
            'settings.hasGoogleConnection': true
        });

        res.json({ success: true, message: 'Google Sheets connected successfully' });
    } catch (error) {
        console.error('OAuth Callback Error:', error);
        res.status(500).json({ success: false, error: 'Failed to connect Google Sheets' });
    }
};

export const updateSpreadsheetId = async (req, res) => {
    try {
        let { spreadsheetId } = req.body;
        const user = await User.findById(req.user.userId);

        if (!user) return res.status(404).json({ error: 'User not found' });

        if (spreadsheetId) {
            const urlMatch = spreadsheetId.match(/\/d\/([a-zA-Z0-9-_]+)/);
            if (urlMatch && urlMatch[1]) {
                spreadsheetId = urlMatch[1];
            }
        }

        user.googleSheetId = spreadsheetId;
        await user.save();

        res.json({ success: true, message: 'Spreadsheet ID updated', spreadsheetId: user.googleSheetId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update spreadsheet ID' });
    }
};

export const createAutoSpreadsheet = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('+googleAccessToken +googleRefreshToken');
        if (!user || (!user.googleAccessToken && !user.googleRefreshToken)) {
            return res.status(400).json({ success: false, error: 'Google account not connected. Please connect Google Sheets first.' });
        }

        const auth = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );

        auth.setCredentials({
            access_token: user.googleAccessToken,
            refresh_token: user.googleRefreshToken
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const newSheet = await sheets.spreadsheets.create({
            resource: {
                properties: {
                    title: `PDF2Sheet Invoices (${new Date().toISOString().slice(0, 10)})`
                }
            }
        });

        const spreadsheetId = newSheet.data.spreadsheetId;
        const spreadsheetUrl = newSheet.data.spreadsheetUrl;

        // Auto-inject headers
        const { ensureHeadersExist } = await import('../services/sheetsService.js');
        await ensureHeadersExist(sheets, spreadsheetId);

        user.googleSheetId = spreadsheetId;
        await user.save();

        res.json({
            success: true,
            message: 'Spreadsheet created and linked successfully!',
            spreadsheetId,
            spreadsheetUrl
        });
    } catch (err) {
        console.error('Create auto spreadsheet error:', err);
        res.status(500).json({ success: false, error: err.message || 'Failed to create spreadsheet' });
    }
};

export const disconnectSheets = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        user.googleAccessToken = null;
        user.googleRefreshToken = null;
        user.googleSheetId = null;
        user.settings.hasGoogleConnection = false;
        await user.save();
        res.json({ success: true, message: 'Disconnected' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to disconnect' });
    }
};
