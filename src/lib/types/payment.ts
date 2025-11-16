// src/lib/types/payment.ts

export type PaymentProvider = 'mercadopago' | 'pagarme' | 'stripe';
export type PaymentMethod = 'pix' | 'credit_card' | 'debit_card' | 'boleto';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';

export interface CreatePaymentRequest {
  userId: string;
  planId: string;
  paymentMethod: PaymentMethod;
}

export interface CreatePaymentResponse {
  success: boolean;
  subscriptionId?: string;
  provider_payment_id?: string;
  
  // Para PIX
  qr_code?: string;
  qr_code_base64?: string;
  copy_paste?: string;
  expires_at?: string;
  
  // Para Cartão
  checkout_url?: string;
  payment_intent?: string;
  
  error?: string;
}

export interface SubscriptionStatusResponse {
  success: boolean;
  isPremium: boolean;
  subscription?: {
    id: string;
    status: PaymentStatus;
    plan_id: string;
    amount_cents: number;
    payment_method: PaymentMethod;
    created_at: string;
    paid_at?: string;
  };
  error?: string;
}

export interface MercadoPagoPixResponse {
  id: number;
  status: string;
  status_detail: string;
  transaction_amount: number;
  currency_id: string;
  date_created: string;
  date_approved?: string;
  date_last_updated: string;
  payment_method_id: string;
  payment_type_id: string;
  point_of_interaction: {
    type: string;
    transaction_data: {
      qr_code: string;
      qr_code_base64: string;
      ticket_url: string;
    };
  };
}

export interface MercadoPagoWebhookPayload {
  action: string;
  api_version: string;
  data: {
    id: string;
  };
  date_created: string;
  id: number;
  live_mode: boolean;
  type: string;
  user_id: string;
}

export interface PlanConfig {
  id: string;
  name: string;
  amount_cents: number;
  currency: string;
  description: string;
}

export const PLANS: Record<string, PlanConfig> = {
  premium_monthly: {
    id: 'premium_monthly',
    name: 'Premium Mensal',
    amount_cents: 3900, // R$ 39,00
    currency: 'BRL',
    description: 'Acesso completo por 1 mês'
  },
  premium_yearly: {
    id: 'premium_yearly',
    name: 'Premium Anual',
    amount_cents: 39900, // R$ 399,00 (economia de ~15%)
    currency: 'BRL',
    description: 'Acesso completo por 12 meses'
  }
};
