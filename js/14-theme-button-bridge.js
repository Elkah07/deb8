/* Deb8 V33 — pont de clic robuste pour "Régler la partie" */
(function () {
  'use strict';

  function isInsideButton(x, y, btn) {
    const r = btn.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }

  function run(e) {
    const btn = document.getElementById('btn-theme');
    if (!btn) return;

    const direct = e.target && e.target.closest && e.target.closest('#btn-theme');
    const byPosition =
      typeof e.clientX === 'number' &&
      typeof e.clientY === 'number' &&
      isInsideButton(e.clientX, e.clientY, btn);

    if (!direct && !byPosition) return;

    e.preventDefault();
    e.stopImmediatePropagation();

    console.info('Deb8 V33 : clic Régler la partie détecté');

    if (typeof window.themeNext === 'function') {
      window.themeNext();
      return;
    }

    console.error('Deb8 V33 : window.themeNext est indisponible');
  }

  // Capture = exécuté avant les handlers normaux et avant les éléments superposés.
  document.addEventListener('click', run, true);
  document.addEventListener('pointerup', run, true);
})();