// ============================================================================
// Data Source Switching Layer (Runtime Proxy)
// ============================================================================
// 根据 VITE_DATA_SOURCE 环境变量在运行时切换 InsForge 或 Supabase 数据源
// 这样所有 import from "vibescore-api.js" 的地方无需修改即可切换数据源

import { isSupabaseDataSource, getBaseUrl } from "./config.js";
import * as SupabaseApi from "./supabase-api.js";
import * as InsforgeApiImpl from "./insforge-api-impl.js";

// 日志输出当前使用的数据源
const _dataSourceLogged = (() => {
  const source = isSupabaseDataSource() ? "Supabase" : "InsForge";
  console.info(`[VibeScore] Using ${source} data source`);
  return true;
})();

// 获取当前数据源的 API 实现
function getApi() {
  return isSupabaseDataSource() ? SupabaseApi : InsforgeApiImpl;
}

// ============================================================================
// Proxy Exports - 所有导出函数代理到对应的数据源实现
// ============================================================================

export async function probeBackend(options = {}) {
  const api = getApi();
  const baseUrl = options.baseUrl || getBaseUrl();
  return api.probeBackend({ ...options, baseUrl });
}

export async function getUsageSummary(options) {
  const api = getApi();
  const baseUrl = options.baseUrl || getBaseUrl();
  return api.getUsageSummary({ ...options, baseUrl });
}

export async function getUsageModelBreakdown(options) {
  const api = getApi();
  const baseUrl = options.baseUrl || getBaseUrl();
  return api.getUsageModelBreakdown({ ...options, baseUrl });
}

export async function getUsageDaily(options) {
  const api = getApi();
  const baseUrl = options.baseUrl || getBaseUrl();
  return api.getUsageDaily({ ...options, baseUrl });
}

export async function getUsageHourly(options) {
  const api = getApi();
  const baseUrl = options.baseUrl || getBaseUrl();
  return api.getUsageHourly({ ...options, baseUrl });
}

export async function getUsageMonthly(options) {
  const api = getApi();
  const baseUrl = options.baseUrl || getBaseUrl();
  return api.getUsageMonthly({ ...options, baseUrl });
}

export async function getUsageHeatmap(options) {
  const api = getApi();
  const baseUrl = options.baseUrl || getBaseUrl();
  return api.getUsageHeatmap({ ...options, baseUrl });
}

export async function requestInstallLinkCode(options = {}) {
  const api = getApi();
  const baseUrl = options.baseUrl || getBaseUrl();
  return api.requestInstallLinkCode({ ...options, baseUrl });
}
