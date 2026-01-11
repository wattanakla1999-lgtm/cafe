
import { createBrowserClient } from "@supabase/ssr";


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables");
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    global: {
        fetch: (url, options) => {
            // Disable AbortController signal for Supabase requests
            // This fixes "operation was aborted" errors on Vercel Edge Runtime
            const { signal, ...restOptions } = options || {};
            return fetch(url, restOptions);
        }
    }
});
