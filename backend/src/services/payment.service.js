const mercadopago = require('mercadopago');
const axios = require('axios');

/**
 * Serviço de Pagamentos
 * Integração com Mercado Pago e Stripe
 */
class PaymentService {
  constructor() {
    // Configurar Mercado Pago
    if (process.env.MERCADOPAGO_ACCESS_TOKEN) {
      mercadopago.configure({
        access_token: process.env.MERCADOPAGO_ACCESS_TOKEN,
      });
    }

    // Stripe será importado apenas quando necessário (lazy loading)
    this.stripe = null;
  }

  /**
   * Inicializa Stripe (lazy loading)
   */
  getStripe() {
    if (!this.stripe && process.env.STRIPE_SECRET_KEY) {
      const Stripe = require('stripe');
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: process.env.STRIPE_API_VERSION || '2023-10-16',
      });
    }
    return this.stripe;
  }

  // ============================================================================
  // MERCADO PAGO
  // ============================================================================

  /**
   * Criar preferência de pagamento no Mercado Pago
   * @param {Object} orderData - Dados do pedido
   * @returns {Object} Preferência criada
   */
  async createMercadoPagoPreference(orderData) {
    try {
      const {
        orderId,
        items,
        payer,
        backUrls,
        autoReturn = 'approved',
        externalReference,
      } = orderData;

      const preference = {
        items: items.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description || '',
          picture_url: item.image_url,
          category_id: item.category,
          quantity: item.quantity,
          unit_price: parseFloat(item.price),
        })),
        payer: {
          name: payer.name,
          email: payer.email,
          phone: payer.phone
            ? {
                area_code: payer.phone.area_code || '',
                number: payer.phone.number || '',
              }
            : undefined,
          address: payer.address
            ? {
                street_name: payer.address.street,
                street_number: payer.address.number,
                zip_code: payer.address.zip_code,
              }
            : undefined,
        },
        back_urls: backUrls || {
          success: `${process.env.FRONTEND_URL}/payment/success`,
          failure: `${process.env.FRONTEND_URL}/payment/failure`,
          pending: `${process.env.FRONTEND_URL}/payment/pending`,
        },
        auto_return: autoReturn,
        external_reference: externalReference || orderId,
        notification_url: `${process.env.API_URL}/webhooks/mercadopago`,
        statement_descriptor: 'APEGA DESAPEGA',
        payment_methods: {
          excluded_payment_types: [],
          installments: 12,
        },
      };

      const response = await mercadopago.preferences.create(preference);

      return {
        success: true,
        preferenceId: response.body.id,
        initPoint: response.body.init_point,
        sandboxInitPoint: response.body.sandbox_init_point,
      };
    } catch (error) {
      console.error('Erro ao criar preferência Mercado Pago:', error);
      throw new Error(`Erro no Mercado Pago: ${error.message}`);
    }
  }

  /**
   * Processar pagamento PIX no Mercado Pago
   * @param {Object} pixData - Dados do PIX
   * @returns {Object} QR Code e informações do PIX
   */
  async createMercadoPagoPix(pixData) {
    try {
      const { amount, description, email, orderId } = pixData;

      const payment = {
        transaction_amount: parseFloat(amount),
        description: description || 'Compra no Apega Desapega',
        payment_method_id: 'pix',
        payer: {
          email: email,
        },
        external_reference: orderId,
        notification_url: `${process.env.API_URL}/webhooks/mercadopago`,
      };

      const response = await mercadopago.payment.create(payment);

      return {
        success: true,
        paymentId: response.body.id,
        status: response.body.status,
        qrCode: response.body.point_of_interaction.transaction_data.qr_code,
        qrCodeBase64:
          response.body.point_of_interaction.transaction_data.qr_code_base64,
        ticketUrl: response.body.point_of_interaction.transaction_data.ticket_url,
      };
    } catch (error) {
      console.error('Erro ao criar PIX Mercado Pago:', error);
      throw new Error(`Erro no PIX: ${error.message}`);
    }
  }

  /**
   * Consultar status de pagamento no Mercado Pago
   * @param {string} paymentId - ID do pagamento
   * @returns {Object} Status do pagamento
   */
  async getMercadoPagoPaymentStatus(paymentId) {
    try {
      const response = await mercadopago.payment.get(paymentId);

      return {
        id: response.body.id,
        status: response.body.status,
        statusDetail: response.body.status_detail,
        transactionAmount: response.body.transaction_amount,
        dateApproved: response.body.date_approved,
        paymentMethod: response.body.payment_method_id,
        externalReference: response.body.external_reference,
      };
    } catch (error) {
      console.error('Erro ao consultar pagamento Mercado Pago:', error);
      throw new Error(`Erro ao consultar pagamento: ${error.message}`);
    }
  }

  /**
   * Processar reembolso no Mercado Pago
   * @param {string} paymentId - ID do pagamento
   * @param {number} amount - Valor do reembolso (opcional, total se não informado)
   * @returns {Object} Informações do reembolso
   */
  async refundMercadoPago(paymentId, amount = null) {
    try {
      const refundData = amount ? { amount: parseFloat(amount) } : {};
      const response = await mercadopago.refund.create(paymentId, refundData);

      return {
        success: true,
        refundId: response.body.id,
        status: response.body.status,
        amount: response.body.amount,
      };
    } catch (error) {
      console.error('Erro ao processar reembolso Mercado Pago:', error);
      throw new Error(`Erro no reembolso: ${error.message}`);
    }
  }

  // ============================================================================
  // STRIPE
  // ============================================================================

  /**
   * Criar Payment Intent no Stripe
   * @param {Object} paymentData - Dados do pagamento
   * @returns {Object} Payment Intent criado
   */
  async createStripePaymentIntent(paymentData) {
    try {
      const stripe = this.getStripe();
      if (!stripe) {
        throw new Error('Stripe não configurado');
      }

      const { amount, currency = 'brl', metadata, customerId, orderId } = paymentData;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(parseFloat(amount) * 100), // Stripe usa centavos
        currency: currency.toLowerCase(),
        metadata: {
          orderId: orderId,
          ...metadata,
        },
        customer: customerId,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
      };
    } catch (error) {
      console.error('Erro ao criar Payment Intent Stripe:', error);
      throw new Error(`Erro no Stripe: ${error.message}`);
    }
  }

  /**
   * Confirmar Payment Intent no Stripe
   * @param {string} paymentIntentId - ID do Payment Intent
   * @returns {Object} Payment Intent confirmado
   */
  async confirmStripePaymentIntent(paymentIntentId) {
    try {
      const stripe = this.getStripe();
      if (!stripe) {
        throw new Error('Stripe não configurado');
      }

      const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);

      return {
        success: true,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
      };
    } catch (error) {
      console.error('Erro ao confirmar Payment Intent Stripe:', error);
      throw new Error(`Erro ao confirmar pagamento: ${error.message}`);
    }
  }

  /**
   * Consultar status de Payment Intent no Stripe
   * @param {string} paymentIntentId - ID do Payment Intent
   * @returns {Object} Status do pagamento
   */
  async getStripePaymentStatus(paymentIntentId) {
    try {
      const stripe = this.getStripe();
      if (!stripe) {
        throw new Error('Stripe não configurado');
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      return {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        metadata: paymentIntent.metadata,
        created: new Date(paymentIntent.created * 1000),
      };
    } catch (error) {
      console.error('Erro ao consultar pagamento Stripe:', error);
      throw new Error(`Erro ao consultar pagamento: ${error.message}`);
    }
  }

  /**
   * Processar reembolso no Stripe
   * @param {string} paymentIntentId - ID do Payment Intent
   * @param {number} amount - Valor do reembolso (opcional, total se não informado)
   * @returns {Object} Informações do reembolso
   */
  async refundStripe(paymentIntentId, amount = null) {
    try {
      const stripe = this.getStripe();
      if (!stripe) {
        throw new Error('Stripe não configurado');
      }

      const refundData = {
        payment_intent: paymentIntentId,
      };

      if (amount) {
        refundData.amount = Math.round(parseFloat(amount) * 100);
      }

      const refund = await stripe.refunds.create(refundData);

      return {
        success: true,
        refundId: refund.id,
        status: refund.status,
        amount: refund.amount / 100,
        currency: refund.currency,
      };
    } catch (error) {
      console.error('Erro ao processar reembolso Stripe:', error);
      throw new Error(`Erro no reembolso: ${error.message}`);
    }
  }

  /**
   * Criar cliente no Stripe
   * @param {Object} customerData - Dados do cliente
   * @returns {Object} Cliente criado
   */
  async createStripeCustomer(customerData) {
    try {
      const stripe = this.getStripe();
      if (!stripe) {
        throw new Error('Stripe não configurado');
      }

      const { email, name, phone, metadata } = customerData;

      const customer = await stripe.customers.create({
        email,
        name,
        phone,
        metadata,
      });

      return {
        success: true,
        customerId: customer.id,
        email: customer.email,
      };
    } catch (error) {
      console.error('Erro ao criar cliente Stripe:', error);
      throw new Error(`Erro ao criar cliente: ${error.message}`);
    }
  }

  // ============================================================================
  // WEBHOOK HANDLERS
  // ============================================================================

  /**
   * Processar webhook do Mercado Pago
   * @param {Object} notification - Notificação recebida
   * @returns {Object} Dados processados
   */
  async handleMercadoPagoWebhook(notification) {
    try {
      const { type, data } = notification;

      if (type === 'payment') {
        const paymentId = data.id;
        const paymentInfo = await this.getMercadoPagoPaymentStatus(paymentId);

        return {
          type: 'payment',
          paymentId,
          status: paymentInfo.status,
          orderId: paymentInfo.externalReference,
          amount: paymentInfo.transactionAmount,
        };
      }

      return { type, data };
    } catch (error) {
      console.error('Erro ao processar webhook Mercado Pago:', error);
      throw error;
    }
  }

  /**
   * Processar webhook do Stripe
   * @param {string} payload - Corpo da requisição
   * @param {string} signature - Assinatura do webhook
   * @returns {Object} Event processado
   */
  async handleStripeWebhook(payload, signature) {
    try {
      const stripe = this.getStripe();
      if (!stripe) {
        throw new Error('Stripe não configurado');
      }

      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

      return {
        type: event.type,
        data: event.data.object,
      };
    } catch (error) {
      console.error('Erro ao processar webhook Stripe:', error);
      throw new Error(`Erro no webhook: ${error.message}`);
    }
  }
}

module.exports = new PaymentService();
