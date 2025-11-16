// src/app/api/subscription-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SubscriptionStatusResponse } from '@/lib/types/payment';

// Cliente Supabase server-side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .select('is_premium')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('Erro ao buscar perfil:', profileError);
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado', isPremium: false },
        { status: 404 }
      );
    }

    // Buscar última subscription ativa
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'paid')
      .order('created_at', { ascending: false })
      .limit(1);

    if (subError) {
      console.error('Erro ao buscar subscriptions:', subError);
    }

    const latestSubscription = subscriptions?.[0];

    const response: SubscriptionStatusResponse = {
      success: true,
      isPremium: profile.is_premium || false,
      subscription: latestSubscription ? {
        id: latestSubscription.id,
        status: latestSubscription.status,
        plan_id: latestSubscription.plan_id,
        amount_cents: latestSubscription.amount_cents,
        payment_method: latestSubscription.payment_method,
        created_at: latestSubscription.created_at,
        paid_at: latestSubscription.paid_at
      } : undefined
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Erro ao verificar status:', error);
    return NextResponse.json(
      { success: false, error: error.message, isPremium: false },
      { status: 500 }
    );
  }
}
