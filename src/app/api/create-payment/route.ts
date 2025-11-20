// src/app/api/create-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createPixPayment } from '@/lib/mercadopago';
import { CreatePaymentRequest, CreatePaymentResponse, PLANS } from '@/lib/types/payment';

// Cliente Supabase server-side (com service_role para bypass RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    // Validação inicial dos parâmetros obrigatórios
    const body = await request.json().catch(() => ({}))
    const { userId, planId, paymentMethod } = body || {}
    
    if (!userId || !planId || !paymentMethod) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Parâmetros obrigatórios: userId, planId, paymentMethod' 
        }), 
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const plan = PLANS[planId];
    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Plano inválido' },
        { status: 400 }
      );
    }

    // Criar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar dados do usuário
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const userEmail = userData.user.email || 'usuario@macrofit.com';

    // ============================================
    // FLUXO PIX
    // ============================================
    if (paymentMethod === 'pix') {
      // Criar pagamento PIX no Mercado Pago
      const mpResponse = await createPixPayment({
        transaction_amount: plan.amount_cents / 100, // Converter centavos para reais
        description: plan.description,
        payment_method_id: 'pix',
        payer: {
          email: userEmail,
          first_name: userData.user.user_metadata?.name || 'Usuário'
        },
        external_reference: `${userId}-${planId}-${Date.now()}`,
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/payment`
      });

      // Salvar no banco
      const { data: subscription, error: dbError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          provider_payment_id: mpResponse.id.toString(),
          provider_subscription_id: null,
          plan_id: planId,
          amount: plan.amount_cents / 100,
          status: 'pending'
        })
        .select()
        .single();

      if (dbError) {
        console.error('Erro ao salvar subscription:', dbError);
        return NextResponse.json(
          { success: false, error: 'Erro ao salvar pagamento no banco' },
          { status: 500 }
        );
      }

      // Log de auditoria
      await supabase.from('payment_logs').insert({
        user_id: userId,
        event: 'payment_created',
        payload: mpResponse
      });

      const response: CreatePaymentResponse = {
        success: true,
        subscriptionId: subscription.id,
        provider_payment_id: mpResponse.id.toString(),
        qr_code: mpResponse.point_of_interaction.transaction_data.qr_code,
        qr_code_base64: mpResponse.point_of_interaction.transaction_data.qr_code_base64,
        copy_paste: mpResponse.point_of_interaction.transaction_data.qr_code,
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutos
      };

      return NextResponse.json(response);
    }

    // ============================================
    // FLUXO CARTÃO
    // ============================================
    if (paymentMethod === 'card' || paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
      // Para cartão, retornamos URL do checkout do Mercado Pago
      // O frontend deve redirecionar o usuário para essa URL
      
      // Criar preferência de pagamento
      const preference = {
        items: [
          {
            title: plan.name,
            description: plan.description,
            quantity: 1,
            unit_price: plan.amount_cents / 100,
            currency_id: plan.currency
          }
        ],
        payer: {
          email: userEmail
        },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
          failure: `${process.env.NEXT_PUBLIC_APP_URL}/payment/failure`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL}/payment/pending`
        },
        auto_return: 'approved',
        external_reference: `${userId}-${planId}-${Date.now()}`,
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/payment`
      };

      const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`
        },
        body: JSON.stringify(preference)
      });

      if (!mpResponse.ok) {
        const error = await mpResponse.json();
        console.error('Erro ao criar preferência MP:', error);
        return NextResponse.json(
          { success: false, error: 'Erro ao criar checkout' },
          { status: 500 }
        );
      }

      const preferenceData = await mpResponse.json();

      // Salvar no banco
      const { data: subscription, error: dbError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          provider_payment_id: preferenceData.id,
          provider_subscription_id: null,
          plan_id: planId,
          amount: plan.amount_cents / 100,
          status: 'pending'
        })
        .select()
        .single();

      if (dbError) {
        console.error('Erro ao salvar subscription:', dbError);
        return NextResponse.json(
          { success: false, error: 'Erro ao salvar pagamento no banco' },
          { status: 500 }
        );
      }

      // Log de auditoria
      await supabase.from('payment_logs').insert({
        user_id: userId,
        event: 'payment_created',
        payload: preferenceData
      });

      const response: CreatePaymentResponse = {
        success: true,
        subscriptionId: subscription.id,
        provider_payment_id: preferenceData.id,
        checkout_url: preferenceData.init_point // URL do checkout MP
      };

      return NextResponse.json(response);
    }

    return NextResponse.json(
      { success: false, error: 'Método de pagamento não suportado' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Erro ao criar pagamento:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
