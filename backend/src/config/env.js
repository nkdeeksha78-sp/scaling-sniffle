import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/trustguard',
  jwtSecret: process.env.JWT_SECRET || 'trustguard_default_dev_secret_key_987654321',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173,http://localhost:3000,https://trustguard-ai.vercel.app')
    .split(',')
    .map(url => url.trim().replace(/\/$/, '')),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '300', 10),
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
};
