// api/payment/services/stripe.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = {
  // Création d'une session de paiement Stripe
  async createCheckoutSession(formationId, userId) {
    const formation = await strapi.entityService.findOne('api::formation.formation', formationId);
    
    if (!formation) {
      throw new Error('Formation introuvable');
    }
    
    // Création ou récupération du produit Stripe
    let stripeProductId = formation.stripe_product_id;
    if (!stripeProductId) {
      const product = await stripe.products.create({
        name: formation.titre,
        description: formation.description,
        metadata: {
          formationId: formation.id
        }
      });
      
      stripeProductId = product.id;
      await strapi.entityService.update('api::formation.formation', formationId, {
        data: { stripe_product_id: stripeProductId }
      });
    }
    
    // Création d'un prix Stripe
    const price = await stripe.prices.create({
      product: stripeProductId,
      unit_amount: Math.round(formation.prix * 100), // Stripe utilise les centimes
      currency: 'eur',
    });
    
    // Création de la session de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/formations/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/formations/${formationId}`,
      customer_email: userId ? (await strapi.entityService.findOne('plugin::users-permissions.user', userId)).email : undefined,
      metadata: {
        userId,
        formationId
      }
    });
    
    return session;
  }
};
