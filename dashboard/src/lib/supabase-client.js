import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl, getSupabaseAnonKey } from "./config.js";

let supabaseInstance = null;

/**
 * 获取 Supabase 客户端单例
 * @returns {import("@supabase/supabase-js").SupabaseClient}
 */
export function getSupabase() {
  if (supabaseInstance) return supabaseInstance;

  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();

  if (!url || !key) {
    console.error("VibeScore: Supabase URL or Anon Key is missing.");
    // 返回一个代理对象，防止调用时崩溃
    return {
      auth: {
        signInWithPassword: () => Promise.reject(new Error("Supabase not configured")),
        signUp: () => Promise.reject(new Error("Supabase not configured")),
        getUser: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      functions: {
        invoke: () => Promise.reject(new Error("Supabase not configured")),
      },
      _isPlaceholder: true,
    };
  }

  supabaseInstance = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return supabaseInstance;
}

/**
 * 创建 Supabase 客户端（用于需要自定义配置的场景）
 */
export function createSupabaseClient(options = {}) {
  const url = options.url || getSupabaseUrl();
  const key = options.key || getSupabaseAnonKey();

  if (!url || !key) {
    throw new Error("Supabase URL and Anon Key are required");
  }

  return createClient(url, key, {
    auth: {
      persistSession: options.persistSession ?? true,
      autoRefreshToken: options.autoRefreshToken ?? true,
      detectSessionInUrl: options.detectSessionInUrl ?? true,
    },
  });
}
