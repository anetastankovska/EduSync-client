export const dstr = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : '');
export const num = (v: unknown, fallback = 0) => Number(v ?? fallback);
export const BASE_URL = 'http://localhost:4000/api/v1';
