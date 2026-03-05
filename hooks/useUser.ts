"use client";

import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    async function run() {
      let supabase;
      try {
        supabase = createClient();
      } catch (e) {
        console.error("useUser createClient:", e);
        if (mounted) setLoading(false);
        return;
      }

      async function load() {
        try {
          const { data: { user: u }, error: authErr } = await supabase.auth.getUser();
          if (authErr) {
            if (mounted) {
              setUser(null);
              setRole(null);
              setLoading(false);
            }
            return;
          }
          if (!u) {
            if (mounted) {
              setUser(null);
              setRole(null);
              setLoading(false);
            }
            return;
          }
          if (mounted) setUser(u);

          // select('*') umgeht Probleme mit reserviertem Spaltennamen "role"
          const { data: profile, error: profileErr } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", u.id)
            .maybeSingle();

          if (profileErr) {
            console.warn("Profile nicht geladen (Rolle wird nicht angezeigt):", profileErr.message);
          }

          let roleStr: string | null = null;
          if (profile) {
            const raw = (profile as { role?: unknown }).role;
            roleStr =
              raw != null && typeof raw === "string"
                ? raw.trim().toLowerCase()
                : null;
            if (roleStr !== "agency" && roleStr !== "customer") roleStr = null;
          }
          // Fallback: Rolle aus Signup-Metadaten (falls profiles.role fehlt oder Abfrage fehlschlägt)
          if (!roleStr && u.user_metadata?.role) {
            const meta = String(u.user_metadata.role).trim().toLowerCase();
            if (meta === "agency" || meta === "customer") roleStr = meta;
          }

          if (process.env.NODE_ENV === "development") {
            console.log("[useUser] Debug:", {
              userId: u.id,
              profileError: profileErr?.message ?? null,
              profile: profile
                ? { role: (profile as { role?: unknown }).role, full_name: (profile as { full_name?: unknown }).full_name }
                : null,
              resolvedRole: roleStr,
              metadataRole: u.user_metadata?.role ?? null,
            });
          }

          if (mounted) setRole(roleStr);
        } catch (e) {
          console.error("useUser load:", e);
          if (mounted) {
            setRole(null);
            // User bleibt gesetzt, wenn wir ihn schon hatten – Auth nicht zurücksetzen
          }
        } finally {
          if (mounted) setLoading(false);
        }
      }

      await load();
      const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
        load();
      });
      unsubscribe = () => subscription.unsubscribe();
    }

    run();
    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  return { user, role, loading };
}
