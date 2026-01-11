
import { supabase } from "./supabase";

export async function secureFetch(url: string, options: RequestInit = {}) {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
        throw new Error("Unauthorized");
    }

    const headers = {
        ...options.headers,
        "Authorization": `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
    };

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        // Handle token expiration or unauthorized access globally
        // e.g. redirect to login or refresh token logic (handled by supabase client usually)
    }

    return response;
}
