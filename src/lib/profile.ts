"use client";

import { supabase } from "@/lib/supabase";

export async function getCurrentUserProfile() {
  try {
    // Pega o usuário logado
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    
    if (userErr) {
      console.error("Erro ao buscar usuário autenticado:", userErr);
      throw new Error("Não foi possível verificar autenticação");
    }
    
    if (!userData?.user) {
      console.warn("Nenhum usuário autenticado, não buscar perfil.");
      return null;
    }

    const userId = userData.user.id;

    const { data, error } = await supabase
      .from("users_profile")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      // Se o erro for "not found", retorna null (usuário sem perfil)
      if (error.code === 'PGRST116') {
        console.warn("Perfil não encontrado para o usuário:", userId);
        return null;
      }
      
      console.error("Erro ao buscar perfil do usuário:", error);
      throw new Error(`Erro ao carregar perfil: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Erro em getCurrentUserProfile:", error);
    return null;
  }
}
