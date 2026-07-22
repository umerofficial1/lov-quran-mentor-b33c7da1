import { supabase } from "@/integrations/supabase/client";

/**
 * fetch() wrapper that attaches the Supabase bearer token to Authorization.
 * Used for calling protected /api/* route handlers from the client.
 */
export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers = new Headers(init?.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
