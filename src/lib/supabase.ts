// src/lib/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * supabaseExport: tenta criar um client **somente** no browser (quando window existe).
 * Se for server/build retorna null. Assim mantemos compatibilidade para quem
 * ainda importa { supabase }.
 */
export const supabase: SupabaseClient | null =
  typeof window !== 'undefined' && url && anonKey
    ? createClient(url, anonKey)
    : null;

/**
 * Função para obter o client no browser. Igual comportamento do supabase exportado,
 * mas mais explícito e seguro para uso via getBrowserSupabase().
 */
export function getBrowserSupabase(): SupabaseClient | null {
  return supabase;
}
