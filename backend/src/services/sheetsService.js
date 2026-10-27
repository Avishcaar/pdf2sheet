import { google } from 'googleapis';
import User from '../models/User.js';

const HEADERS = [
    'Vendor',
    'Invoice #',
    'Invoice Date',
    'Total Amount',
    'Due Date',
    'Currency',
    'Subtotal',
    'Tax Amount',
    'Forensic Math Audit',
    'AI Engine',
    'Ingested At'
];

const connectSheets = async (auth) => {
    return google.sheets({ version: 'v4', auth });
};

/**
 * Automatically inspects the target Google Sheet on first entry.
 * If the sheet is empty or has no header row, automatically writes
 * enterprise column headers, styles them with dark theme & white bold text,
 * and freezes Row 1 so it never scrolls away.
 */
export const ensureHeadersExist = async (sheets, spreadsheetId) => {
    try {
        const check = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Sheet1!A1:K1',
        });

        const hasValues = check.data.values && 
                          check.data.values.length > 0 && 
                          check.data.values[0] && 
                          check.data.values[0].length > 0;

        if (!hasValues) {
            console.log('[Sheets] Empty spreadsheet detected! Auto-injecting enterprise headers...');
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: 'Sheet1!A1:K1',
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [HEADERS],
                },
            });

            // Apply formatting: Dark Slate background (#1E293B), Bold White text, Freeze Row 1
            try {
                const meta = await sheets.spreadsheets.get({ spreadsheetId });
                const sheetId = meta.data.sheets?.[0]?.properties?.sheetId || 0;

                await sheets.spreadsheets.batchUpdate({
                    spreadsheetId,
                    resource: {
                        requests: [
                            {
                                repeatCell: {
                                    range: {
                                        sheetId,
                                        startRowIndex: 0,
                                        endRowIndex: 1,
                                        startColumnIndex: 0,
                                        endColumnIndex: HEADERS.length,
                                    },
                                    cell: {
                                        userEnteredFormat: {
                                            backgroundColor: { red: 0.12, green: 0.16, blue: 0.23 }, // #1F2937 Dark Slate
                                            textFormat: {
                                                bold: true,
                                                foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 }, // Crisp White
                                                fontSize: 11,
                                            },
                                            horizontalAlignment: 'CENTER',
                                        },
                                    },
                                    fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
                                },
                            },
                            {
                                updateSheetProperties: {
                                    properties: {
                                        sheetId,
                                        gridProperties: {
                                            frozenRowCount: 1,
                                        },
                                    },
                                    fields: 'gridProperties.frozenRowCount',
                                },
                            },
                        ],
                    },
                });
                console.log('[Sheets] Applied enterprise bold styling & frozen Row 1 headers successfully!');
            } catch (styleErr) {
                console.warn('[Sheets] Header styling note (non-fatal):', styleErr.message);
            }
        }
    } catch (err) {
        console.warn('[Sheets] Header check notice (proceeding):', err.message);
    }
};

export const appendRow = async (auth, spreadsheetId, values) => {
    try {
        const sheets = await connectSheets(auth);

        // Auto-add headers on first entry if sheet is empty
        await ensureHeadersExist(sheets, spreadsheetId);

        const request = {
            spreadsheetId,
            range: 'Sheet1!A:Z',
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [values],
            },
        };
        const response = await sheets.spreadsheets.values.append(request);
        return response.data;
    } catch (err) {
        console.error('Sheets Append Error:', err);
        throw err;
    }
};

export const appendToSheet = async (userId, rowData) => {
    try {
        const user = await User.findById(userId).select('+googleAccessToken +googleRefreshToken');
        if (!user || !user.googleSheetId) {
            throw new Error('User not found or Spreadsheet not connected');
        }

        if (!user.googleAccessToken && !user.googleRefreshToken) {
            throw new Error('Google Account not connected. Please connect Google Sheets in Settings.');
        }

        const auth = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );

        auth.setCredentials({
            access_token: user.googleAccessToken,
            refresh_token: user.googleRefreshToken,
        });

        // Persist newly refreshed access tokens
        auth.on('tokens', async (tokens) => {
            if (tokens.access_token) {
                await User.findByIdAndUpdate(userId, {
                    googleAccessToken: tokens.access_token,
                    ...(tokens.refresh_token ? { googleRefreshToken: tokens.refresh_token } : {}),
                });
            }
        });

        return await appendRow(auth, user.googleSheetId, rowData);

    } catch (error) {
        if (error.message?.includes('invalid_grant') || error.response?.data?.error === 'invalid_grant') {
            console.warn('[Sheets] Google OAuth Token expired or revoked. Resetting connection status...');
            await User.findByIdAndUpdate(userId, {
                googleAccessToken: null,
                googleRefreshToken: null,
                'settings.hasGoogleConnection': false,
            });
            throw new Error('Google OAuth token expired. Please reconnect your Google account in Settings.');
        }
        console.error('Error in appendToSheet:', error);
        throw error;
    }
};
