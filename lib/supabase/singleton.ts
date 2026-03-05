import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (typeof window === "undefined") {
    return createSupabaseClient();
  }
  if (!client) {
    client = createSupabaseClient();
  }
  return client;
}
