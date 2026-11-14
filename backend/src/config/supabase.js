import { createClient } from '@supabase/supabase-js';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

let supabaseClient = null;

if (config.supabaseUrl && (config.supabaseServiceKey || config.supabaseAnonKey)) {
  const keyToUse = config.supabaseServiceKey || config.supabaseAnonKey;
  try {
    supabaseClient = createClient(config.supabaseUrl, keyToUse, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    logger.info(`[Supabase] Client initialized for project: ${config.supabaseUrl}`);
  } catch (err) {
    logger.warn(`[Supabase] Failed to initialize Supabase client: ${err.message}`);
    supabaseClient = null;
  }
} else {
  logger.info('[Supabase] Credentials not fully configured. Supabase sync will be bypassed.');
}

/**
 * Returns the active Supabase client instance or null if unconfigured
 */
export const getSupabase = () => supabaseClient;

/**
 * Health check for Supabase connection
 */
export const checkSupabaseConnection = async () => {
  if (!supabaseClient) {
    return { connected: false, message: 'Supabase credentials not configured' };
  }
  try {
    const { error } = await supabaseClient.from('policies').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      return { connected: false, message: error.message };
    }
    return { connected: true, message: 'Supabase active and reachable' };
  } catch (err) {
    return { connected: false, message: err.message };
  }
};
