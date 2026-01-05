// ============================================================================
// Data Source Configuration
// ============================================================================

/**
 * 获取当前数据源类型
 * @returns {"insforge" | "supabase"} 默认返回 "insforge"
 */
export function getDataSource() {
  const env = typeof import.meta !== "undefined" ? import.meta.env : undefined;
  const source = (env?.VITE_DATA_SOURCE || "").trim().toLowerCase();
  if (source === "supabase") return "supabase";
  return "insforge";
}

/**
 * 检查是否使用 Supabase 数据源
 */
export function isSupabaseDataSource() {
  return getDataSource() === "supabase";
}

/**
 * 获取当前数据源的 baseUrl（根据数据源自动选择）
 */
export function getBaseUrl() {
  if (isSupabaseDataSource()) {
    return getSupabaseUrl();
  }
  return getInsforgeBaseUrl();
}

// ============================================================================
// Supabase Configuration
// ============================================================================

export function getSupabaseUrl() {
  const env = typeof import.meta !== "undefined" ? import.meta.env : undefined;
  return (
    env?.VITE_VIBESCORE_SUPABASE_URL ||
    env?.VITE_SUPABASE_URL ||
    ""
  );
}

export function getSupabaseAnonKey() {
  const env = typeof import.meta !== "undefined" ? import.meta.env : undefined;
  return (
    env?.VITE_VIBESCORE_SUPABASE_ANON_KEY ||
    env?.VITE_SUPABASE_ANON_KEY ||
    ""
  );
}

// ============================================================================
// InsForge Configuration (Legacy/Default)
// ============================================================================

export function getInsforgeBaseUrl() {
  const env = typeof import.meta !== "undefined" ? import.meta.env : undefined;
  return (
    env?.VITE_VIBEUSAGE_INSFORGE_BASE_URL ||
    env?.VITE_VIBESCORE_INSFORGE_BASE_URL ||
    "https://5tmappuk.us-east.insforge.app"
  );
}

export function getInsforgeAnonKey() {
  const env = typeof import.meta !== "undefined" ? import.meta.env : undefined;
  return (
    env?.VITE_VIBEUSAGE_INSFORGE_ANON_KEY ||
    env?.VITE_VIBESCORE_INSFORGE_ANON_KEY ||
    env?.VITE_INSFORGE_ANON_KEY ||
    ""
  );
}
