import { supabase } from '../services/supabase'

/** Returns the current session's access token, or null if not signed in. */
export async function getAccessToken() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? null
}
