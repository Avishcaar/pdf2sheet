import User from '../models/User.js';

export const getUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId).select('-password +googleAccessToken');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const hasGoogleConnection = !!user.googleAccessToken || !!(user.settings && user.settings.hasGoogleConnection);

        res.status(200).json({
            success: true,
            data: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                hasGoogleConnection,
                googleEmail: user.googleEmail || null,
                spreadsheetId: user.googleSheetId || null
            }
        });
    } catch (error) {
        next(error);
    }
};

export const updateUserSettings = async (req, res, next) => {
    try {
        let { spreadsheetId } = req.body;

        const urlMatch = spreadsheetId.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (urlMatch && urlMatch[1]) {
            spreadsheetId = urlMatch[1];
        }

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            {
                googleSheetId: spreadsheetId
            },
            {
                new: true,
                runValidators: true
            }
        ).select('-password');

        res.status(200).json({
            success: true,
            data: {
                spreadsheetId: user.googleSheetId
            }
        });
    } catch (error) {
        next(error);
    }
};
