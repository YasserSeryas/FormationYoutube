// api/video/routes/custom-routes.js
module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/videos/stream/:id',
      handler: 'video.streamVideo',
      config: {
        policies: ['global::isAuthenticated']
      }
    },
    {
      method: 'POST',
      path: '/videos/progress/:id',
      handler: 'video.updateProgress',
      config: {
        policies: ['global::isAuthenticated']
      }
    },
    {
      method: 'POST',
      path: '/payments/create-checkout-session/:formationId',
      handler: 'payment.createCheckoutSession',
      config: {
        policies: ['global::isAuthenticated']
      }
    },
    {
      method: 'POST',
      path: '/payments/webhook',
      handler: 'payment.handleStripeWebhook',
      config: {
        auth: false // Le webhook Stripe n'a pas besoin d'authentification
      }
    }
  ]
};
