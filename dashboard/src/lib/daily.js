import { copy } from "./copy.js";
import { isDetailDateKey, sortDetailRows } from "./detail-sort.js";

export const DAILY_SORT_COLUMNS = [
  {
    key: "day",
    label: copy("daily.sort.date.label"),
    title: copy("daily.sort.date.title"),
  },
  {
    key: "total_tokens",
    label: copy("daily.sort.total.label"),
    title: copy("daily.sort.total.title"),
  },
  {
    key: "input_tokens",
    label: copy("daily.sort.input.label"),
    title: copy("daily.sort.input.title"),
  },
  {
    key: "output_tokens",
    label: copy("daily.sort.output.label"),
    title: copy("daily.sort.output.title"),
  },
  {
    key: "cached_input_tokens",
    label: copy("daily.sort.cached.label"),
    title: copy("daily.sort.cached.title"),
  },
  {
    key: "reasoning_output_tokens",
    label: copy("daily.sort.reasoning.label"),
    title: copy("daily.sort.reasoning.title"),
  },
];

export function getDetailsSortColumns(dateKey) {
  const key = isDetailDateKey(dateKey) ? dateKey : "day";
  return DAILY_SORT_COLUMNS.map((col, index) =>
    index === 0 ? { ...col, key } : col
  );
}

export function sortDailyRows(rows, { key, dir }) {
  return sortDetailRows(rows, { key, dir });
}
