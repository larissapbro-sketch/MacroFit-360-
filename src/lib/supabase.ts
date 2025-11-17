// src/lib/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Validar se as variáveis estão configuradas
const isConfigured = url && anonKey && url !== '' && anonKey !== '';

/**
 * supabaseExport: tenta criar um client **somente** no browser (quando window existe)
 * e quando as variáveis de ambiente estão configuradas.
 * Se for server/build ou variáveis ausentes, retorna null.
 */
export const supabase: SupabaseClient | null =
  typeof window !== 'undefined' && isConfigured
    ? createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      })
    : null;

/**
 * Função para obter o client no browser. Igual comportamento do supabase exportado,
 * mas mais explícito e seguro para uso via getBrowserSupabase().
 */
export function getBrowserSupabase(): SupabaseClient | null {
  return supabase;
}

/**
 * Verifica se o Supabase está configurado corretamente
 */
export function isSupabaseConfigured(): boolean {
  return isConfigured;
}
