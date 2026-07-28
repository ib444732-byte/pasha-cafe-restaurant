import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://mowbaymnwjhjotgtacqn.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vd2JheW1ud2poam90Z3RhY3FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxODUwNjcsImV4cCI6MjEwMDc2MTA2N30.aaGafEjkCKaRya0MyGok5laLZgl9h3XveemZf3_RS0w";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);