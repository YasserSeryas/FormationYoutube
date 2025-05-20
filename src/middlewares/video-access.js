// middlewares/video-access.js
module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    // Uniquement pour les routes de streaming vidéo
    if (ctx.path.startsWith('/api/videos/stream/')) {
      const videoId = ctx.params.id;
      const user = ctx.state.user;
      
      if (!user) {
        return ctx.unauthorized('Vous devez être connecté pour accéder à cette vidéo');
      }
      
      const canAccess = await strapi.service('api::progression.progression').canAccessVideo(user.id, videoId);
      
      if (!canAccess) {
        return ctx.forbidden('Vous n\'avez pas accès à cette vidéo ou vous devez terminer la précédente');
      }
    }
    
    await next();
  };
};
