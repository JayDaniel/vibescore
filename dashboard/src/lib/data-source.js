/**
 * 数据源切换适配层
 * 根据环境变量 VITE_DATA_SOURCE 切换 InsForge 或 Supabase
 * 
 * 使用方式：
 * - 默认 (insforge): 不设置或设置 VITE_DATA_SOURCE=insforge
 * - Supabase: 设置 VITE_DATA_SOURCE=supabase
 * 
 * 当使用 Supabase 时，还需要配置：
 * - VITE_VIBESCORE_SUPABASE_URL
 * - VITE_VIBESCORE_SUPABASE_ANON_KEY
 */

import { getDataSource, getBaseUrl } from "./config.js";

// Lazy import to avoid loading unused modules
let insforgeApi = null;
let supabaseApi = null;

async function getInsforgeApi() {
  if (!insforgeApi) {
    insforgeApi = await import("./vibescore-api.js");
  }
  return insforgeApi;
}

async function getSupabaseApi() {
  if (!supabaseApi) {
    supabaseApi = await import("./supabase-api.js");
  }
  return supabaseApi;
}

async function getApi() {
  const source = getDataSource();
  if (source === "supabase") {
    return await getSupabaseApi();
  }
  return await getInsforgeApi();
}

/**
 * 获取当前数据源的 baseUrl
 */
export function getActiveBaseUrl() {
  return getBaseUrl();
}

/**
 * 获取当前数据源类型
 */
export function getActiveDataSource() {
  return getDataSource();
}

/**
 * 检查后端连通性
 */
export async function probeBackend(options) {
  const api = await getApi();
  const baseUrl = options.baseUrl || getBaseUrl();
  return api.probeBackend({ ...options, baseUrl });
}

/**
 * 获取使用量汇总
 */
export async function getUsageSummary(options) {
  const api = await getApi();
  const baseUrl = options.baseUrl || getBaseUrl();
  return api.getUsageSummary({ ...options, baseUrl });
}

/**
 * 获取模型使用量分布
 */
export async function getUsageModelBreakdown(options) {
  const api = await getApi();
  const baseUrl = options.baseUrl || getBaseUrl();
  return api.getUsageModelBreakdown({ ...options, baseUrl });
}

/**
 * 获取每日使用量
 */
export async function getUsageDaily(options) {
  const api = await getApi();
  const baseUrl = options.baseUrl || getBaseUrl();
  return api.getUsageDaily({ ...options, baseUrl });
}

/**
 * 获取每小时使用量
 */
export async function getUsageHourly(options) {
  const api = await getApi();
  const baseUrl = options.baseUrl || getBaseUrl();
  return api.getUsageHourly({ ...options, baseUrl });
}

/**
 * 获取每月使用量
 */
export async function getUsageMonthly(options) {
  const api = await getApi();
  const baseUrl = options.baseUrl || getBaseUrl();
  return api.getUsageMonthly({ ...options, baseUrl });
}

/**
 * 获取热力图数据
 */
export async function getUsageHeatmap(options) {
  const api = await getApi();
  const baseUrl = options.baseUrl || getBaseUrl();
  return api.getUsageHeatmap({ ...options, baseUrl });
}

/**
 * 请求安装链接码
 */
export async function requestInstallLinkCode(options = {}) {
  const api = await getApi();
  const baseUrl = options.baseUrl || getBaseUrl();
  return api.requestInstallLinkCode({ ...options, baseUrl });
}
