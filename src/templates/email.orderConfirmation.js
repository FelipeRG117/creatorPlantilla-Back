/**
 * Order Confirmation Email Template
 *
 * Professional HTML email template for order confirmations
 */

/**
 * Generate order confirmation email HTML
 *
 * @param {Object} orderData - Order data for email
 * @returns {String} HTML email content
 */
export const generateOrderConfirmationEmail = (orderData) => {
  const {
    orderNumber,
    customerEmail,
    items,
    pricing,
    shippingAddress,
    createdAt,
  } = orderData;

  const formattedDate = new Date(createdAt).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const itemsHtml = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 15px; border-bottom: 1px solid #e5e5e5;">
        <div style="display: flex; align-items: center;">
          <div style="flex: 1;">
            <h3 style="margin: 0 0 5px 0; font-size: 16px; color: #1a1a1a;">
              ${item.productSnapshot.name}
            </h3>
            <p style="margin: 0; font-size: 14px; color: #666;">
              ${item.variant.name || ''}
              ${item.variant.attributes?.size ? `• Talla: ${item.variant.attributes.size}` : ''}
              ${item.variant.attributes?.color ? `• Color: ${item.variant.attributes.color}` : ''}
            </p>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #999;">
              SKU: ${item.variant.sku}
            </p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0 0 5px 0; font-size: 14px; color: #666;">
              Cantidad: ${item.quantity}
            </p>
            <p style="margin: 0; font-size: 16px; font-weight: 600; color: #1a1a1a;">
              $${item.totalPrice.toFixed(2)} MXN
            </p>
          </div>
        </div>
      </td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de Pedido - ${orderNumber}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #d4a574; font-size: 28px; font-weight: 300; letter-spacing: 2px;">
                MARIACHI WEB
              </h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 14px; letter-spacing: 1px;">
                Luis Carlos Gago
              </p>
            </td>
          </tr>

          <!-- Success Message -->
          <tr>
            <td style="padding: 40px 30px; text-align: center; border-bottom: 1px solid #e5e5e5;">
              <div style="width: 60px; height: 60px; background-color: #10b981; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <h2 style="margin: 0 0 10px 0; font-size: 24px; color: #1a1a1a; font-weight: 600;">
                ¡Pedido Confirmado!
              </h2>
              <p style="margin: 0; font-size: 16px; color: #666; line-height: 1.6;">
                Gracias por tu compra. Tu pedido ha sido recibido y está siendo procesado.
              </p>
            </td>
          </tr>

          <!-- Order Details -->
          <tr>
            <td style="padding: 30px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom: 20px;">
                    <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #1a1a1a; font-weight: 600;">
                      Detalles del Pedido
                    </h3>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9f9f9; border-radius: 6px; padding: 15px;">
                      <tr>
                        <td style="padding: 8px 0;">
                          <strong style="color: #1a1a1a;">Número de Pedido:</strong>
                        </td>
                        <td align="right" style="padding: 8px 0;">
                          <span style="color: #d4a574; font-weight: 600;">${orderNumber}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <strong style="color: #1a1a1a;">Fecha:</strong>
                        </td>
                        <td align="right" style="padding: 8px 0;">
                          <span style="color: #666;">${formattedDate}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <strong style="color: #1a1a1a;">Email:</strong>
                        </td>
                        <td align="right" style="padding: 8px 0;">
                          <span style="color: #666;">${customerEmail}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #1a1a1a; font-weight: 600;">
                Productos
              </h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e5e5; border-radius: 6px; overflow: hidden;">
                ${itemsHtml}
              </table>
            </td>
          </tr>

          <!-- Pricing Summary -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9f9f9; border-radius: 6px; padding: 20px;">
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #666;">Subtotal:</span>
                  </td>
                  <td align="right" style="padding: 8px 0;">
                    <span style="color: #1a1a1a;">$${pricing.subtotal.toFixed(2)} MXN</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #666;">IVA (${(pricing.taxRate * 100).toFixed(0)}%):</span>
                  </td>
                  <td align="right" style="padding: 8px 0;">
                    <span style="color: #1a1a1a;">$${pricing.tax.toFixed(2)} MXN</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #666;">Envío:</span>
                  </td>
                  <td align="right" style="padding: 8px 0;">
                    <span style="color: #1a1a1a;">
                      ${pricing.shipping === 0 ? 'GRATIS' : `$${pricing.shipping.toFixed(2)} MXN`}
                    </span>
                  </td>
                </tr>
                ${
                  pricing.discount > 0
                    ? `
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #10b981;">Descuento:</span>
                  </td>
                  <td align="right" style="padding: 8px 0;">
                    <span style="color: #10b981;">-$${pricing.discount.toFixed(2)} MXN</span>
                  </td>
                </tr>
                `
                    : ''
                }
                <tr style="border-top: 2px solid #d4a574;">
                  <td style="padding: 15px 0 0 0;">
                    <strong style="font-size: 18px; color: #1a1a1a;">Total:</strong>
                  </td>
                  <td align="right" style="padding: 15px 0 0 0;">
                    <strong style="font-size: 20px; color: #d4a574;">$${pricing.total.toFixed(2)} MXN</strong>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Shipping Address -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #1a1a1a; font-weight: 600;">
                Dirección de Envío
              </h3>
              <div style="background-color: #f9f9f9; border-radius: 6px; padding: 20px;">
                <p style="margin: 0; line-height: 1.6; color: #666;">
                  <strong style="color: #1a1a1a;">${shippingAddress.firstName} ${shippingAddress.lastName}</strong><br>
                  ${shippingAddress.address}${shippingAddress.apartment ? `, ${shippingAddress.apartment}` : ''}<br>
                  ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}<br>
                  ${shippingAddress.country}<br>
                  Tel: ${shippingAddress.phone}
                </p>
              </div>
            </td>
          </tr>

          <!-- Next Steps -->
          <tr>
            <td style="padding: 0 30px 40px 30px;">
              <div style="background-color: #fffbf5; border-left: 4px solid #d4a574; padding: 20px; border-radius: 6px;">
                <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #1a1a1a; font-weight: 600;">
                  Próximos Pasos
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #666; line-height: 1.8;">
                  <li>Procesaremos tu pedido en las próximas 24 horas</li>
                  <li>Recibirás un email cuando tu pedido sea enviado</li>
                  <li>El tiempo estimado de entrega es de 3-7 días hábiles</li>
                </ul>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1a1a1a; padding: 30px; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #d4a574; font-size: 14px;">
                ¿Necesitas ayuda?
              </p>
              <p style="margin: 0; color: #999; font-size: 12px; line-height: 1.6;">
                Si tienes alguna pregunta sobre tu pedido, no dudes en contactarnos.<br>
                Este es un correo automático, por favor no respondas a este mensaje.
              </p>
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #333;">
                <p style="margin: 0; color: #666; font-size: 11px;">
                  © 2025 Mariachi Web - Luis Carlos Gago. Todos los derechos reservados.
                </p>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

