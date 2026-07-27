
/* ═══════════════════════════════════════════════════
   DEB8 V25 — MODE CRÉATEUR
   Outils de test locaux, sans ajouter de nouveau jeu.
═══════════════════════════════════════════════════ */
(function(){
  'use strict';

  var STORAGE_KEY = 'deb8_creator_mode';
  var creatorEnabled = localStorage.getItem(STORAGE_KEY) === '1';
  var creatorPlayerCount = 4;

  function phoneRoot(){
    return document.querySelector('.phone') || document.body;
  }

  function creatorToast(message, tone){
    var old = document.getElementById('creator-toast');
    if(old) old.remove();

    var toast = document.createElement('div');
    toast.id = 'creator-toast';
    toast.textContent = message;
    toast.style.cssText =
      'position:absolute;left:16px;right:16px;bottom:82px;z-index:980;' +
      'padding:12px 14px;border-radius:14px;text-align:center;font-size:12px;font-weight:800;' +
      'background:' + (tone === 'bad' ? 'rgba(255,77,109,.95)' : tone === 'good' ? 'rgba(16,185,129,.95)' : 'rgba(28,28,42,.97)') + ';' +
      'color:#fff;box-shadow:0 10px 28px rgba(0,0,0,.35);transition:opacity .25s,transform .25s';
    phoneRoot().appendChild(toast);
    setTimeout(function(){
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(6px)';
      setTimeout(function(){ toast.remove(); },260);
    },1800);
  }

  function addCreatorSetting(){
    var panel = document.getElementById('settings-panel');
    if(!panel || document.getElementById('creator-setting-row')) return;

    var versionLine = Array.from(panel.children).find(function(el){
      return (el.textContent || '').indexOf('Deb8 v') !== -1;
    });

    var section = document.createElement('div');
    section.className = 'sp-section';
    section.textContent = 'Développement';
    section.id = 'creator-settings-section';

    var row = document.createElement('div');
    row.className = 'sp-row';
    row.id = 'creator-setting-row';
    row.innerHTML =
      '<div>' +
        '<div class="sp-row-label">🛠️ Mode créateur</div>' +
        '<div style="font-size:10px;color:var(--muted);margin-top:3px">Accès rapide aux tests et écrans</div>' +
      '</div>' +
      '<div class="toggle '+(creatorEnabled ? 'on' : '')+'" id="creator-toggle"></div>';

    row.addEventListener('click', function(){
      setCreatorMode(!creatorEnabled);
    });

    if(versionLine){
      panel.insertBefore(section, versionLine);
      panel.insertBefore(row, versionLine);
    } else {
      panel.appendChild(section);
      panel.appendChild(row);
    }
  }

  function buildCreatorUI(){
    if(document.getElementById('creator-fab')) return;

    var fab = document.createElement('button');
    fab.id = 'creator-fab';
    fab.className = 'creator-fab' + (creatorEnabled ? ' show' : '');
    fab.setAttribute('aria-label','Ouvrir le mode créateur');
    fab.textContent = '🛠️';
    fab.addEventListener('click', openCreatorPanel);

    var modal = document.createElement('div');
    modal.id = 'creator-modal';
    modal.className = 'creator-modal';
    modal.innerHTML =
      '<div class="creator-head">' +
        '<div class="creator-head-icon">🛠️</div>' +
        '<div><div class="creator-kicker">Outils internes</div><div class="creator-title">Mode créateur</div></div>' +
        '<span class="creator-badge">DEB8 LAB</span>' +
        '<button class="creator-close" id="creator-close">✕</button>' +
      '</div>' +
      '<div class="creator-scroll">' +

        '<div class="creator-section">' +
          '<div class="creator-section-title">État de l’application</div>' +
          '<div class="creator-status-grid">' +
            '<div class="creator-status"><div class="creator-status-label">Firebase</div><div class="creator-status-value" id="creator-firebase-status">Vérification…</div></div>' +
            '<div class="creator-status"><div class="creator-status-label">Connexion</div><div class="creator-status-value" id="creator-network-status">—</div></div>' +
            '<div class="creator-status"><div class="creator-status-label">Utilisateur</div><div class="creator-status-value" id="creator-user-status">—</div></div>' +
            '<div class="creator-status"><div class="creator-status-label">Lobby</div><div class="creator-status-value" id="creator-lobby-status">Aucun</div></div>' +
          '</div>' +
        '</div>' +

        '<div class="creator-section">' +
          '<div class="creator-section-title">Lancer un mode local</div>' +
          '<div class="creator-grid">' +
            creatorAction('🎙️','Débat classique','Ouvre directement une partie','creatorLaunchLocal("debate")') +
            creatorAction('⚔️','1v1 + arbitre','Prépare 3 joueurs de test','creatorLaunchLocal("duel")') +
            creatorAction('✅','Vrai / Faux','Ouvre le vote face-à-face','creatorLaunchLocal("tf")') +
            creatorAction('🕵️','Imposteur','Distribue les rôles de test','creatorLaunchLocal("imp")') +
          '</div>' +
        '</div>' +

        '<div class="creator-section">' +
          '<div class="creator-section-title">Tests multijoueur</div>' +
          '<div class="creator-grid">' +
            creatorAction('📡','Lobby Firebase','Créer une vraie room','creatorCreateLobby()') +
            creatorAction('👥','Salle d’attente','Afficher le lobby actuel','creatorOpenLobby()') +
            creatorAction('🎙️','Vue multi Débat','Prévisualisation hôte','creatorPreviewMulti("debate")') +
            creatorAction('🕵️','Vue multi Imposteur','Prévisualisation hôte','creatorPreviewMulti("imp")') +
          '</div>' +
        '</div>' +

        '<div class="creator-section">' +
          '<div class="creator-section-title">Simulation locale</div>' +
          '<div class="creator-row">' +
            '<div><div class="creator-row-label">Joueurs de test</div><div class="creator-row-sub">Utilisés dans les aperçus locaux</div></div>' +
            '<div class="creator-count"><button id="creator-minus">−</button><strong id="creator-count">4</strong><button id="creator-plus">+</button></div>' +
          '</div>' +
          '<div class="creator-row">' +
            '<div><div class="creator-row-label">Accéder à un écran</div><div class="creator-row-sub">Navigation directe sans refaire le parcours</div></div>' +
          '</div>' +
          '<select class="creator-screen-select" id="creator-screen-select">' +
            '<option value="">Choisir un écran…</option>' +
            buildScreenOptions() +
          '</select>' +
        '</div>' +

        '<div class="creator-section">' +
          '<div class="creator-section-title">Maintenance</div>' +
          '<div class="creator-row"><div><div class="creator-row-label">Recharger l’application</div><div class="creator-row-sub">Recharge la version publiée</div></div><button class="creator-mini-btn" id="creator-reload">Recharger</button></div>' +
          '<div class="creator-row"><div><div class="creator-row-label">Quitter le lobby</div><div class="creator-row-sub">Nettoie la session Firebase actuelle</div></div><button class="creator-mini-btn" id="creator-leave">Quitter</button></div>' +
          '<div class="creator-row"><div><div class="creator-row-label">Réinitialiser le profil local</div><div class="creator-row-sub">Pseudo, avatar et préférences créateur</div></div><button class="creator-mini-btn creator-danger" id="creator-reset">Réinitialiser</button></div>' +
        '</div>' +

      '</div>';

    phoneRoot().appendChild(fab);
    phoneRoot().appendChild(modal);

    document.getElementById('creator-close').addEventListener('click', closeCreatorPanel);
    document.getElementById('creator-minus').addEventListener('click', function(){
      creatorPlayerCount = Math.max(2, creatorPlayerCount - 1);
      updateCreatorCount();
    });
    document.getElementById('creator-plus').addEventListener('click', function(){
      creatorPlayerCount = Math.min(12, creatorPlayerCount + 1);
      updateCreatorCount();
    });
    document.getElementById('creator-screen-select').addEventListener('change', function(){
      if(!this.value) return;
      creatorGoToScreen(this.value);
      this.value = '';
    });
    document.getElementById('creator-reload').addEventListener('click', function(){
      location.reload();
    });
    document.getElementById('creator-leave').addEventListener('click', creatorLeaveLobby);
    document.getElementById('creator-reset').addEventListener('click', creatorResetProfile);
  }

  function creatorAction(icon,name,sub,handler){
    return '<button class="creator-action" data-oc=\''+handler+'\'>'+
      '<div class="creator-action-icon">'+icon+'</div>'+
      '<div class="creator-action-name">'+name+'</div>'+
      '<div class="creator-action-sub">'+sub+'</div>'+
    '</button>';
  }

  function buildScreenOptions(){
    var labels = {
      's1':'Accueil',
      's2':'Choix du téléphone',
      's3':'Choix du mode',
      's4':'Règles du mode',
      's5':'Choix des thèmes',
      's7':'Lobby historique',
      's8':'Attribution des rôles',
      's9':'Réglages de partie',
      's10':'Noms des joueurs',
      's11':'Proximité / vocal',
      's12':'Configuration équipes',
      's13':'Solo ou équipes',
      's-debate':'Partie Débat classique',
      's-duel':'Partie 1v1',
      's-duel-final':'Round final 1v1',
      's-tf-vote':'Vrai/Faux, vote',
      's-tf-debate':'Vrai/Faux, débat',
      's-imp-roles':'Imposteur, rôles',
      's-imp':'Imposteur, débat',
      's-imp-vote':'Imposteur, vote',
      's-podium':'Podium',
      's-online-entry':'Entrée multijoueur',
      's-online-profile':'Profil local',
      's-online-create-join':'Créer ou rejoindre',
      's-online-lobby':'Salle d’attente Firebase'
    };
    return Object.keys(labels).filter(function(id){
      return document.getElementById(id);
    }).map(function(id){
      return '<option value="'+id+'">'+labels[id]+'</option>';
    }).join('');
  }

  function setCreatorMode(enabled){
    creatorEnabled = !!enabled;
    localStorage.setItem(STORAGE_KEY, creatorEnabled ? '1' : '0');

    var toggle = document.getElementById('creator-toggle');
    if(toggle) toggle.classList.toggle('on', creatorEnabled);

    var fab = document.getElementById('creator-fab');
    if(fab) fab.classList.toggle('show', creatorEnabled);

    if(!creatorEnabled) closeCreatorPanel();
    creatorToast(creatorEnabled ? 'Mode créateur activé' : 'Mode créateur désactivé', creatorEnabled ? 'good' : '');
  }

  function openCreatorPanel(){
    var modal = document.getElementById('creator-modal');
    if(modal) modal.classList.add('open');
    refreshCreatorStatus();
  }

  function closeCreatorPanel(){
    var modal = document.getElementById('creator-modal');
    if(modal) modal.classList.remove('open');
  }

  function setStatus(id,text,cls){
    var el = document.getElementById(id);
    if(!el) return;
    el.textContent = text;
    el.className = 'creator-status-value ' + (cls || '');
    el.title = text;
  }

  function refreshCreatorStatus(){
    var firebaseReady = !!(window.firebase && firebase.apps && firebase.apps.length);
    setStatus('creator-firebase-status', firebaseReady ? 'Connecté' : 'Non initialisé', firebaseReady ? 'creator-good' : 'creator-bad');
    setStatus('creator-network-status', navigator.onLine ? 'En ligne' : 'Hors ligne', navigator.onLine ? 'creator-good' : 'creator-warn');

    var user = null;
    try { user = firebaseReady && firebase.auth().currentUser; } catch(e){}
    setStatus('creator-user-status', user ? user.uid : 'Anonyme en attente', user ? 'creator-good' : 'creator-warn');

    var code = '';
    if(typeof onlineState !== 'undefined' && onlineState){
      code = onlineState.roomCode || onlineState.code || '';
    }
    if(!code){
      code = sessionStorage.getItem('deb8_room_code') || localStorage.getItem('deb8_room_code') || '';
    }
    setStatus('creator-lobby-status', code || 'Aucun', code ? 'creator-good' : '');
  }

  function seedPlayers(count){
    var names = ['Alex','Léa','Sam','Zoé','Nina','Milo','Jade','Noa','Lina','Eden','Lou','Sacha'];
    window.pcount = count;
    window.playerNames = names.slice(0,count);
    if(typeof buildNames === 'function'){
      try { buildNames(); } catch(e){}
    }
  }

  window.creatorLaunchLocal = function(mode){
    closeCreatorPanel();
    seedPlayers(mode === 'duel' ? Math.max(3,creatorPlayerCount) : creatorPlayerCount);
    window.devMode = 'solo';
    window.gameMode = mode;

    if(mode === 'duel' && typeof assignDuelPlayersFromNames === 'function'){
      assignDuelPlayersFromNames();
    }

    if(typeof showGame === 'function'){
      showGame(mode);
      creatorToast('Mode '+mode+' lancé', 'good');
    } else {
      creatorToast('Fonction de lancement introuvable', 'bad');
    }
  };

  window.creatorPreviewMulti = function(mode){
    closeCreatorPanel();
    seedPlayers(Math.max(4,creatorPlayerCount));
    try {
      if(mode === 'debate' && typeof previewMultiDebate === 'function') previewMultiDebate(true);
      else if(mode === 'imp' && typeof previewMultiImp === 'function') previewMultiImp(true);
      else creatorToast('Aperçu indisponible', 'bad');
    } catch(err){
      console.error(err);
      creatorToast('Erreur pendant l’aperçu', 'bad');
    }
  };

  window.creatorCreateLobby = function(){
    closeCreatorPanel();
    if(typeof openOnlineFlow === 'function'){
      openOnlineFlow('create');
      return;
    }
    if(typeof onlineCreateRoom === 'function'){
      onlineCreateRoom();
      return;
    }
    creatorGoToScreen('s-online-create-join');
    creatorToast('Utilise « Créer une partie »', '');
  };

  window.creatorOpenLobby = function(){
    closeCreatorPanel();
    creatorGoToScreen('s-online-lobby');
  };

  window.creatorGoToScreen = function(id){
    closeCreatorPanel();
    var screen = document.getElementById(id);
    if(!screen){
      creatorToast('Écran introuvable', 'bad');
      return;
    }
    document.querySelectorAll('.screen').forEach(function(s){
      s.classList.remove('active','out');
    });
    setTimeout(function(){ screen.classList.add('active'); },60);
  };

  function updateCreatorCount(){
    var el = document.getElementById('creator-count');
    if(el) el.textContent = creatorPlayerCount;
  }

  function creatorLeaveLobby(){
    var ok = confirm('Quitter et nettoyer la session multijoueur actuelle ?');
    if(!ok) return;

    try {
      if(typeof leaveOnlineRoom === 'function') leaveOnlineRoom();
      else if(typeof onlineLeaveRoom === 'function') onlineLeaveRoom();
    } catch(e){ console.warn(e); }

    sessionStorage.removeItem('deb8_room_code');
    localStorage.removeItem('deb8_room_code');
    creatorToast('Session multijoueur nettoyée', 'good');
    refreshCreatorStatus();
  }

  function creatorResetProfile(){
    var ok = confirm('Réinitialiser le profil local Deb8 sur cet appareil ?');
    if(!ok) return;

    Object.keys(localStorage).forEach(function(key){
      if(key.indexOf('deb8_') === 0 && key !== STORAGE_KEY){
        localStorage.removeItem(key);
      }
    });
    creatorToast('Profil local réinitialisé', 'good');
    setTimeout(function(){ location.reload(); },700);
  }

  window.addEventListener('online', refreshCreatorStatus);
  window.addEventListener('offline', refreshCreatorStatus);

  function initCreatorMode(){
    addCreatorSetting();
    buildCreatorUI();
    updateCreatorCount();

    // 7 clics sur le logo permettent aussi d’activer le mode, pratique sur mobile.
    var taps = 0;
    var timer = null;
    var logo = document.querySelector('.logo-text');
    if(logo){
      logo.addEventListener('click', function(){
        taps++;
        clearTimeout(timer);
        timer = setTimeout(function(){ taps = 0; },1800);
        if(taps >= 7){
          taps = 0;
          setCreatorMode(!creatorEnabled);
        }
      });
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initCreatorMode);
  } else {
    initCreatorMode();
  }
})();
