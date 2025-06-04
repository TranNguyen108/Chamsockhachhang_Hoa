import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://efadnjcjhuscofxgeuju.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmYWRuamNqaHVzY29meGdldWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNjg3NjYsImV4cCI6MjA2NDY0NDc2Nn0.Brc2WrvWCv7Dz5Rdous0Bw_rjhOaPBs9LisUZFiCw0Q';
export const supabase = createClient(supabaseUrl, supabaseKey);
