/**
 * Stripe Payment Controller
 *
 * Handles Stripe checkout sessions and payment processing
 */

import Stripe from 'stripe';
import { logger } from '../config/logger.js';
import Order from '../models/model.order.js';
import Product from '../models/model.product.js';
import { decreaseStock, validateStock } from '../services/inventory.service.js';
import { sendOrderConfirmationEmail } from '../services/email.service.js';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

/**
 * Create Stripe Checkout Session
 *
 * @route   POST /api/stripe/create-checkout-session
 * @access  Public
 */
export const createCheckoutSession = async (req, res) => {
  try {
    const { items, customerEmail, metadata = {} } = req.body;

    // Validate request
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Items array is required and must not be empty',
      });
    }

    // Validate stock availability before creating checkout session
    const stockValidation = await validateStock(items);

    if (!stockValidation.isValid) {
      logger.warn('Stock validation failed for checkout', {
        outOfStock: stockValidation.outOfStock,
        insufficientStock: stockValidation.insufficientStock,
      });

      return res.status(400).json({
        success: false,
        error: 'Stock validation failed',
        data: {
          outOfStock: stockValidation.outOfStock,
          insufficientStock: stockValidation.insufficientStock,
        },
      });
    }

    // Transform cart items to Stripe line items
    const lineItems = items.map((item) => {
      const { product, quantity } = item;

      // Get price from first active variant
      const activeVariant = product.variants.find(v => v.isActive);
      if (!activeVariant) {
        throw new Error(`Product ${product.name} has no active variant`);
      }

      const priceInCents = Math.round(
        (activeVariant.pricing.salePrice || activeVariant.pricing.basePrice) * 100
      );

      return {
        price_data: {
          currency: 'mxn',
          product_data: {
            name: product.name,
            description: product.shortDescription || product.description?.substring(0, 100),
            images: product.images[0]?.url ? [product.images[0].url] : [],
            metadata: {
              productId: product._id,
              variantId: activeVariant._id || '',
              sku: activeVariant.sku,
            },
          },
          unit_amount: priceInCents,
        },
        quantity: quantity,
      };
    });

    // Calculate totals for metadata
    const subtotal = items.reduce((sum, item) => {
      const activeVariant = item.product.variants.find(v => v.isActive);
      const price = activeVariant.pricing.salePrice || activeVariant.pricing.basePrice;
      return sum + (price * item.quantity);
    }, 0);

    const tax = subtotal * 0.16; // 16% IVA
    const shipping = subtotal >= 1000 ? 0 : 150;
    const total = subtotal + tax + shipping;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
      customer_email: customerEmail,

      // Add shipping cost if applicable
      ...(shipping > 0 && {
        shipping_options: [
          {
            shipping_rate_data: {
              type: 'fixed_amount',
              fixed_amount: {
                amount: shipping * 100, // Convert to cents
                currency: 'mxn',
              },
              display_name: 'Envío estándar',
              delivery_estimate: {
                minimum: {
                  unit: 'business_day',
                  value: 3,
                },
                maximum: {
                  unit: 'business_day',
                  value: 7,
                },
              },
            },
          },
        ],
      }),

      // Metadata for webhook processing
      metadata: {
        ...metadata,
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        shipping: shipping.toFixed(2),
        total: total.toFixed(2),
        orderSource: 'web',
      },

      // Automatic tax calculation (optional, Stripe can calculate tax)
      // For now we're calculating manually with 16% IVA
    });

    logger.info('Stripe checkout session created', {
      sessionId: session.id,
      amount: total,
      itemCount: items.length,
    });

    res.status(200).json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url,
      },
    });

  } catch (error) {
    logger.error('Error creating Stripe checkout session', {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      error: 'Error creating checkout session',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Webhook handler for Stripe events
 *
 * @route   POST /api/stripe/webhook
 * @access  Public (but verified by Stripe signature)
 */
export const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  // DEVELOPMENT MODE: Skip signature verification if webhook secret is not configured
  if (!webhookSecret || webhookSecret === 'whsec_your_webhook_secret_here') {
    logger.warn('⚠️  Webhook signature verification DISABLED (development mode)');
    logger.warn('⚠️  Configure STRIPE_WEBHOOK_SECRET for production');

    // Parse the raw body as JSON
    event = req.body;
  } else {
    // PRODUCTION MODE: Verify webhook signature
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        webhookSecret
      );
      logger.info('Webhook signature verified successfully');
    } catch (err) {
      logger.error('Webhook signature verification failed', {
        error: err.message,
      });
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;

        logger.info('Payment successful', {
          sessionId: session.id,
          customerEmail: session.customer_email,
          amountTotal: session.amount_total / 100,
        });

        try {
          // Retrieve full session details with line items
          const fullSession = await stripe.checkout.sessions.retrieve(
            session.id,
            { expand: ['line_items.data.price.product'] }
          );

          // Parse metadata from session
          const metadata = session.metadata || {};
          const subtotal = parseFloat(metadata.subtotal || '0');
          const tax = parseFloat(metadata.tax || '0');
          const shipping = parseFloat(metadata.shipping || '0');
          const total = parseFloat(metadata.total || '0');

          // Build order items from line items
          const orderItems = [];

          for (const lineItem of fullSession.line_items.data) {
            const productId = lineItem.price.product.metadata?.productId;
            const variantId = lineItem.price.product.metadata?.variantId;
            const sku = lineItem.price.product.metadata?.sku;

            if (!productId) {
              logger.warn('Line item missing productId', { lineItem });
              continue;
            }

            // Fetch product from database
            const product = await Product.findById(productId);
            if (!product) {
              logger.warn('Product not found', { productId });
              continue;
            }

            // Find variant
            const variant = product.variants.find(v =>
              v._id?.toString() === variantId || v.sku === sku
            ) || product.variants[0];

            orderItems.push({
              product: product._id,
              productSnapshot: {
                name: product.name,
                slug: product.slug,
                category: product.category,
                images: product.images.slice(0, 2).map(img => ({
                  url: img.url,
                  altText: img.altText,
                })),
              },
              variant: {
                variantId: variant._id?.toString(),
                sku: variant.sku,
                name: variant.name,
                attributes: {
                  size: variant.attributes.size,
                  color: variant.attributes.color,
                  material: variant.attributes.material,
                },
              },
              quantity: lineItem.quantity,
              unitPrice: lineItem.price.unit_amount / 100,
              totalPrice: lineItem.amount_total / 100,
            });
          }

          if (orderItems.length === 0) {
            logger.error('No valid order items found', { sessionId: session.id });
            break;
          }

          // Create order
          const orderData = {
            customer: {
              email: session.customer_email || session.customer_details?.email,
            },
            items: orderItems,
            pricing: {
              subtotal,
              tax,
              taxRate: 0.16,
              shipping,
              discount: 0,
              total,
              currency: 'MXN',
            },
            shippingAddress: {
              firstName: metadata.firstName || session.customer_details?.name?.split(' ')[0] || 'Cliente',
              lastName: metadata.lastName || session.customer_details?.name?.split(' ').slice(1).join(' ') || '',
              company: '',
              address: session.customer_details?.address?.line1 || 'Pendiente',
              apartment: session.customer_details?.address?.line2 || '',
              city: session.customer_details?.address?.city || 'Pendiente',
              state: session.customer_details?.address?.state || 'Pendiente',
              postalCode: session.customer_details?.address?.postal_code || '00000',
              country: session.customer_details?.address?.country || 'MX',
              phone: metadata.phone || session.customer_details?.phone || 'Pendiente',
            },
            billingAddress: {
              sameAsShipping: true,
            },
            shippingMethod: 'standard', // Fixed: valid enum values are 'standard', 'express', 'pickup'
            payment: {
              method: 'stripe',
              status: 'paid',
              paidAt: new Date(),
              stripeSessionId: session.id,
              stripePaymentIntentId: session.payment_intent,
              metadata: new Map(Object.entries(metadata)),
            },
            status: 'processing',
          };

          const order = await Order.create(orderData);

          logger.info('Order created successfully from Stripe webhook', {
            orderId: order._id,
            orderNumber: order.orderNumber,
            sessionId: session.id,
            total: order.pricing.total,
          });

          // Decrease inventory stock
          try {
            // Add order information to items for inventory logging
            const itemsWithOrderInfo = order.items.map(item => ({
              ...item.toObject(),
              orderId: order._id,
              orderNumber: order.orderNumber,
            }));

            const inventoryResult = await decreaseStock(itemsWithOrderInfo);

            if (inventoryResult.success) {
              logger.info('Inventory updated successfully', {
                orderId: order._id,
                orderNumber: order.orderNumber,
                updatedItems: inventoryResult.updatedItems.length,
              });
            } else {
              logger.error('Inventory update failed for some items', {
                orderId: order._id,
                orderNumber: order.orderNumber,
                errors: inventoryResult.errors,
              });

              // Add note to order about inventory issues
              order.notes.push({
                author: 'System',
                content: `Inventory update failed: ${JSON.stringify(inventoryResult.errors)}`,
                isPrivate: true,
              });
              await order.save();
            }
          } catch (inventoryError) {
            logger.error('Critical error updating inventory', {
              orderId: order._id,
              error: inventoryError.message,
              stack: inventoryError.stack,
            });

            // Add critical note to order
            order.notes.push({
              author: 'System',
              content: `CRITICAL: Inventory update failed - ${inventoryError.message}`,
              isPrivate: true,
            });
            await order.save();
          }

          // Send order confirmation email
          try {
            const emailResult = await sendOrderConfirmationEmail(order);

            if (emailResult.success) {
              logger.info('Order confirmation email sent successfully', {
                orderId: order._id,
                orderNumber: order.orderNumber,
                customerEmail: order.customer.email,
                messageId: emailResult.messageId,
              });

              // Add note to order about email sent
              order.notes.push({
                author: 'System',
                content: `Confirmation email sent to ${order.customer.email}`,
                isPrivate: true,
              });
              await order.save();
            } else {
              logger.warn('Failed to send order confirmation email', {
                orderId: order._id,
                orderNumber: order.orderNumber,
                error: emailResult.error,
              });

              // Add note to order about email failure
              order.notes.push({
                author: 'System',
                content: `Failed to send confirmation email: ${emailResult.error}`,
                isPrivate: true,
              });
              await order.save();
            }
          } catch (emailError) {
            logger.error('Critical error sending order confirmation email', {
              orderId: order._id,
              error: emailError.message,
              stack: emailError.stack,
            });

            // Don't fail the webhook if email fails
            // Just log it for admin review
          }

        } catch (orderError) {
          logger.error('Error creating order from webhook', {
            error: orderError.message,
            stack: orderError.stack,
            sessionId: session.id,
          });
        }

        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        logger.info('PaymentIntent succeeded', {
          id: paymentIntent.id,
          amount: paymentIntent.amount / 100,
        });
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        logger.error('Payment failed', {
          id: paymentIntent.id,
          error: paymentIntent.last_payment_error?.message,
        });
        break;
      }

      default:
        logger.info('Unhandled webhook event type', { type: event.type });
    }

    res.json({ received: true });

  } catch (error) {
    logger.error('Error processing webhook', {
      error: error.message,
      eventType: event.type,
    });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

/**
 * Retrieve checkout session details
 *
 * @route   GET /api/stripe/checkout-session/:sessionId
 * @access  Public
 */
export const getCheckoutSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    res.status(200).json({
      success: true,
      data: {
        id: session.id,
        paymentStatus: session.payment_status,
        customerEmail: session.customer_email,
        amountTotal: session.amount_total / 100,
        currency: session.currency,
        metadata: session.metadata,
      },
    });

  } catch (error) {
    logger.error('Error retrieving checkout session', {
      error: error.message,
      sessionId: req.params.sessionId,
    });

    res.status(500).json({
      success: false,
      error: 'Error retrieving checkout session',
    });
  }
};

