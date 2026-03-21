import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// The credentials provided for the Bible Guide AI portfolio project
const supabaseUrl = 'https://univyfkzocecqstdgtoy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuaXZ5Zmt6b2NlY3FzdGRndG95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTkyMDYsImV4cCI6MjA4OTY3NTIwNn0.q8cxRbM4Jk4Twb_OOUUMC_WAlIIegEi8UvfjAzsE8gw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
