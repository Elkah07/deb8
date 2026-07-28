/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   NAVIGATION RETOUR ANDROID / PWA
   Chaque changement d'écran devient une vraie étape
   dans l'historique du téléphone.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
(function () {
  'use strict';

  var restoringHistory = false;
  var lastScreenId = '';
  var pendingSync = 0;
  var observedScreenId = '';

  function activeScreenId() {
    var screen = document.querySelector('.screen.active');
    return screen ? screen.id : '';
  }

  function syncHistoryWithActiveScreen() {
    var observed = activeScreenId();
    if (observed) observedScreenId = observed;
    window.clearTimeout(pendingSync);
    pendingSync = window.setTimeout(function () {
      var screenId = observedScreenId || activeScreenId();
      if (!screenId || screenId === lastScreenId) return;

      if (restoringHistory) {
        lastScreenId = screenId;
        restoringHistory = false;
        return;
      }

      lastScreenId = screenId;
      window.history.pushState(
        { deb8: true, screenId: screenId },
        '',
        window.location.href
      );
    }, 40);
  }

  function displayHistoryScreen(screenId) {
    var target = document.getElementById(screenId);
    if (!target || !target.classList.contains('screen')) return false;

    restoringHistory = true;
    window.clearTimeout(pendingSync);

    document.querySelectorAll('.screen').forEach(function (screen) {
      screen.classList.remove('active', 'out');
    });
    target.classList.add('active');

    document.querySelectorAll('.sb').forEach(function (button) {
      button.classList.toggle('on', button.id === 'n' + screenId.slice(1));
    });

    lastScreenId = screenId;
    window.setTimeout(function () {
      restoringHistory = false;
    }, 180);
    return true;
  }

  function initializePhoneHistory() {
    var initialScreen = activeScreenId() || 's1';
    lastScreenId = initialScreen;
    window.history.replaceState(
      { deb8: true, screenId: initialScreen },
      '',
      window.location.href
    );

    var observer = new MutationObserver(syncHistoryWithActiveScreen);
    document.querySelectorAll('.screen').forEach(function (screen) {
      observer.observe(screen, {
        attributes: true,
        attributeFilter: ['class']
      });
    });

    window.addEventListener('popstate', function (event) {
      if (event.state && event.state.deb8 && event.state.screenId) {
        displayHistoryScreen(event.state.screenId);
      }
      // Sans état DEB8, le téléphone est revenu au-delà de l'accueil :
      // le comportement normal de fermeture reste alors autorisé.
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePhoneHistory);
  } else {
    initializePhoneHistory();
  }
})();
