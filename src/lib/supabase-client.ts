import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Missing Supabase environment variables. Check .env file for NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
  );
}

// Client for browser/public usage
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Client for server-side admin operations
export const supabaseAdmin = SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : (() => {
      console.warn(
        "SUPABASE_SERVICE_KEY not set. Some admin operations will fail. Get it from Supabase dashboard.",
      );
      return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    })();
