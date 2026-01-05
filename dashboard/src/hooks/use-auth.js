import { useCallback, useEffect, useState } from "react";

import {
  clearAuthStorage,
  clearSessionExpired,
  loadAuthFromStorage,
  loadSessionExpired,
  saveAuthToStorage,
  subscribeAuthStorage,
} from "../lib/auth-storage.js";
import { isSupabaseDataSource } from "../lib/config.js";

// Lazy import supabase client only when needed
let supabaseClientModule = null;
async function getSupabaseClient() {
  if (!supabaseClientModule) {
    supabaseClientModule = await import("../lib/supabase-client.js");
  }
  return supabaseClientModule.getSupabase();
}

export function useAuth() {
  const [auth, setAuth] = useState(() => loadAuthFromStorage());
  const [sessionExpired, setSessionExpired] = useState(() =>
    loadSessionExpired()
  );

  useEffect(() => {
    const unsubscribe = subscribeAuthStorage(
      ({ auth: nextAuth, sessionExpired: nextExpired }) => {
        setAuth(nextAuth);
        setSessionExpired(nextExpired);
      }
    );
    return unsubscribe;
  }, []);

  // Sync with Supabase session on mount (only when using Supabase data source)
  useEffect(() => {
    if (!isSupabaseDataSource()) return;

    let subscription = null;

    (async () => {
      try {
        const sb = await getSupabaseClient();
        if (sb._isPlaceholder) {
          console.log("[useAuth] Supabase client is placeholder, skipping sync");
          return;
        }

        // Check current session
        const { data: sessionData, error } = await sb.auth.getSession();
        console.log("[useAuth] getSession result:", { session: sessionData?.session ? "exists" : "none", error });
        
        const session = sessionData?.session;
        if (session?.access_token && session?.user) {
          console.log("[useAuth] Valid session found, syncing auth...");
          const next = {
            accessToken: session.access_token,
            userId: session.user.id || null,
            email: session.user.email || null,
            name: session.user.user_metadata?.name || session.user.email || null,
            savedAt: new Date().toISOString(),
          };
          saveAuthToStorage(next);
          setAuth(next);
          clearSessionExpired();
          setSessionExpired(false);
          console.log("[useAuth] Auth synced successfully");
        }

        // Listen for auth state changes
        const { data } = sb.auth.onAuthStateChange((event, session) => {
          if (event === "SIGNED_IN" && session?.access_token) {
            const next = {
              accessToken: session.access_token,
              userId: session.user?.id || null,
              email: session.user?.email || null,
              name: session.user?.user_metadata?.name || session.user?.email || null,
              savedAt: new Date().toISOString(),
            };
            saveAuthToStorage(next);
            setAuth(next);
            clearSessionExpired();
            setSessionExpired(false);
          } else if (event === "SIGNED_OUT") {
            clearAuthStorage();
            clearSessionExpired();
            setAuth(null);
            setSessionExpired(false);
          }
        });
        subscription = data?.subscription;
      } catch (err) {
        console.error("[useAuth] Supabase sync error:", err);
      }
    })();

    return () => {
      subscription?.unsubscribe?.();
    };
  }, []);

  // Handle OAuth callback from URL params
  useEffect(() => {
    const path = window.location.pathname.replace(/\/+$/, "");
    if (path !== "/auth/callback") return;

    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("access_token") || "";
    if (!accessToken) return;

    clearSessionExpired();
    const next = {
      accessToken,
      userId: params.get("user_id") || null,
      email: params.get("email") || null,
      name: params.get("name") || null,
      savedAt: new Date().toISOString(),
    };

    saveAuthToStorage(next);
    setAuth(next);
    setSessionExpired(false);
    window.history.replaceState({}, "", "/");
  }, []);

  const signOut = useCallback(async () => {
    // Sign out from Supabase if using Supabase data source
    if (isSupabaseDataSource()) {
      try {
        const sb = await getSupabaseClient();
        if (!sb._isPlaceholder) {
          await sb.auth.signOut();
        }
      } catch (err) {
        console.error("[useAuth] Supabase sign out error:", err);
      }
    }
    
    clearAuthStorage();
    clearSessionExpired();
    setAuth(null);
    setSessionExpired(false);
  }, []);

  const signedIn = Boolean(auth?.accessToken) && !sessionExpired;
  const effectiveAuth = signedIn ? auth : null;

  return {
    auth: effectiveAuth,
    signedIn,
    sessionExpired,
    signOut,
  };
}
