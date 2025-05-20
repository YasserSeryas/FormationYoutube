// api/payment/controllers/webhook.js
module.exports = {
  async handleStripeWebhook(ctx) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const signature = ctx.request.headers['stripe-signature'];
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        ctx.request.body,
        signature,
        webhookSecret
      );
    } catch (err) {
      ctx.throw(400, `Webhook Error: ${err.message}`);
      return;
    }
    
    // Traitement de l'événement de paiement réussi
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // Mise à jour des accès utilisateur
      if (session.metadata.userId && session.metadata.formationId) {
        const userId = session.metadata.userId;
        const formationId = session.metadata.formationId;
        
        // Ajouter la formation à l'utilisateur
        const user = await strapi.entityService.findOne('plugin::users-permissions.user', userId, {
          populate: ['formations_achetees']
        });
        
        // Vérifier si la formation est déjà achetée
        if (!user.formations_achetees.some(f => f.id === formationId)) {
          await strapi.entityService.update('plugin::users-permissions.user', userId, {
            data: {
              formations_achetees: [...user.formations_achetees.map(f => f.id), formationId]
            }
          });
          
          // Créer une transaction pour traçabilité
          await strapi.entityService.create('api::transaction.transaction', {
            data: {
              utilisateur: userId,
              formation: formationId,
              montant: session.amount_total / 100,
              stripe_session_id: session.id,
              date_paiement: new Date()
            }
          });
        }
      }
    }
    
    ctx.send({ received: true });
  }
};
