// src/lib/mercadopago.ts
import { MercadoPagoPixResponse } from './types/payment';

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || '';
const MP_BASE_URL = process.env.MP_BASE_URL || 'https://api.mercadopago.com';

if (!MP_ACCESS_TOKEN) {
  console.warn('⚠️ MP_ACCESS_TOKEN não configurado. Configure para usar Mercado Pago.');
}

export interface CreatePixPaymentParams {
  transaction_amount: number;
  description: string;
  payment_method_id: 'pix';
  payer: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
  external_reference?: string;
  notification_url?: string;
}

export interface CreateCardPaymentParams {
  transaction_amount: number;
  description: string;
  payment_method_id: string;
  token: string;
  installments: number;
  payer: {
    email: string;
    identification?: {
      type: string;
      number: string;
    };
  };
  external_reference?: string;
  notification_url?: string;
}

/**
 * Cria um pagamento PIX no Mercado Pago
 */
export async function createPixPayment(
  params: CreatePixPaymentParams
): Promise<MercadoPagoPixResponse> {
  if (!MP_ACCESS_TOKEN) {
    throw new Error('MP_ACCESS_TOKEN não configurado');
  }

  const response = await fetch(`${MP_BASE_URL}/v1/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
      'X-Idempotency-Key': `${Date.now()}-${Math.random()}` // Evita duplicação
    },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Erro ao criar pagamento PIX:', error);
    throw new Error(`Erro Mercado Pago: ${error.message || response.statusText}`);
  }

  return response.json();
}

/**
 * Cria um pagamento com Cartão no Mercado Pago
 */
export async function createCardPayment(
  params: CreateCardPaymentParams
): Promise<any> {
  if (!MP_ACCESS_TOKEN) {
    throw new Error('MP_ACCESS_TOKEN não configurado');
  }

  const response = await fetch(`${MP_BASE_URL}/v1/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
      'X-Idempotency-Key': `${Date.now()}-${Math.random()}`
    },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Erro ao criar pagamento com cartão:', error);
    throw new Error(`Erro Mercado Pago: ${error.message || response.statusText}`);
  }

  return response.json();
}

/**
 * Busca informações de um pagamento pelo ID
 */
export async function getPayment(paymentId: string): Promise<any> {
  if (!MP_ACCESS_TOKEN) {
    throw new Error('MP_ACCESS_TOKEN não configurado');
  }

  const response = await fetch(`${MP_BASE_URL}/v1/payments/${paymentId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Erro ao buscar pagamento:', error);
    throw new Error(`Erro Mercado Pago: ${error.message || response.statusText}`);
  }

  return response.json();
}

/**
 * Valida assinatura do webhook do Mercado Pago
 * Documentação: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 */
export function validateWebhookSignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string
): boolean {
  // Em produção, implemente validação real conforme documentação MP
  // Por ora, apenas verificamos se os headers existem
  if (!xSignature || !xRequestId) {
    console.warn('⚠️ Webhook sem assinatura válida');
    return false;
  }

  // TODO: Implementar validação real usando HMAC-SHA256
  // const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  // const hash = crypto.createHmac('sha256', secret).update(data).digest('hex');
  // return hash === xSignature;

  return true; // Temporário para desenvolvimento
}

/**
 * Gera URL do checkout do Mercado Pago (para cartão)
 */
export function generateCheckoutUrl(preferenceId: string): string {
  const isSandbox = process.env.MP_BASE_URL?.includes('sandbox');
  const baseUrl = isSandbox 
    ? 'https://sandbox.mercadopago.com.br'
    : 'https://www.mercadopago.com.br';
  
  return `${baseUrl}/checkout/v1/redirect?pref_id=${preferenceId}`;
}
