export function toDisplayNumber(value) {
  if (value == null) return "-";
  try {
    if (typeof value === "bigint") return new Intl.NumberFormat().format(value);
    if (typeof value === "number") return new Intl.NumberFormat().format(value);
    const s = String(value).trim();
    if (/^[0-9]+$/.test(s)) return new Intl.NumberFormat().format(BigInt(s));
    return s;
  } catch (_e) {
    return String(value);
  }
}

export function toFiniteNumber(value) {
  const n = Number(String(value));
  return Number.isFinite(n) ? n : null;
}

export function formatUsd(value) {
  if (value == null) return "-";
  const raw = String(value).trim();
  if (!raw) return "-";
  const match = raw.match(/^(-?\d+)(?:\.(\d+))?$/);
  if (!match) return raw;
  const intPart = match[1];
  const fracPart = match[2];
  let formattedInt = intPart;
  try {
    formattedInt = new Intl.NumberFormat().format(BigInt(intPart));
  } catch (_e) {
    formattedInt = intPart;
  }
  return fracPart ? `${formattedInt}.${fracPart}` : formattedInt;
}
