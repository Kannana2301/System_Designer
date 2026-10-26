/**
 * Base URL for the Render API. NEXT_PUBLIC_API_URL is inlined at build time,
 * so it must be set in the frontend hosting provider (Vercel/Netlify) before
 * running the production build.
 */
export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
).replace(/\/+$/, '');

export const apiUrl = (path: string): string =>
  `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
