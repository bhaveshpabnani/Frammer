/**
 * Base API client with Supabase JWT auth.
 * Falls back gracefully when no session exists (backend dev-bypass handles it).
 *
 * Phase 4: All backend responses are now wrapped in { data: T, meta: ResponseMetadata }.
 * apiFetch auto-unwraps the envelope so all existing hooks continue working.
 * Use apiFetchWithMeta<T> when you need access to the metadata (reports, exports).
 */
import { supabase } from '@/lib/supabase';
import type { FilterState } from '@/contexts/FilterContext';
import type { ApiResponse, ResponseMetadata } from './types';

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8001';

async function getToken(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

async function rawFetch(path: string, options?: RequestInit): Promise<unknown> {
  const token = await getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    headers['Authorization'] = 'Bearer dev';
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    throw new Error(`API Error ${res.status}: ${text}`);
  }

  return res.json();
}

/** Fetch and automatically unwrap the Phase 4 ApiResponse envelope. */
export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const json = await rawFetch(path, options);
  // Auto-unwrap Phase 4 envelope: { data: T, meta: ResponseMetadata }
  if (json && typeof json === 'object' && 'data' in (json as object) && 'meta' in (json as object)) {
    return (json as ApiResponse<T>).data;
  }
  return json as T;
}

/** Fetch and return the full ApiResponse envelope including metadata. */
export async function apiFetchWithMeta<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const json = await rawFetch(path, options);
  if (json && typeof json === 'object' && 'data' in (json as object) && 'meta' in (json as object)) {
    return json as ApiResponse<T>;
  }
  // Fallback: wrap bare response for backward compat
  return {
    data: json as T,
    meta: {
      filters_applied: {},
      generated_at: new Date().toISOString(),
      metric_definitions_used: [],
      source_grain: 'unknown',
      caveats: [],
    } as ResponseMetadata,
  };
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function apiPostWithMeta<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  return apiFetchWithMeta<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** Build a query string from filter state. */
export function toApiParams(filters: FilterState): string {
  const params = new URLSearchParams();

  if (filters.dateRange && filters.dateRange !== 'all') {
    params.set('dateRange', filters.dateRange);
  }
  if (filters.client && filters.client !== 'all') {
    params.set('client', filters.client);
  }
  if (filters.channel && filters.channel !== 'all') {
    params.set('channel', filters.channel);
  }
  if (filters.language && filters.language !== 'all') {
    params.set('language', filters.language);
  }
  if (filters.teamMember && filters.teamMember !== 'all') {
    params.set('teamMember', filters.teamMember);
  }
  if (filters.inputType && filters.inputType !== 'all') {
    params.set('inputType', filters.inputType);
  }
  if (filters.outputType && filters.outputType !== 'all') {
    params.set('outputType', filters.outputType);
  }
  if (filters.publishedFlag && filters.publishedFlag !== 'all') {
    params.set('publishedFlag', filters.publishedFlag);
  }
  if (filters.publishedPlatform && filters.publishedPlatform !== 'all') {
    params.set('publishedPlatform', filters.publishedPlatform);
  }
  if (filters.billableFlag && filters.billableFlag !== 'all') {
    params.set('billableFlag', filters.billableFlag);
  }
  if (filters.comparison?.enabled && filters.comparison.type) {
    const modeMap: Record<string, string> = {
      month: 'previous_month',
      quarter: 'previous_period',
      year: 'previous_year',
    };
    const mode = modeMap[filters.comparison.type];
    if (mode) params.set('compareMode', mode);
  }

  return params.toString();
}
