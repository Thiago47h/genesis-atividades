import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eyogyhnjvhxwhliitrsk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5b2d5aG5qdmh4d2hsaWl0cnNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMTE4NDYsImV4cCI6MjEwMTU4Nzg0Nn0.E7s5QA013E4PkPEhl5ZU0gDVAqM0OxpFH3liz0RfD9o';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
});