/**
 * DEVELOPMENT ONLY: Manually trigger order creation from session ID
 * Use this to test order creation without needing Stripe CLI
 *
 * @route   POST /api/stripe/dev-create-order/:sessionId
 * @access  Public (development only)
 */
export const devCreateOrderFromSession = async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      error: 'This endpoint is only available in development',
    });
  }

  try {
    const { sessionId } = req.params;

    logger.info('🧪 DEV: Manually creating order from session', { sessionId });

    // Retrieve full session details from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items.data.price.product'],
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    if (session.payment_status !== 'paid') {
      return res.status(400).json({
        success: false,
        error: 'Session payment not completed',
        paymentStatus: session.payment_status,
      });
    }

    // Parse metadata
    const metadata = session.metadata || {};
    const subtotal = parseFloat(metadata.subtotal || '0');
    const tax = parseFloat(metadata.tax || '0');
    const shipping = parseFloat(metadata.shipping || '0');
    const total = parseFloat(metadata.total || '0');

    // Build order items
    const orderItems = [];

    for (const lineItem of session.line_items.data) {
      const productId = lineItem.price.product.metadata?.productId;
      const variantId = lineItem.price.product.metadata?.variantId;
      const sku = lineItem.price.product.metadata?.sku;

      if (!productId) {
        logger.warn('Line item missing productId', { lineItem });
        continue;
      }

      const product = await Product.findById(productId);
      if (!product) {
        logger.warn('Product not found', { productId });
        continue;
      }

      const variant =
        product.variants.find(
          (v) => v._id?.toString() === variantId || v.sku === sku
        ) || product.variants[0];

      orderItems.push({
        product: product._id,
        productSnapshot: {
          name: product.name,
          slug: product.slug,
          category: product.category,
          images: product.images.slice(0, 2).map((img) => ({
            url: img.url,
            altText: img.altText,
          })),
        },
        variant: {
          variantId: variant._id?.toString(),
          sku: variant.sku,
          name: variant.name,
          attributes: {
            size: variant.attributes.size,
            color: variant.attributes.color,
            material: variant.attributes.material,
          },
        },
        quantity: lineItem.quantity,
        unitPrice: lineItem.price.unit_amount / 100,
        totalPrice: lineItem.amount_total / 100,
      });
    }

    if (orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid order items found',
      });
    }

    // Create order
    const orderData = {
      customer: {
        email: session.customer_email || session.customer_details?.email,
      },
      items: orderItems,
      pricing: {
        subtotal,
        tax,
        taxRate: 0.16,
        shipping,
        discount: 0,
        total,
        currency: 'MXN',
      },
      shippingAddress: {
        firstName:
          metadata.firstName ||
          session.customer_details?.name?.split(' ')[0] ||
          'Cliente',
        lastName:
          metadata.lastName ||
          session.customer_details?.name?.split(' ').slice(1).join(' ') ||
          '',
        company: '',
        address: session.customer_details?.address?.line1 || 'Pendiente',
        apartment: session.customer_details?.address?.line2 || '',
        city: session.customer_details?.address?.city || 'Pendiente',
        state: session.customer_details?.address?.state || 'Pendiente',
        postalCode: session.customer_details?.address?.postal_code || '00000',
        country: session.customer_details?.address?.country || 'MX',
        phone:
          metadata.phone || session.customer_details?.phone || 'Pendiente',
      },
      billingAddress: {
        sameAsShipping: true,
      },
      shippingMethod: metadata.deliveryMethod || 'standard',
      payment: {
        method: 'stripe',
        status: 'paid',
        paidAt: new Date(),
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent,
        metadata: new Map(Object.entries(metadata)),
      },
      status: 'processing',
    };

    const order = await Order.create(orderData);

    logger.info('🧪 DEV: Order created successfully', {
      orderId: order._id,
      orderNumber: order.orderNumber,
    });

    // Decrease inventory
    try {
      const itemsWithOrderInfo = order.items.map((item) => ({
        ...item.toObject(),
        orderId: order._id,
        orderNumber: order.orderNumber,
      }));

      const inventoryResult = await decreaseStock(itemsWithOrderInfo);

      if (inventoryResult.success) {
        logger.info('🧪 DEV: Inventory updated', {
          updatedItems: inventoryResult.updatedItems.length,
        });
      }
    } catch (inventoryError) {
      logger.error('🧪 DEV: Inventory update failed', {
        error: inventoryError.message,
      });
    }

    // Send email
    try {
      const emailResult = await sendOrderConfirmationEmail(order);
      if (emailResult.success) {
        logger.info('🧪 DEV: Email sent', {
          messageId: emailResult.messageId,
          previewUrl: emailResult.previewUrl,
        });
      }
    } catch (emailError) {
      logger.error('🧪 DEV: Email failed', { error: emailError.message });
    }

    res.status(200).json({
      success: true,
      message: 'Order created successfully (DEV MODE)',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        total: order.pricing.total,
      },
    });
  } catch (error) {
    logger.error('🧪 DEV: Error creating order from session', {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      error: 'Error creating order',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
