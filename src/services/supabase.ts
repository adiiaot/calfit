import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

let storageAdapter: {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

if (isWeb) {
  storageAdapter = {
    getItem: async (key) => localStorage.getItem(key),
    setItem: async (key, value) => { localStorage.setItem(key, value); },
    removeItem: async (key) => { localStorage.removeItem(key); },
  };
} else {
  const SecureStore = require('expo-secure-store');
  storageAdapter = {
    getItem: (key: string) => SecureStore.getItemAsync(key),
    setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
    removeItem: (key: string) => SecureStore.deleteItemAsync(key),
  };
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Never throw at module scope: a throw here crashes the app on launch
// (e.g. a release build made without env vars). Instead export the problem
// so App.tsx can render a readable configuration screen, and fail lazily
// with a clear message if any code touches the client while unconfigured.
export const supabaseConfigError: string | null =
  (!supabaseUrl || !supabaseAnonKey)
    ? 'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Add them to your .env file for local runs, or to the EAS project ' +
      'environment variables before building.'
    : null;

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (supabaseConfigError) throw new Error(supabaseConfigError);
  if (!_client) {
    _client = createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        storage: storageAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: !isWeb,
      },
    });
  }
  return _client;
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getClient() as unknown as Record<string | symbol, unknown>;
    const value = client[prop];
    return typeof value === 'function' ? (value as Function).bind(client) : value;
  },
});  
