'use strict';

const MAX_PAGE_SIZE = 1000;

function normalizePageSize(value) {
  const size = Number(value);
  if (!Number.isFinite(size) || size <= 0) return MAX_PAGE_SIZE;
  return Math.min(MAX_PAGE_SIZE, Math.floor(size));
}

async function forEachPage({ createQuery, pageSize, onPage }) {
  if (typeof createQuery !== 'function') {
    throw new Error('createQuery must be a function');
  }
  if (typeof onPage !== 'function') {
    throw new Error('onPage must be a function');
  }

  const size = normalizePageSize(pageSize);
  let offset = 0;

  while (true) {
    const query = createQuery();
    if (!query || typeof query.range !== 'function') {
      const { data, error } = await query;
      if (error) return { error };
      const rows = Array.isArray(data) ? data : [];
      if (rows.length) await onPage(rows);
      return { error: null };
    }

    const { data, error } = await query.range(offset, offset + size - 1);
    if (error) return { error };
    const rows = Array.isArray(data) ? data : [];
    if (rows.length) await onPage(rows);
    if (rows.length < size) break;
    offset += size;
  }

  return { error: null };
}

module.exports = { forEachPage };
