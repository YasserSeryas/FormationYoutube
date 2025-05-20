// api/video/controllers/video.js
const AWS = require('aws-sdk');
const crypto = require('crypto');

module.exports = {
  // Génère une URL signée CloudFront pour le streaming sécurisé
  async streamVideo(ctx) {
    const { id } = ctx.params;
    const userId = ctx.state.user.id;
    
    // Vérification de l'accès à la vidéo
    const canAccess = await strapi.service('api::progression.progression').canAccessVideo(userId, id);
    
    if (!canAccess) {
      return ctx.forbidden('Accès refusé à cette vidéo');
    }
    
    // Récupérer les détails de la vidéo
    const video = await strapi.entityService.findOne('api::video.video', id);
    
    if (!video) {
      return ctx.notFound('Vidéo introuvable');
    }
    
    // Configuration CloudFront
    const cloudFrontDomain = process.env.CLOUDFRONT_DOMAIN;
    const keyPairId = process.env.CLOUDFRONT_KEY_PAIR_ID;
    const privateKey = process.env.CLOUDFRONT_PRIVATE_KEY.replace(/\\n/g, '\n');
    
    // Construire le chemin de la vidéo
    const videoPath = `/videos/${video.video_id}.mp4`;
    
    // Générer l'URL signée (expire dans 1 heure)
    const signer = new AWS.CloudFront.Signer(keyPairId, privateKey);
    const expires = Math.floor((Date.now() + 3600 * 1000) / 1000);
    
    const signedUrl = signer.getSignedUrl({
      url: `https://${cloudFrontDomain}${videoPath}`,
      expires
    });
    
    return {
      url: signedUrl,
      titre: video.titre,
      duree: video.duree
    };
  },
  
  // Endpoint pour mettre à jour la progression de visionnage
  async updateProgress(ctx) {
    const { id } = ctx.params;
    const { position } = ctx.request.body;
    const userId = ctx.state.user.id;
    
    if (!position || position < 0) {
      return ctx.badRequest('Position invalide');
    }
    
    const video = await strapi.entityService.findOne('api::video.video', id);
    
    if (!video) {
      return ctx.notFound('Vidéo introuvable');
    }
    
    // Mise à jour de la progression
    const progression = await strapi.service('api::progression.progression')
      .updateProgression(userId, id, position, video.duree);
    
    return progression;
  }
};
