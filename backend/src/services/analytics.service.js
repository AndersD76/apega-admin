const axios = require('axios');

/**
 * Serviço de Analytics
 * Integração com Google Analytics 4 (GA4)
 */
class AnalyticsService {
  constructor() {
    this.measurementId = process.env.GA4_MEASUREMENT_ID;
    this.apiSecret = process.env.GA4_API_SECRET;
    this.apiUrl = 'https://www.google-analytics.com/mp/collect';
  }

  /**
   * Verificar se está configurado
   */
  isConfigured() {
    return !!(this.measurementId && this.apiSecret);
  }

  /**
   * Enviar evento para GA4
   * @param {Object} eventData - Dados do evento
   * @returns {Object} Resultado do envio
   */
  async sendEvent(eventData) {
    try {
      if (!this.isConfigured()) {
        console.warn('GA4 não configurado - evento não será enviado');
        return { success: false, message: 'GA4 não configurado' };
      }

      const { clientId, userId, events } = eventData;

      const payload = {
        client_id: clientId,
        ...(userId && { user_id: userId }),
        events: Array.isArray(events) ? events : [events],
      };

      await axios.post(
        `${this.apiUrl}?measurement_id=${this.measurementId}&api_secret=${this.apiSecret}`,
        payload
      );

      return {
        success: true,
        message: 'Evento enviado com sucesso',
      };
    } catch (error) {
      console.error('Erro ao enviar evento para GA4:', error);
      // Não throw error para não quebrar o fluxo da aplicação
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Gerar client ID único
   * @returns {string} Client ID
   */
  generateClientId() {
    return `${Date.now()}.${Math.random().toString(36).substring(2, 15)}`;
  }

  // ============================================================================
  // EVENTOS DE E-COMMERCE
  // ============================================================================

  /**
   * Evento: Visualização de produto
   */
  async trackViewItem(clientId, product, userId = null) {
    return this.sendEvent({
      clientId,
      userId,
      events: {
        name: 'view_item',
        params: {
          currency: 'BRL',
          value: parseFloat(product.price),
          items: [
            {
              item_id: product.id,
              item_name: product.title,
              item_category: product.category,
              item_brand: product.brand || 'Sem marca',
              price: parseFloat(product.price),
              quantity: 1,
            },
          ],
        },
      },
    });
  }

  /**
   * Evento: Adicionar ao carrinho
   */
  async trackAddToCart(clientId, product, userId = null) {
    return this.sendEvent({
      clientId,
      userId,
      events: {
        name: 'add_to_cart',
        params: {
          currency: 'BRL',
          value: parseFloat(product.price),
          items: [
            {
              item_id: product.id,
              item_name: product.title,
              item_category: product.category,
              price: parseFloat(product.price),
              quantity: product.quantity || 1,
            },
          ],
        },
      },
    });
  }

  /**
   * Evento: Iniciar checkout
   */
  async trackBeginCheckout(clientId, cartData, userId = null) {
    const { items, total } = cartData;

    return this.sendEvent({
      clientId,
      userId,
      events: {
        name: 'begin_checkout',
        params: {
          currency: 'BRL',
          value: parseFloat(total),
          items: items.map((item) => ({
            item_id: item.id,
            item_name: item.title,
            item_category: item.category,
            price: parseFloat(item.price),
            quantity: item.quantity,
          })),
        },
      },
    });
  }

  /**
   * Evento: Adicionar informações de pagamento
   */
  async trackAddPaymentInfo(clientId, paymentMethod, value, userId = null) {
    return this.sendEvent({
      clientId,
      userId,
      events: {
        name: 'add_payment_info',
        params: {
          currency: 'BRL',
          value: parseFloat(value),
          payment_type: paymentMethod, // credit_card, pix, etc.
        },
      },
    });
  }

  /**
   * Evento: Compra realizada
   */
  async trackPurchase(clientId, orderData, userId = null) {
    const { orderId, total, items, shipping, tax = 0 } = orderData;

    return this.sendEvent({
      clientId,
      userId,
      events: {
        name: 'purchase',
        params: {
          transaction_id: orderId,
          currency: 'BRL',
          value: parseFloat(total),
          shipping: parseFloat(shipping),
          tax: parseFloat(tax),
          items: items.map((item) => ({
            item_id: item.id,
            item_name: item.title,
            item_category: item.category,
            item_brand: item.brand || '',
            price: parseFloat(item.price),
            quantity: item.quantity,
          })),
        },
      },
    });
  }

  /**
   * Evento: Reembolso
   */
  async trackRefund(clientId, orderId, value, userId = null) {
    return this.sendEvent({
      clientId,
      userId,
      events: {
        name: 'refund',
        params: {
          transaction_id: orderId,
          currency: 'BRL',
          value: parseFloat(value),
        },
      },
    });
  }

  // ============================================================================
  // EVENTOS PERSONALIZADOS
  // ============================================================================

  /**
   * Evento: Cadastro de usuário
   */
  async trackSignUp(clientId, method = 'email', userId = null) {
    return this.sendEvent({
      clientId,
      userId,
      events: {
        name: 'sign_up',
        params: {
          method: method, // email, google, facebook, etc.
        },
      },
    });
  }

  /**
   * Evento: Login
   */
  async trackLogin(clientId, method = 'email', userId = null) {
    return this.sendEvent({
      clientId,
      userId,
      events: {
        name: 'login',
        params: {
          method: method,
        },
      },
    });
  }

  /**
   * Evento: Busca realizada
   */
  async trackSearch(clientId, searchTerm, userId = null) {
    return this.sendEvent({
      clientId,
      userId,
      events: {
        name: 'search',
        params: {
          search_term: searchTerm,
        },
      },
    });
  }

  /**
   * Evento: Compartilhamento
   */
  async trackShare(clientId, contentType, itemId, method, userId = null) {
    return this.sendEvent({
      clientId,
      userId,
      events: {
        name: 'share',
        params: {
          content_type: contentType, // product, profile, etc.
          item_id: itemId,
          method: method, // whatsapp, facebook, instagram, etc.
        },
      },
    });
  }

  /**
   * Evento: Produto favoritado
   */
  async trackAddToWishlist(clientId, product, userId = null) {
    return this.sendEvent({
      clientId,
      userId,
      events: {
        name: 'add_to_wishlist',
        params: {
          currency: 'BRL',
          value: parseFloat(product.price),
          items: [
            {
              item_id: product.id,
              item_name: product.title,
              item_category: product.category,
              price: parseFloat(product.price),
            },
          ],
        },
      },
    });
  }

  /**
   * Evento: Oferta enviada
   */
  async trackMakeOffer(clientId, offerData, userId = null) {
    const { productId, productTitle, offerAmount, originalPrice } = offerData;

    return this.sendEvent({
      clientId,
      userId,
      events: {
        name: 'make_offer',
        params: {
          item_id: productId,
          item_name: productTitle,
          offer_amount: parseFloat(offerAmount),
          original_price: parseFloat(originalPrice),
          discount_percentage: (
            ((originalPrice - offerAmount) / originalPrice) *
            100
          ).toFixed(2),
        },
      },
    });
  }

  /**
   * Evento: Oferta aceita
   */
  async trackAcceptOffer(clientId, offerData, userId = null) {
    const { productId, offerAmount } = offerData;

    return this.sendEvent({
      clientId,
      userId,
      events: {
        name: 'accept_offer',
        params: {
          item_id: productId,
          offer_amount: parseFloat(offerAmount),
        },
      },
    });
  }

  /**
   * Evento: Produto publicado
   */
  async trackPublishProduct(clientId, product, userId = null) {
    return this.sendEvent({
      clientId,
      userId,
      events: {
        name: 'publish_product',
        params: {
          item_id: product.id,
          item_name: product.title,
          item_category: product.category,
          price: parseFloat(product.price),
        },
      },
    });
  }

  /**
   * Evento: Mensagem enviada
   */
  async trackSendMessage(clientId, messageData, userId = null) {
    const { conversationId, messageType } = messageData;

    return this.sendEvent({
      clientId,
      userId,
      events: {
        name: 'send_message',
        params: {
          conversation_id: conversationId,
          message_type: messageType || 'text', // text, image, offer
        },
      },
    });
  }

  /**
   * Evento: Disputa aberta
   */
  async trackOpenDispute(clientId, disputeData, userId = null) {
    const { orderId, reason } = disputeData;

    return this.sendEvent({
      clientId,
      userId,
      events: {
        name: 'open_dispute',
        params: {
          order_id: orderId,
          reason: reason,
        },
      },
    });
  }

  /**
   * Evento: Avaliação enviada
   */
  async trackSubmitReview(clientId, reviewData, userId = null) {
    const { orderId, rating } = reviewData;

    return this.sendEvent({
      clientId,
      userId,
      events: {
        name: 'submit_review',
        params: {
          order_id: orderId,
          rating: parseInt(rating),
        },
      },
    });
  }

  /**
   * Evento: Saque solicitado
   */
  async trackRequestWithdrawal(clientId, withdrawalData, userId = null) {
    const { amount, method } = withdrawalData;

    return this.sendEvent({
      clientId,
      userId,
      events: {
        name: 'request_withdrawal',
        params: {
          amount: parseFloat(amount),
          method: method, // pix, bank_transfer
        },
      },
    });
  }

  /**
   * Evento genérico personalizado
   */
  async trackCustomEvent(clientId, eventName, params = {}, userId = null) {
    return this.sendEvent({
      clientId,
      userId,
      events: {
        name: eventName,
        params: params,
      },
    });
  }

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  /**
   * Enviar múltiplos eventos em batch
   */
  async sendBatchEvents(clientId, events, userId = null) {
    return this.sendEvent({
      clientId,
      userId,
      events: events,
    });
  }

  /**
   * Validar nome do evento (GA4 tem restrições)
   */
  validateEventName(eventName) {
    // GA4 permite até 40 caracteres, apenas letras, números e underscore
    const regex = /^[a-zA-Z][a-zA-Z0-9_]{0,39}$/;
    return regex.test(eventName);
  }
}

module.exports = new AnalyticsService();
