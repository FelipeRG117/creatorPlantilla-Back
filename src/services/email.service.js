/**
 * Email Service
 *
 * Handles email sending using Nodemailer
 * Supports multiple email providers (Gmail, SendGrid, etc.)
 */

import nodemailer from 'nodemailer';
import { logger } from '../config/logger.js';
import {
  generateOrderConfirmationEmail,
  generateOrderConfirmationText,
} from '../templates/email.orderConfirmation.js';

/**
 * Create email transporter
 * Supports Gmail, SendGrid, or any SMTP service
 */
const createTransporter = () => {
  // Check if we're using Gmail
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD, // App password, not regular password
      },
    });
  }

  // Check if we're using SendGrid
  if (process.env.EMAIL_SERVICE === 'sendgrid') {
    return nodemailer.createTransporter({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }

  // Generic SMTP configuration
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  // Development mode - use Ethereal (fake SMTP for testing)
  if (process.env.NODE_ENV === 'development') {
    logger.warn('No email service configured. Using development mode.');
    // In development, we'll create a test account on first use
    return null;
  }

  throw new Error('No email service configured. Please set EMAIL_SERVICE or SMTP_HOST in .env');
};

let transporter = null;

/**
 * Get or create email transporter
 */
const getTransporter = async () => {
  if (transporter) {
    return transporter;
  }

  try {
    transporter = createTransporter();

    // If no transporter in development, create Ethereal test account
    if (!transporter && process.env.NODE_ENV === 'development') {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransporter({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      logger.info('Using Ethereal test email account', {
        user: testAccount.user,
        previewUrl: 'https://ethereal.email/messages',
      });
    }

    // Verify transporter configuration
    if (transporter) {
      await transporter.verify();
      logger.info('Email transporter configured successfully');
    }

    return transporter;
  } catch (error) {
    logger.error('Error creating email transporter', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Send email
 *
 * @param {Object} mailOptions - Email options (to, subject, html, text)
 * @returns {Promise<Object>} Send result
 */
export const sendEmail = async (mailOptions) => {
  try {
    const transport = await getTransporter();

    if (!transport) {
      throw new Error('Email transporter not available');
    }

    // Format: "Name <email@example.com>"
    const defaultFrom = `Mariachi Web <${process.env.EMAIL_FROM || 'noreply@mariachiWeb.com'}>`;

    const options = {
      from: defaultFrom,
      ...mailOptions,
    };

    const info = await transport.sendMail(options);

    // Log preview URL for Ethereal (development)
    if (process.env.NODE_ENV === 'development' && info.messageId) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        logger.info('Email sent in development mode', {
          messageId: info.messageId,
          previewUrl,
        });
        console.log('\n📧 Preview email: %s\n', previewUrl);
      }
    }

    logger.info('Email sent successfully', {
      to: mailOptions.to,
      subject: mailOptions.subject,
      messageId: info.messageId,
    });

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info),
    };
  } catch (error) {
    logger.error('Error sending email', {
      error: error.message,
      to: mailOptions.to,
      subject: mailOptions.subject,
    });

    throw error;
  }
};

/**
 * Send order confirmation email
 *
 * @param {Object} order - Order document from MongoDB
 * @returns {Promise<Object>} Send result
 */
export const sendOrderConfirmationEmail = async (order) => {
  try {
    const orderData = {
      orderNumber: order.orderNumber,
      customerEmail: order.customer.email,
      items: order.items,
      pricing: order.pricing,
      shippingAddress: order.shippingAddress,
      createdAt: order.createdAt,
    };

    const htmlContent = generateOrderConfirmationEmail(orderData);
    const textContent = generateOrderConfirmationText(orderData);

    const mailOptions = {
      to: order.customer.email,
      subject: `Confirmación de Pedido #${order.orderNumber} - Mariachi Web`,
      html: htmlContent,
      text: textContent,
    };

    const result = await sendEmail(mailOptions);

    logger.info('Order confirmation email sent', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      customerEmail: order.customer.email,
      messageId: result.messageId,
    });

    return result;
  } catch (error) {
    logger.error('Error sending order confirmation email', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      error: error.message,
    });

    // Don't throw - we don't want to fail order creation if email fails
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send order shipped notification
 *
 * @param {Object} order - Order document
 * @param {String} trackingNumber - Shipping tracking number
 * @returns {Promise<Object>} Send result
 */
export const sendOrderShippedEmail = async (order, trackingNumber) => {
  try {
    const mailOptions = {
      to: order.customer.email,
      subject: `Tu Pedido #${order.orderNumber} Ha Sido Enviado - Mariachi Web`,
      html: `
        <h1>¡Tu pedido está en camino!</h1>
        <p>Hola,</p>
        <p>Tu pedido #${order.orderNumber} ha sido enviado.</p>
        ${trackingNumber ? `<p>Número de rastreo: <strong>${trackingNumber}</strong></p>` : ''}
        <p>Recibirás tu pedido en 3-7 días hábiles.</p>
        <p>Gracias por tu compra.</p>
      `,
      text: `
Tu pedido #${order.orderNumber} ha sido enviado.
${trackingNumber ? `Número de rastreo: ${trackingNumber}` : ''}
Recibirás tu pedido en 3-7 días hábiles.
      `,
    };

    return await sendEmail(mailOptions);
  } catch (error) {
    logger.error('Error sending shipped email', {
      orderId: order._id,
      error: error.message,
    });

    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send order cancelled notification
 *
 * @param {Object} order - Order document
 * @param {String} reason - Cancellation reason
 * @returns {Promise<Object>} Send result
 */
export const sendOrderCancelledEmail = async (order, reason) => {
  try {
    const mailOptions = {
      to: order.customer.email,
      subject: `Pedido #${order.orderNumber} Cancelado - Mariachi Web`,
      html: `
        <h1>Pedido Cancelado</h1>
        <p>Hola,</p>
        <p>Tu pedido #${order.orderNumber} ha sido cancelado.</p>
        ${reason ? `<p>Razón: ${reason}</p>` : ''}
        <p>Si el pago fue procesado, será reembolsado en 5-10 días hábiles.</p>
        <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
      `,
      text: `
Pedido #${order.orderNumber} cancelado.
${reason ? `Razón: ${reason}` : ''}
Si el pago fue procesado, será reembolsado en 5-10 días hábiles.
      `,
    };

    return await sendEmail(mailOptions);
  } catch (error) {
    logger.error('Error sending cancelled email', {
      orderId: order._id,
      error: error.message,
    });

    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send low stock alert to admin
 *
 * @param {Array} lowStockItems - Array of products with low stock
 * @returns {Promise<Object>} Send result
 */
export const sendLowStockAlert = async (lowStockItems) => {
  try {
    if (!process.env.ADMIN_EMAIL) {
      logger.warn('No ADMIN_EMAIL configured for low stock alerts');
      return { success: false, error: 'No admin email configured' };
    }

    const itemsList = lowStockItems
      .map(
        (item) => `
      - ${item.productName} (${item.variantSku}): ${item.currentStock} unidades
        Umbral: ${item.threshold}
    `
      )
      .join('\n');

    const mailOptions = {
      to: process.env.ADMIN_EMAIL,
      subject: `⚠️ Alerta de Stock Bajo - ${lowStockItems.length} Productos`,
      html: `
        <h2>Alerta de Stock Bajo</h2>
        <p>Los siguientes productos tienen stock bajo:</p>
        <pre>${itemsList}</pre>
        <p>Por favor, considere reabastecer estos productos.</p>
      `,
      text: `
Alerta de Stock Bajo

Los siguientes productos tienen stock bajo:
${itemsList}

Por favor, considere reabastecer estos productos.
      `,
    };

    return await sendEmail(mailOptions);
  } catch (error) {
    logger.error('Error sending low stock alert', {
      error: error.message,
    });

    return {
      success: false,
      error: error.message,
    };
  }
};

export default {
  sendEmail,
  sendOrderConfirmationEmail,
  sendOrderShippedEmail,
  sendOrderCancelledEmail,
  sendLowStockAlert,
};
