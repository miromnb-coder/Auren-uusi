import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://rssoaopfutmphxekagha.supabase.co';
export const SUPABASE_ANON_KEY = [
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzc29hb3BmdXRtcGh4ZWthZ2hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMDUyMDQsImV4cCI6MjA5NDY4MTIwNH0',
  '_uzi7q5nCff4vE0uo20RmVBrSH4aKvZK_a2IW8exfVg',
].join('.');

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
