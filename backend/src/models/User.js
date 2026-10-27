import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true
    },
    googleSheetId: {
        type: String,
        default: null
    },
    googleRefreshToken: {
        type: String,
        default: null,
        select: false
    },
    googleAccessToken: {
        type: String,
        default: null,
        select: false
    },
    subscription: {
        plan: {
            type: String,
            enum: ['free', 'basic', 'pro'],
            default: 'free'
        },
        status: {
            type: String,
            enum: ['active', 'cancelled', 'expired'],
            default: 'active'
        },
        expiresAt: {
            type: Date,
            default: null
        }
    },
    settings: {
        forwardingEmail: {
            type: String,
            unique: true,
            sparse: true
        },
        notifyOnLowConfidence: {
            type: Boolean,
            default: true
        },
        autoAppendThreshold: {
            type: Number,
            default: 85,
            min: 0,
            max: 100
        },
        spreadsheetId: {
            type: String
        },
        clearedInvoicesAt: {
            type: Date,
            default: null
        },
        deletedInvoices: [{
            filename: String,
            senderEmail: String,
            deletedAt: { type: Date, default: Date.now }
        }]
    },
    googleTokens: {
        access_token: String,
        refresh_token: String,
        scope: String,
        token_type: String,
        expiry_date: Number
    },
}, {
    timestamps: true
});


userSchema.pre('save', async function () {
    if (this.isNew && !this.settings.forwardingEmail) {
        const uniqueId = crypto.randomBytes(4).toString('hex');
        this.settings.forwardingEmail = `user-${uniqueId}@pdf2sheet.com`;
    }
});


userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});


userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};


userSchema.methods.getPublicProfile = function () {
    return {
        id: this._id,
        email: this.email,
        firstName: this.firstName,
        lastName: this.lastName,
        forwardingEmail: this.settings.forwardingEmail,
        subscription: this.subscription,
        createdAt: this.createdAt
    };
};

const User = mongoose.model('User', userSchema);

export default User;