/**
 * Generate plain text version for email clients that don't support HTML
 *
 * @param {Object} orderData - Order data for email
 * @returns {String} Plain text email content
 */
export const generateOrderConfirmationText = (orderData) => {
  const {
    orderNumber,
    customerEmail,
    items,
    pricing,
    shippingAddress,
    createdAt,
  } = orderData;

  const formattedDate = new Date(createdAt).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const itemsText = items
    .map(
      (item) => `
${item.productSnapshot.name}
${item.variant.name || ''} ${item.variant.attributes?.size ? `• Talla: ${item.variant.attributes.size}` : ''} ${item.variant.attributes?.color ? `• Color: ${item.variant.attributes.color}` : ''}
SKU: ${item.variant.sku}
Cantidad: ${item.quantity} x $${item.unitPrice.toFixed(2)} = $${item.totalPrice.toFixed(2)} MXN
`
    )
    .join('\n---\n');

  return `
╔════════════════════════════════════════════╗
║        ¡PEDIDO CONFIRMADO!                 ║
╚════════════════════════════════════════════╝

Gracias por tu compra. Tu pedido ha sido recibido y está siendo procesado.

DETALLES DEL PEDIDO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Número de Pedido: ${orderNumber}
Fecha: ${formattedDate}
Email: ${customerEmail}

PRODUCTOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${itemsText}

RESUMEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Subtotal:        $${pricing.subtotal.toFixed(2)} MXN
IVA (${(pricing.taxRate * 100).toFixed(0)}%):          $${pricing.tax.toFixed(2)} MXN
Envío:           ${pricing.shipping === 0 ? 'GRATIS' : `$${pricing.shipping.toFixed(2)} MXN`}
${pricing.discount > 0 ? `Descuento:       -$${pricing.discount.toFixed(2)} MXN\n` : ''}
-------------------------------------------
TOTAL:           $${pricing.total.toFixed(2)} MXN

DIRECCIÓN DE ENVÍO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${shippingAddress.firstName} ${shippingAddress.lastName}
${shippingAddress.address}${shippingAddress.apartment ? `, ${shippingAddress.apartment}` : ''}
${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}
${shippingAddress.country}
Tel: ${shippingAddress.phone}

PRÓXIMOS PASOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Procesaremos tu pedido en las próximas 24 horas
• Recibirás un email cuando tu pedido sea enviado
• El tiempo estimado de entrega es de 3-7 días hábiles

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
© 2025 Mariachi Web - Luis Carlos Gago
Todos los derechos reservados.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `;
};
