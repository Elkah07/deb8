/* Deb8 V29 — correctif dédié Thèmes -> Réglages */
(function(){
  'use strict';

  function selectedThemeCount(){
    return document.querySelectorAll('#s5 .th.sel').length;
  }

  function forceOpenSettings(){
    try{
      if(!selectedThemeCount()) return;

      if(typeof buildS9 === 'function') buildS9();

      var target=document.getElementById('s9');
      if(!target) throw new Error('s9 introuvable');

      document.querySelectorAll('.screen').forEach(function(screen){
        screen.classList.remove('active','out');
        if(screen !== target) screen.style.display='';
      });

      target.style.display='flex';
      target.classList.add('active');

      // Nettoyage du style forcé après affichage : le CSS reprend la main.
      requestAnimationFrame(function(){
        if(target.classList.contains('active')) target.style.display='';
      });
    }catch(err){
      console.error('Deb8 V29 theme navigation:',err);
      alert('Les réglages n’ont pas pu être ouverts. Recharge l’application puis réessaie.');
    }
  }

  function install(){
    var btn=document.getElementById('btn-theme');
    if(!btn) return;

    // On retire l'ancien data-oc pour empêcher deux systèmes de navigation
    // de se déclencher sur le même clic.
    btn.removeAttribute('data-oc');
    btn.type='button';

    // Clone = supprime d'éventuels listeners hérités d'anciennes versions.
    var clean=btn.cloneNode(true);
    btn.parentNode.replaceChild(clean,btn);

    clean.addEventListener('click',function(e){
      e.preventDefault();
      e.stopPropagation();
      forceOpenSettings();
    },true);

    // Support tactile explicite pour PWA/Android.
    clean.addEventListener('touchend',function(e){
      e.preventDefault();
      e.stopPropagation();
      forceOpenSettings();
    },{passive:false,capture:true});

    window.openGameSettings=forceOpenSettings;
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',install,{once:true});
  }else{
    install();
  }
})();