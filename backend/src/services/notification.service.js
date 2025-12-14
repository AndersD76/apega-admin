const admin = require('firebase-admin');

/**
 * Serviço de Notificações Push
 * Integração com Firebase Cloud Messaging (FCM)
 */
class NotificationService {
  constructor() {
    this.initialized = false;
    this.initializeFirebase();
  }

  /**
   * Inicializar Firebase Admin SDK
   */
  initializeFirebase() {
    try {
      if (
        !process.env.FIREBASE_PROJECT_ID ||
        !process.env.FIREBASE_PRIVATE_KEY ||
        !process.env.FIREBASE_CLIENT_EMAIL
      ) {
        console.warn('Firebase não configurado - notificações push desabilitadas');
        return;
      }

      // Decodificar private key (pode estar como string escapada no .env)
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

      const serviceAccount = {
        type: 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: privateKey,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(
          process.env.FIREBASE_CLIENT_EMAIL
        )}`,
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      this.initialized = true;
      console.log('✅ Firebase Admin SDK inicializado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao inicializar Firebase:', error.message);
      this.initialized = false;
    }
  }

  /**
   * Verificar se Firebase está inicializado
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * Enviar notificação para um dispositivo específico
   * @param {string} token - Token FCM do dispositivo
   * @param {Object} notification - Dados da notificação
   * @returns {Object} Resultado do envio
   */
  async sendToDevice(token, notification) {
    try {
      if (!this.initialized) {
        throw new Error('Firebase não inicializado');
      }

      const { title, body, data = {}, imageUrl } = notification;

      const message = {
        token,
        notification: {
          title,
          body,
          ...(imageUrl && { imageUrl }),
        },
        data: {
          ...data,
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);

      return {
        success: true,
        messageId: response,
      };
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      throw new Error(`Erro ao enviar notificação: ${error.message}`);
    }
  }

  /**
   * Enviar notificação para múltiplos dispositivos
   * @param {Array} tokens - Array de tokens FCM
   * @param {Object} notification - Dados da notificação
   * @returns {Object} Resultado do envio
   */
  async sendToMultipleDevices(tokens, notification) {
    try {
      if (!this.initialized) {
        throw new Error('Firebase não inicializado');
      }

      if (!Array.isArray(tokens) || tokens.length === 0) {
        throw new Error('Tokens inválidos');
      }

      const { title, body, data = {}, imageUrl } = notification;

      const message = {
        notification: {
          title,
          body,
          ...(imageUrl && { imageUrl }),
        },
        data: {
          ...data,
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        ...message,
      });

      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses,
      };
    } catch (error) {
      console.error('Erro ao enviar notificações:', error);
      throw new Error(`Erro ao enviar notificações: ${error.message}`);
    }
  }

  /**
   * Enviar notificação para um tópico
   * @param {string} topic - Nome do tópico
   * @param {Object} notification - Dados da notificação
   * @returns {Object} Resultado do envio
   */
  async sendToTopic(topic, notification) {
    try {
      if (!this.initialized) {
        throw new Error('Firebase não inicializado');
      }

      const { title, body, data = {}, imageUrl } = notification;

      const message = {
        topic,
        notification: {
          title,
          body,
          ...(imageUrl && { imageUrl }),
        },
        data: {
          ...data,
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);

      return {
        success: true,
        messageId: response,
      };
    } catch (error) {
      console.error('Erro ao enviar notificação para tópico:', error);
      throw new Error(`Erro ao enviar notificação: ${error.message}`);
    }
  }

  /**
   * Inscrever dispositivo em um tópico
   * @param {string|Array} tokens - Token(s) FCM do(s) dispositivo(s)
   * @param {string} topic - Nome do tópico
   * @returns {Object} Resultado da inscrição
   */
  async subscribeToTopic(tokens, topic) {
    try {
      if (!this.initialized) {
        throw new Error('Firebase não inicializado');
      }

      const tokenArray = Array.isArray(tokens) ? tokens : [tokens];
      const response = await admin.messaging().subscribeToTopic(tokenArray, topic);

      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      console.error('Erro ao inscrever em tópico:', error);
      throw new Error(`Erro ao inscrever em tópico: ${error.message}`);
    }
  }

  /**
   * Desinscrever dispositivo de um tópico
   * @param {string|Array} tokens - Token(s) FCM do(s) dispositivo(s)
   * @param {string} topic - Nome do tópico
   * @returns {Object} Resultado da desinscrição
   */
  async unsubscribeFromTopic(tokens, topic) {
    try {
      if (!this.initialized) {
        throw new Error('Firebase não inicializado');
      }

      const tokenArray = Array.isArray(tokens) ? tokens : [tokens];
      const response = await admin.messaging().unsubscribeFromTopic(tokenArray, topic);

      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      console.error('Erro ao desinscrever de tópico:', error);
      throw new Error(`Erro ao desinscrever de tópico: ${error.message}`);
    }
  }

  // ============================================================================
  // TEMPLATES DE NOTIFICAÇÃO
  // ============================================================================

  /**
   * Notificação de nova mensagem
   */
  async sendNewMessageNotification(token, senderName, messagePreview) {
    return this.sendToDevice(token, {
      title: `Nova mensagem de ${senderName}`,
      body: messagePreview,
      data: {
        type: 'new_message',
        sender: senderName,
      },
    });
  }

  /**
   * Notificação de venda confirmada
   */
  async sendSaleConfirmedNotification(token, productTitle, buyerName, amount) {
    return this.sendToDevice(token, {
      title: '🎉 Venda confirmada!',
      body: `${buyerName} comprou ${productTitle} por R$ ${amount}`,
      data: {
        type: 'sale_confirmed',
        product: productTitle,
      },
    });
  }

  /**
   * Notificação de compra confirmada
   */
  async sendPurchaseConfirmedNotification(token, productTitle, amount) {
    return this.sendToDevice(token, {
      title: '✅ Compra confirmada!',
      body: `Sua compra de ${productTitle} foi confirmada. Total: R$ ${amount}`,
      data: {
        type: 'purchase_confirmed',
        product: productTitle,
      },
    });
  }

  /**
   * Notificação de pedido enviado
   */
  async sendOrderShippedNotification(token, trackingCode) {
    return this.sendToDevice(token, {
      title: '📦 Pedido enviado!',
      body: `Seu pedido foi enviado. Código de rastreamento: ${trackingCode}`,
      data: {
        type: 'order_shipped',
        tracking_code: trackingCode,
      },
    });
  }

  /**
   * Notificação de pedido entregue
   */
  async sendOrderDeliveredNotification(token, productTitle) {
    return this.sendToDevice(token, {
      title: '✨ Pedido entregue!',
      body: `${productTitle} foi entregue. Não esqueça de avaliar!`,
      data: {
        type: 'order_delivered',
        product: productTitle,
      },
    });
  }

  /**
   * Notificação de nova oferta
   */
  async sendNewOfferNotification(token, productTitle, offerAmount) {
    return this.sendToDevice(token, {
      title: '💰 Nova oferta recebida!',
      body: `Alguém ofereceu R$ ${offerAmount} por ${productTitle}`,
      data: {
        type: 'new_offer',
        product: productTitle,
        amount: String(offerAmount),
      },
    });
  }

  /**
   * Notificação de oferta aceita
   */
  async sendOfferAcceptedNotification(token, productTitle) {
    return this.sendToDevice(token, {
      title: '🎊 Oferta aceita!',
      body: `Sua oferta por ${productTitle} foi aceita!`,
      data: {
        type: 'offer_accepted',
        product: productTitle,
      },
    });
  }

  /**
   * Notificação de disputa aberta
   */
  async sendDisputeOpenedNotification(token, orderId, reason) {
    return this.sendToDevice(token, {
      title: '⚠️ Disputa aberta',
      body: `Uma disputa foi aberta no pedido #${orderId}. Motivo: ${reason}`,
      data: {
        type: 'dispute_opened',
        order_id: orderId,
      },
    });
  }

  /**
   * Notificação de saldo liberado
   */
  async sendBalanceReleasedNotification(token, amount) {
    return this.sendToDevice(token, {
      title: '💵 Saldo liberado!',
      body: `R$ ${amount} foi liberado na sua carteira`,
      data: {
        type: 'balance_released',
        amount: String(amount),
      },
    });
  }

  /**
   * Notificação de promoção
   */
  async sendPromotionNotification(token, title, description, imageUrl = null) {
    return this.sendToDevice(token, {
      title: `🔥 ${title}`,
      body: description,
      imageUrl,
      data: {
        type: 'promotion',
      },
    });
  }
}

module.exports = new NotificationService();
