const nodemailer = require('nodemailer');

/**
 * Serviço de Email
 * Integração com SMTP (Nodemailer)
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Inicializar transporter do Nodemailer
   */
  initializeTransporter() {
    try {
      if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
        console.warn('Email não configurado - envio de emails desabilitado');
        return;
      }

      this.transporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true', // true para port 465
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      console.log('✅ Email transporter configurado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao configurar email:', error.message);
      this.transporter = null;
    }
  }

  /**
   * Verificar se está configurado
   */
  isConfigured() {
    return !!this.transporter;
  }

  /**
   * Enviar email
   * @param {Object} emailData - Dados do email
   * @returns {Object} Resultado do envio
   */
  async sendEmail(emailData) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Email não configurado');
      }

      const { to, subject, text, html, attachments = [] } = emailData;

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to,
        subject,
        text,
        html,
        attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: info.messageId,
        response: info.response,
      };
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      throw new Error(`Erro ao enviar email: ${error.message}`);
    }
  }

  /**
   * Gerar template HTML base
   */
  getBaseTemplate(content, title = '') {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: #fff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            background: #6B9080;
            color: #fff;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
        }
        .content {
            padding: 30px 20px;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background: #6B9080;
            color: #fff;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }
        .footer {
            background: #f8f8f8;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        .divider {
            height: 1px;
            background: #eee;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Apega Desapega</h1>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Apega Desapega. Todos os direitos reservados.</p>
            <p>
                <a href="${process.env.FRONTEND_URL}/termos" style="color: #6B9080;">Termos de Uso</a> |
                <a href="${process.env.FRONTEND_URL}/privacidade" style="color: #6B9080;">Privacidade</a>
            </p>
        </div>
    </div>
</body>
</html>
    `;
  }

  // ============================================================================
  // TEMPLATES DE EMAIL
  // ============================================================================

  /**
   * Email de boas-vindas
   */
  async sendWelcomeEmail(userEmail, userName) {
    const content = `
      <h2>Bem-vindo(a), ${userName}!</h2>
      <p>Obrigado por se cadastrar no Apega Desapega. Estamos felizes em ter você conosco!</p>
      <p>Aqui você pode comprar e vender roupas de forma prática e sustentável.</p>
      <a href="${process.env.FRONTEND_URL}/explorar" class="button">Começar a Explorar</a>
      <div class="divider"></div>
      <p><strong>Dicas para começar:</strong></p>
      <ul>
        <li>Complete seu perfil para ganhar credibilidade</li>
        <li>Adicione uma foto de perfil</li>
        <li>Configure seu endereço de entrega</li>
      </ul>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: 'Bem-vindo(a) ao Apega Desapega! 👋',
      html: this.getBaseTemplate(content, 'Bem-vindo'),
    });
  }

  /**
   * Email de recuperação de senha
   */
  async sendPasswordResetEmail(userEmail, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const content = `
      <h2>Recuperação de Senha</h2>
      <p>Você solicitou a recuperação de senha da sua conta no Apega Desapega.</p>
      <p>Clique no botão abaixo para criar uma nova senha:</p>
      <a href="${resetUrl}" class="button">Redefinir Senha</a>
      <div class="divider"></div>
      <p><strong>Este link expira em 1 hora.</strong></p>
      <p>Se você não solicitou esta recuperação, ignore este email.</p>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: 'Recuperação de Senha - Apega Desapega',
      html: this.getBaseTemplate(content, 'Recuperação de Senha'),
    });
  }

  /**
   * Email de venda confirmada (vendedora)
   */
  async sendSaleConfirmedEmail(sellerEmail, orderData) {
    const { buyerName, productTitle, amount, orderId } = orderData;

    const content = `
      <h2>🎉 Venda Confirmada!</h2>
      <p>Boa notícia! Você fez uma venda.</p>
      <div class="divider"></div>
      <p><strong>Comprador:</strong> ${buyerName}</p>
      <p><strong>Produto:</strong> ${productTitle}</p>
      <p><strong>Valor:</strong> R$ ${amount}</p>
      <p><strong>Pedido:</strong> #${orderId}</p>
      <div class="divider"></div>
      <p>Próximos passos:</p>
      <ol>
        <li>Embale o produto com cuidado</li>
        <li>Imprima a etiqueta de envio</li>
        <li>Poste o produto nos Correios</li>
      </ol>
      <a href="${process.env.FRONTEND_URL}/vendas/${orderId}" class="button">Ver Detalhes</a>
    `;

    return this.sendEmail({
      to: sellerEmail,
      subject: `Venda Confirmada! ${productTitle}`,
      html: this.getBaseTemplate(content, 'Venda Confirmada'),
    });
  }

  /**
   * Email de compra confirmada (compradora)
   */
  async sendPurchaseConfirmedEmail(buyerEmail, orderData) {
    const { productTitle, amount, orderId, sellerName } = orderData;

    const content = `
      <h2>✅ Compra Confirmada!</h2>
      <p>Seu pedido foi confirmado com sucesso!</p>
      <div class="divider"></div>
      <p><strong>Produto:</strong> ${productTitle}</p>
      <p><strong>Vendedora:</strong> ${sellerName}</p>
      <p><strong>Valor:</strong> R$ ${amount}</p>
      <p><strong>Pedido:</strong> #${orderId}</p>
      <div class="divider"></div>
      <p>Você receberá uma notificação assim que o produto for enviado.</p>
      <a href="${process.env.FRONTEND_URL}/pedidos/${orderId}" class="button">Acompanhar Pedido</a>
    `;

    return this.sendEmail({
      to: buyerEmail,
      subject: `Compra Confirmada! ${productTitle}`,
      html: this.getBaseTemplate(content, 'Compra Confirmada'),
    });
  }

  /**
   * Email de pedido enviado
   */
  async sendOrderShippedEmail(buyerEmail, orderData) {
    const { productTitle, trackingCode, orderId } = orderData;

    const content = `
      <h2>📦 Pedido Enviado!</h2>
      <p>Seu pedido foi enviado!</p>
      <div class="divider"></div>
      <p><strong>Produto:</strong> ${productTitle}</p>
      <p><strong>Código de Rastreamento:</strong> ${trackingCode}</p>
      <div class="divider"></div>
      <p>Você pode acompanhar o status da entrega usando o código acima.</p>
      <a href="${process.env.FRONTEND_URL}/pedidos/${orderId}/rastreamento" class="button">Rastrear Pedido</a>
    `;

    return this.sendEmail({
      to: buyerEmail,
      subject: `Pedido Enviado! ${productTitle}`,
      html: this.getBaseTemplate(content, 'Pedido Enviado'),
    });
  }

  /**
   * Email de pedido entregue
   */
  async sendOrderDeliveredEmail(buyerEmail, orderData) {
    const { productTitle, orderId } = orderData;

    const content = `
      <h2>✨ Pedido Entregue!</h2>
      <p>Seu pedido foi entregue com sucesso!</p>
      <div class="divider"></div>
      <p><strong>Produto:</strong> ${productTitle}</p>
      <div class="divider"></div>
      <p>Esperamos que você esteja satisfeito(a) com sua compra!</p>
      <p>Não esqueça de avaliar a vendedora e o produto.</p>
      <a href="${process.env.FRONTEND_URL}/pedidos/${orderId}/avaliar" class="button">Avaliar Compra</a>
    `;

    return this.sendEmail({
      to: buyerEmail,
      subject: `Pedido Entregue! ${productTitle}`,
      html: this.getBaseTemplate(content, 'Pedido Entregue'),
    });
  }

  /**
   * Email de nova oferta recebida
   */
  async sendNewOfferEmail(sellerEmail, offerData) {
    const { productTitle, offerAmount, buyerName, offerId } = offerData;

    const content = `
      <h2>💰 Nova Oferta Recebida!</h2>
      <p>Você recebeu uma oferta pelo seu produto!</p>
      <div class="divider"></div>
      <p><strong>Produto:</strong> ${productTitle}</p>
      <p><strong>Oferta:</strong> R$ ${offerAmount}</p>
      <p><strong>De:</strong> ${buyerName}</p>
      <div class="divider"></div>
      <p>Você pode aceitar, recusar ou fazer uma contra-oferta.</p>
      <a href="${process.env.FRONTEND_URL}/ofertas/${offerId}" class="button">Ver Oferta</a>
    `;

    return this.sendEmail({
      to: sellerEmail,
      subject: `Nova Oferta: ${productTitle}`,
      html: this.getBaseTemplate(content, 'Nova Oferta'),
    });
  }

  /**
   * Email de oferta aceita
   */
  async sendOfferAcceptedEmail(buyerEmail, offerData) {
    const { productTitle, offerId } = offerData;

    const content = `
      <h2>🎊 Oferta Aceita!</h2>
      <p>Sua oferta foi aceita!</p>
      <div class="divider"></div>
      <p><strong>Produto:</strong> ${productTitle}</p>
      <div class="divider"></div>
      <p>Complete o pagamento para confirmar a compra.</p>
      <a href="${process.env.FRONTEND_URL}/ofertas/${offerId}/checkout" class="button">Finalizar Compra</a>
    `;

    return this.sendEmail({
      to: buyerEmail,
      subject: `Oferta Aceita! ${productTitle}`,
      html: this.getBaseTemplate(content, 'Oferta Aceita'),
    });
  }

  /**
   * Email de saldo liberado
   */
  async sendBalanceReleasedEmail(sellerEmail, balanceData) {
    const { amount, orderId } = balanceData;

    const content = `
      <h2>💵 Saldo Liberado!</h2>
      <p>O saldo da sua venda foi liberado!</p>
      <div class="divider"></div>
      <p><strong>Valor:</strong> R$ ${amount}</p>
      <p><strong>Pedido:</strong> #${orderId}</p>
      <div class="divider"></div>
      <p>O valor está disponível na sua carteira e pode ser sacado.</p>
      <a href="${process.env.FRONTEND_URL}/carteira" class="button">Ver Carteira</a>
    `;

    return this.sendEmail({
      to: sellerEmail,
      subject: 'Saldo Liberado!',
      html: this.getBaseTemplate(content, 'Saldo Liberado'),
    });
  }

  /**
   * Email de saque processado
   */
  async sendWithdrawalProcessedEmail(sellerEmail, withdrawalData) {
    const { amount, method } = withdrawalData;

    const content = `
      <h2>✅ Saque Processado!</h2>
      <p>Seu saque foi processado com sucesso!</p>
      <div class="divider"></div>
      <p><strong>Valor:</strong> R$ ${amount}</p>
      <p><strong>Método:</strong> ${method === 'pix' ? 'PIX' : 'Transferência Bancária'}</p>
      <div class="divider"></div>
      <p>${method === 'pix' ? 'O valor será creditado em até 30 minutos.' : 'O valor será creditado em até 2 dias úteis.'}</p>
    `;

    return this.sendEmail({
      to: sellerEmail,
      subject: 'Saque Processado!',
      html: this.getBaseTemplate(content, 'Saque Processado'),
    });
  }

  /**
   * Email de promoção
   */
  async sendPromotionEmail(userEmail, promotionData) {
    const { title, description, couponCode, imageUrl } = promotionData;

    const content = `
      <h2>🔥 ${title}</h2>
      ${imageUrl ? `<img src="${imageUrl}" alt="${title}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 20px 0;">` : ''}
      <p>${description}</p>
      ${couponCode ? `
        <div style="background: #f8f8f8; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px;">Use o cupom:</p>
          <p style="margin: 10px 0; font-size: 24px; font-weight: bold; color: #6B9080;">${couponCode}</p>
        </div>
      ` : ''}
      <a href="${process.env.FRONTEND_URL}/explorar" class="button">Aproveitar Agora</a>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: title,
      html: this.getBaseTemplate(content, title),
    });
  }
}

module.exports = new EmailService();
