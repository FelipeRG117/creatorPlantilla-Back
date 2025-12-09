/**
 * Stripe Payment Routes
 *
 * Handles Stripe checkout sessions and webhooks
 */

import express from 'express';
import {
  createCheckoutSession,
  handleWebhook,
  getCheckoutSession,
  devCreateOrderFromSession,
} from '../controllers/controller.stripe.js';

const router = express.Router();

/**
 * @route   POST /api/stripe/create-checkout-session
 * @desc    Create a new Stripe checkout session
 * @access  Public
 */
router.post('/create-checkout-session', createCheckoutSession);

/**
 * @route   POST /api/stripe/webhook
 * @desc    Handle Stripe webhook events
 * @access  Public (verified by Stripe signature)
 * @note    This route needs raw body, handle separately in app.js
 */
router.post('/webhook', handleWebhook);

/**
 * @route   GET /api/stripe/checkout-session/:sessionId
 * @desc    Retrieve checkout session details
 * @access  Public
 */
router.get('/checkout-session/:sessionId', getCheckoutSession);

/**
 * @route   POST /api/stripe/dev-create-order/:sessionId
 * @desc    DEVELOPMENT ONLY: Manually create order from session ID
 * @access  Public (development only)
 */
router.post('/dev-create-order/:sessionId', devCreateOrderFromSession);

export default router;
