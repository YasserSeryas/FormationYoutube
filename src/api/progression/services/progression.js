// api/progression/services/progression.js
module.exports = {
  // Mise à jour de la progression d'une vidéo
  async updateProgression(userId, videoId, position, duration) {
    // Calcul du pourcentage visionné
    const pourcentage = Math.floor((position / duration) * 100);
    const completee = pourcentage >= 90; // Considérée complétée à 90%
    
    // Recherche de la progression existante
    let progression = await strapi.query('api::progression.progression').findOne({
      where: { 
        utilisateur: userId,
        video: videoId 
      }
    });
    
    // Création ou mise à jour de la progression
    if (!progression) {
      progression = await strapi.entityService.create('api::progression.progression', {
        data: {
          utilisateur: userId,
          video: videoId,
          pourcentage_visionne: pourcentage,
          completee,
          derniere_position: position,
          date_derniere_vue: new Date()
        }
      });
    } else {
      progression = await strapi.entityService.update('api::progression.progression', progression.id, {
        data: {
          pourcentage_visionne: Math.max(progression.pourcentage_visionne, pourcentage),
          completee: progression.completee || completee,
          derniere_position: position,
          date_derniere_vue: new Date()
        }
      });
    }
    
    return progression;
  },
  
  // Vérification de l'accès à une vidéo
  async canAccessVideo(userId, videoId) {
    // Obtenir la vidéo avec son module et sa formation
    const video = await strapi.entityService.findOne('api::video.video', videoId, {
      populate: ['module.formation', 'module.videos']
    });
    
    if (!video) return false;
    
    // Vérifier si l'utilisateur a acheté la formation
    const user = await strapi.entityService.findOne('plugin::users-permissions.user', userId, {
      populate: ['formations_achetees']
    });
    
    const hasAccessToFormation = user.formations_achetees.some(
      f => f.id === video.module.formation.id
    );
    
    if (!hasAccessToFormation) return false;
    
    // Si c'est la première vidéo du module, accès autorisé
    const modulesVideos = video.module.videos.sort((a, b) => a.ordre - b.ordre);
    if (video.ordre === modulesVideos[0].ordre) return true;
    
    // Sinon, vérifier si la vidéo précédente a été complétée
    const previousVideo = modulesVideos.find(v => v.ordre === video.ordre - 1);
    if (!previousVideo) return true; // Au cas où l'ordre n'est pas continu
    
    const previousProgress = await strapi.query('api::progression.progression').findOne({
      where: { 
        utilisateur: userId,
        video: previousVideo.id 
      }
    });
    
    return previousProgress && previousProgress.completee;
  }
};
