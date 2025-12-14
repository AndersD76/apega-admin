const axios = require('axios');

/**
 * Serviço de Logística e Envio
 * Integração com Melhor Envio
 */
class ShippingService {
  constructor() {
    this.baseUrl = process.env.MELHOR_ENVIO_SANDBOX === 'true'
      ? 'https://sandbox.melhorenvio.com.br/api/v2'
      : 'https://melhorenvio.com.br/api/v2';

    this.accessToken = process.env.MELHOR_ENVIO_ACCESS_TOKEN;
    this.clientId = process.env.MELHOR_ENVIO_CLIENT_ID;
    this.clientSecret = process.env.MELHOR_ENVIO_CLIENT_SECRET;
  }

  /**
   * Verificar se está configurado
   */
  isConfigured() {
    return !!(this.accessToken || (this.clientId && this.clientSecret));
  }

  /**
   * Obter headers para requisições
   */
  getHeaders() {
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.accessToken}`,
      'User-Agent': 'Apega Desapega (contato@apegadesapega.com.br)',
    };
  }

  // ============================================================================
  // AUTENTICAÇÃO OAUTH2
  // ============================================================================

  /**
   * Obter URL de autorização OAuth2
   * @returns {string} URL para autorização
   */
  getAuthorizationUrl() {
    const redirectUri = process.env.MELHOR_ENVIO_REDIRECT_URI;
    const scope = 'cart-read cart-write companies-read companies-write coupons-read coupons-write notifications-read orders-read products-read products-write purchases-read shipping-calculate shipping-cancel shipping-checkout shipping-companies shipping-generate shipping-preview shipping-print shipping-share shipping-tracking ecommerce-shipping transactions-read';

    return `https://melhorenvio.com.br/oauth/authorize?client_id=${this.clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${encodeURIComponent(scope)}`;
  }

  /**
   * Trocar código de autorização por token de acesso
   * @param {string} code - Código de autorização
   * @returns {Object} Access token e refresh token
   */
  async exchangeCodeForToken(code) {
    try {
      const response = await axios.post('https://melhorenvio.com.br/oauth/token', {
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        redirect_uri: process.env.MELHOR_ENVIO_REDIRECT_URI,
      });

      return {
        success: true,
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
        tokenType: response.data.token_type,
      };
    } catch (error) {
      console.error('Erro ao trocar código por token:', error);
      throw new Error(`Erro na autenticação: ${error.message}`);
    }
  }

  /**
   * Renovar access token usando refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Object} Novo access token
   */
  async refreshAccessToken(refreshToken) {
    try {
      const response = await axios.post('https://melhorenvio.com.br/oauth/token', {
        grant_type: 'refresh_token',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
      });

      return {
        success: true,
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
      };
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      throw new Error(`Erro ao renovar token: ${error.message}`);
    }
  }

  // ============================================================================
  // CÁLCULO DE FRETE
  // ============================================================================

  /**
   * Calcular frete
   * @param {Object} shippingData - Dados para cálculo
   * @returns {Array} Opções de frete disponíveis
   */
  async calculateShipping(shippingData) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Melhor Envio não configurado');
      }

      const {
        from, // { postal_code }
        to, // { postal_code }
        products, // [{ id, width, height, length, weight, insurance_value, quantity }]
      } = shippingData;

      const payload = {
        from: {
          postal_code: from.postal_code.replace(/\D/g, ''),
        },
        to: {
          postal_code: to.postal_code.replace(/\D/g, ''),
        },
        products: products.map(p => ({
          id: p.id,
          width: p.width,
          height: p.height,
          length: p.length,
          weight: p.weight,
          insurance_value: p.insurance_value || p.price,
          quantity: p.quantity || 1,
        })),
      };

      const response = await axios.post(
        `${this.baseUrl}/me/shipment/calculate`,
        payload,
        { headers: this.getHeaders() }
      );

      return response.data.map(option => ({
        id: option.id,
        name: option.name,
        company: {
          id: option.company.id,
          name: option.company.name,
          picture: option.company.picture,
        },
        price: parseFloat(option.price),
        discountPrice: parseFloat(option.discount),
        currency: option.currency,
        deliveryTime: option.delivery_time,
        deliveryRange: {
          min: option.delivery_range.min,
          max: option.delivery_range.max,
        },
        customPrice: parseFloat(option.custom_price),
        customDeliveryTime: option.custom_delivery_time,
        packages: option.packages,
      }));
    } catch (error) {
      console.error('Erro ao calcular frete:', error.response?.data || error);
      throw new Error(`Erro ao calcular frete: ${error.message}`);
    }
  }

  // ============================================================================
  // CARRINHO (CART)
  // ============================================================================

  /**
   * Adicionar envio ao carrinho
   * @param {Object} orderData - Dados do pedido
   * @returns {Object} Item do carrinho
   */
  async addToCart(orderData) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Melhor Envio não configurado');
      }

      const {
        service, // ID do serviço (ex: 1 = PAC, 2 = SEDEX)
        from, // { name, phone, email, document, address, complement, number, district, city, state_abbr, postal_code }
        to, // { name, phone, email, document, address, complement, number, district, city, state_abbr, postal_code }
        products, // [{ name, quantity, unitary_value }]
        volumes, // [{ height, width, length, weight }]
        options, // { insurance_value, receipt, own_hand, collect }
      } = orderData;

      const payload = {
        service: service,
        from: {
          name: from.name,
          phone: from.phone,
          email: from.email,
          document: from.document.replace(/\D/g, ''),
          address: from.address,
          complement: from.complement || '',
          number: from.number,
          district: from.district,
          city: from.city,
          state_abbr: from.state_abbr,
          postal_code: from.postal_code.replace(/\D/g, ''),
        },
        to: {
          name: to.name,
          phone: to.phone,
          email: to.email,
          document: to.document.replace(/\D/g, ''),
          address: to.address,
          complement: to.complement || '',
          number: to.number,
          district: to.district,
          city: to.city,
          state_abbr: to.state_abbr,
          postal_code: to.postal_code.replace(/\D/g, ''),
        },
        products: products,
        volumes: volumes,
        options: {
          insurance_value: options?.insurance_value || 0,
          receipt: options?.receipt || false,
          own_hand: options?.own_hand || false,
          collect: options?.collect || false,
        },
      };

      const response = await axios.post(
        `${this.baseUrl}/me/cart`,
        payload,
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        cartItemId: response.data.id,
        data: response.data,
      };
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error.response?.data || error);
      throw new Error(`Erro ao adicionar ao carrinho: ${error.message}`);
    }
  }

  /**
   * Fazer checkout do carrinho
   * @param {string} orderId - ID do pedido no carrinho
   * @returns {Object} Informações da compra
   */
  async checkout(orderId) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Melhor Envio não configurado');
      }

      const response = await axios.post(
        `${this.baseUrl}/me/shipment/checkout`,
        { orders: [orderId] },
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        purchase: response.data.purchase,
      };
    } catch (error) {
      console.error('Erro no checkout:', error.response?.data || error);
      throw new Error(`Erro no checkout: ${error.message}`);
    }
  }

  /**
   * Gerar etiqueta de envio
   * @param {Array} orderIds - IDs dos pedidos
   * @returns {Object} Informações das etiquetas
   */
  async generateLabel(orderIds) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Melhor Envio não configurado');
      }

      const response = await axios.post(
        `${this.baseUrl}/me/shipment/generate`,
        { orders: orderIds },
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        labels: response.data,
      };
    } catch (error) {
      console.error('Erro ao gerar etiqueta:', error.response?.data || error);
      throw new Error(`Erro ao gerar etiqueta: ${error.message}`);
    }
  }

  /**
   * Imprimir etiqueta
   * @param {Array} orderIds - IDs dos pedidos
   * @param {string} mode - Modo de impressão (private ou public)
   * @returns {Object} URL do PDF
   */
  async printLabel(orderIds, mode = 'private') {
    try {
      if (!this.isConfigured()) {
        throw new Error('Melhor Envio não configurado');
      }

      const response = await axios.post(
        `${this.baseUrl}/me/shipment/print`,
        {
          mode: mode,
          orders: orderIds,
        },
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        url: response.data.url,
      };
    } catch (error) {
      console.error('Erro ao imprimir etiqueta:', error.response?.data || error);
      throw new Error(`Erro ao imprimir etiqueta: ${error.message}`);
    }
  }

  // ============================================================================
  // RASTREAMENTO
  // ============================================================================

  /**
   * Rastrear envio
   * @param {Array} orderIds - IDs dos pedidos
   * @returns {Array} Informações de rastreamento
   */
  async trackShipment(orderIds) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Melhor Envio não configurado');
      }

      const ordersParam = orderIds.join(',');
      const response = await axios.get(
        `${this.baseUrl}/me/orders?orders=${ordersParam}`,
        { headers: this.getHeaders() }
      );

      return response.data.data.map(order => ({
        id: order.id,
        protocol: order.protocol,
        status: order.status,
        tracking: order.tracking,
        createdAt: order.created_at,
        paidAt: order.paid_at,
        generatedAt: order.generated_at,
        postedAt: order.posted_at,
        deliveredAt: order.delivered_at,
      }));
    } catch (error) {
      console.error('Erro ao rastrear envio:', error.response?.data || error);
      throw new Error(`Erro ao rastrear envio: ${error.message}`);
    }
  }

  /**
   * Cancelar envio
   * @param {string} orderId - ID do pedido
   * @returns {Object} Confirmação do cancelamento
   */
  async cancelShipment(orderId) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Melhor Envio não configurado');
      }

      const response = await axios.post(
        `${this.baseUrl}/me/shipment/cancel`,
        { order: { id: orderId } },
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        message: 'Envio cancelado com sucesso',
        data: response.data,
      };
    } catch (error) {
      console.error('Erro ao cancelar envio:', error.response?.data || error);
      throw new Error(`Erro ao cancelar envio: ${error.message}`);
    }
  }

  // ============================================================================
  // TRANSPORTADORAS
  // ============================================================================

  /**
   * Listar transportadoras disponíveis
   * @returns {Array} Lista de transportadoras
   */
  async getCompanies() {
    try {
      if (!this.isConfigured()) {
        throw new Error('Melhor Envio não configurado');
      }

      const response = await axios.get(
        `${this.baseUrl}/me/shipment/companies`,
        { headers: this.getHeaders() }
      );

      return response.data.map(company => ({
        id: company.id,
        name: company.name,
        picture: company.picture,
      }));
    } catch (error) {
      console.error('Erro ao listar transportadoras:', error);
      throw new Error(`Erro ao listar transportadoras: ${error.message}`);
    }
  }

  /**
   * Listar serviços disponíveis
   * @returns {Array} Lista de serviços
   */
  async getServices() {
    try {
      if (!this.isConfigured()) {
        throw new Error('Melhor Envio não configurado');
      }

      const response = await axios.get(
        `${this.baseUrl}/me/shipment/services`,
        { headers: this.getHeaders() }
      );

      return response.data.map(service => ({
        id: service.id,
        name: service.name,
        company: {
          id: service.company.id,
          name: service.company.name,
        },
      }));
    } catch (error) {
      console.error('Erro ao listar serviços:', error);
      throw new Error(`Erro ao listar serviços: ${error.message}`);
    }
  }
}

module.exports = new ShippingService();
