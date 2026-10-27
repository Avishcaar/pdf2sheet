import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Invoice from '../src/models/Invoice.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function clean() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const res = await Invoice.deleteMany({});
        console.log(`✅ Successfully cleared ${res.deletedCount} invoices from database.`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Failed to clear invoices:', err);
        process.exit(1);
    }
}

clean();
