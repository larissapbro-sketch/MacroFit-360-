// src/app/api/webhooks/payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getPayment, validateWebhookSignature } from '@/lib/mercadopago';
import { MercadoPagoWebhookPayload } from '@/lib/types/payment';

// Cliente Supabase server-side (com service_role para bypass RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body: MercadoPagoWebhookPayload = await request.json();

    // Headers de validação do Mercado Pago
    const xSignature = request.headers.get('x-signature');
    const xRequestId = request.headers.get('x-request-id');

    console.log('📥 Webhook recebido:', {
      type: body.type,
      action: body.action,
      dataId: body.data?.id,
      xSignature: xSignature ? '✓' : '✗',
      xRequestId: xRequestId ? '✓' : '✗'
    });

    // Validar assinatura do webhook (comentado para desenvolvimento)
    // if (!validateWebhookSignature(xSignature, xRequestId, body.data?.id)) {
    //   console.error('❌ Assinatura do webhook inválida');
    //   return NextResponse.json(
    //     { error: 'Invalid signature' },
    //     { status: 401 }
    //   );
    // }

    // Processar apenas eventos de pagamento
    if (body.type !== 'payment') {
      console.log('ℹ️ Evento ignorado (não é pagamento):', body.type);
      return NextResponse.json({ received: true });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      console.error('❌ Webhook sem payment ID');
      return NextResponse.json(
        { error: 'Missing payment ID' },
        { status: 400 }
      );
    }

    // Buscar detalhes do pagamento no Mercado Pago
    const paymentData = await getPayment(paymentId);

    console.log('💳 Dados do pagamento:', {
      id: paymentData.id,
      status: paymentData.status,
      status_detail: paymentData.status_detail,
      payment_method: paymentData.payment_method_id,
      amount: paymentData.transaction_amount
    });

    // Criar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar subscription no banco
    const { data: subscription, error: findError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('provider_payment_id', paymentId.toString())
      .single();

    if (findError || !subscription) {
      console.error('❌ Subscription não encontrada:', paymentId);
      
      // Log do webhook mesmo sem subscription
      await supabase.from('payment_logs').insert({
        user_id: null,
        event: 'webhook_received_orphan',
        payload: { webhook: body, payment: paymentData }
      });

      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // ============================================
    // PROCESSAR STATUS DO PAGAMENTO
    // ============================================

    let newStatus = subscription.status;

    // Mapear status do Mercado Pago para nosso sistema
    switch (paymentData.status) {
      case 'approved':
        newStatus = 'paid';
        console.log('✅ Pagamento aprovado!');
        break;
      
      case 'pending':
      case 'in_process':
        newStatus = 'pending';
        console.log('⏳ Pagamento pendente');
        break;
      
      case 'rejected':
      case 'cancelled':
        newStatus = 'failed';
        console.log('❌ Pagamento rejeitado/cancelado');
        break;
      
      case 'refunded':
      case 'charged_back':
        newStatus = 'refunded';
        console.log('↩️ Pagamento reembolsado');
        break;
      
      default:
        console.warn('⚠️ Status desconhecido:', paymentData.status);
    }

    // Atualizar subscription no banco
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('❌ Erro ao atualizar subscription:', updateError);
      return NextResponse.json(
        { error: 'Database update failed' },
        { status: 500 }
      );
    }

    // Se pagamento foi aprovado, atualizar is_premium do usuário
    if (newStatus === 'paid') {
      const { error: premiumError } = await supabase
        .from('users_profile')
        .update({ is_premium: true })
        .eq('user_id', subscription.user_id);

      if (premiumError) {
        console.error('❌ Erro ao atualizar is_premium:', premiumError);
      } else {
        console.log('🎉 Usuário atualizado para Premium!');
      }
    }

    // Log de auditoria
    await supabase.from('payment_logs').insert({
      user_id: subscription.user_id,
      event: 'webhook_received',
      payload: { webhook: body, payment: paymentData, new_status: newStatus }
    });

    console.log('✅ Webhook processado com sucesso');

    return NextResponse.json({
      received: true,
      subscription_id: subscription.id,
      status: newStatus
    });

  } catch (error: any) {
    console.error('❌ Erro ao processar webhook:', error);
    
    // Tentar logar o erro
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      await supabase.from('payment_logs').insert({
        user_id: null,
        event: 'webhook_error',
        payload: { error: error.message, stack: error.stack }
      });
    } catch (logError) {
      console.error('❌ Erro ao logar erro:', logError);
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Endpoint GET para verificar se o webhook está funcionando
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Webhook endpoint is ready',
    timestamp: new Date().toISOString()
  });
}
