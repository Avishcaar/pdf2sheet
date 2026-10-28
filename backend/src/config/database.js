import mongoose from 'mongoose';

// Disable query buffering so disconnected queries fail fast rather than hanging for 10 seconds
mongoose.set('bufferCommands', false);

let isConnecting = false;

const connectDatabase = async () => {
  if (isConnecting || mongoose.connection.readyState === 1) return;
  isConnecting = true;

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });

    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    console.log(`[Database] Name: ${conn.connection.name}`);
    isConnecting = false;
  } catch (error) {
    console.error('[Database] MongoDB Connection Error:', error.message);
    console.warn('[Database] Retrying MongoDB connection in 5s... Check Atlas IP whitelist: https://cloud.mongodb.com');
    isConnecting = false;
    setTimeout(connectDatabase, 5000);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
  setTimeout(connectDatabase, 5000);
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err.message || err);
});

export default connectDatabase;
