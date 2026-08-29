/**
 * Centralized API Configuration for Portfolio Frontend.
 * Reads NEXT_PUBLIC_API_URL in production (Vercel / Cloudflare / Netlify / Render)
 * with seamless fallback to http://localhost:8000 in local development.
 */

export const API_BASE_URL: string =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

export const API_V1: string = `${API_BASE_URL}/api/v1`;
