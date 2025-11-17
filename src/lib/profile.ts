"use client";

import { getBrowserSupabase, isSupabaseConfigured } from "@/lib/supabase";

export async function getCurrentUserProfile() {
  try {
    // Verificar se o Supabase está configurado ANTES de tentar qualquer operação
    if (!isSupabaseConfigured()) {
      console.warn("⚠️ Supabase não configurado. Variáveis de ambiente ausentes.");
      return null;
    }

    const supabase = getBrowserSupabase();

    // Verificar se o cliente Supabase está disponível
    if (!supabase) {
      console.warn("⚠️ Cliente Supabase não disponível.");
      return null;
    }

    // Pega o usuário logado com timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout ao buscar usuário')), 10000)
    );

    const userPromise = supabase.auth.getUser();
    
    const { data: userData, error: userErr } = await Promise.race([
      userPromise,
      timeoutPromise
    ]) as any;
    
    if (userErr) {
      // Erro de rede ou autenticação
      if (userErr.message?.includes('fetch') || userErr.message?.includes('network')) {
        console.warn("⚠️ Problema de conexão com Supabase. Verifique sua internet.");
        return null;
      }
      console.error("Erro ao buscar usuário autenticado:", userErr);
      throw new Error("Não foi possível verificar autenticação");
    }
    
    if (!userData?.user) {
      console.warn("Nenhum usuário autenticado.");
      return null;
    }

    const userId = userData.user.id;

    // Buscar perfil com timeout
    const profilePromise = supabase
      .from("users_profile")
      .select("*")
      .eq("user_id", userId)
      .single();

    const { data, error } = await Promise.race([
      profilePromise,
      timeoutPromise
    ]) as any;

    if (error) {
      // Se o erro for "not found", retorna null (usuário sem perfil)
      if (error.code === 'PGRST116') {
        console.warn("Perfil não encontrado para o usuário:", userId);
        return null;
      }
      
      // Erro de rede
      if (error.message?.includes('fetch') || error.message?.includes('network')) {
        console.warn("⚠️ Problema de conexão ao buscar perfil. Verifique sua internet.");
        return null;
      }
      
      console.error("Erro ao buscar perfil do usuário:", error);
      throw new Error(`Erro ao carregar perfil: ${error.message}`);
    }

    return data;
  } catch (error: any) {
    // Tratamento de erros de timeout e rede
    if (error.message?.includes('Timeout')) {
      console.warn("⚠️ Timeout ao conectar com Supabase. Tente novamente.");
      return null;
    }
    
    if (error.message?.includes('fetch') || error.message?.includes('Failed to fetch')) {
      console.warn("⚠️ Falha na conexão com Supabase. Verifique sua internet e as configurações.");
      return null;
    }

    console.error("Erro em getCurrentUserProfile:", error);
    return null;
  }
}
