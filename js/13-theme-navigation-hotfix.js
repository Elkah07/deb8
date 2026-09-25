/* Deb8 V30 — Thèmes -> Réglages */
(function(){
  function install(){
    var btn=document.getElementById('btn-theme');
    if(!btn) return;
    btn.removeAttribute('data-oc');
    btn.onclick=function(e){
      e.preventDefault();
      e.stopPropagation();

      if(!document.querySelectorAll('#s5 .th.sel').length){
        if(typeof updateThemeSelectionControls==='function') updateThemeSelectionControls();
        return;
      }

      if(typeof buildS9!=='function') return;
      if(buildS9()===false) return;

      document.querySelectorAll('.screen').forEach(function(s){
        s.classList.remove('active','out');
      });
      var s9=document.getElementById('s9');
      if(s9) s9.classList.add('active');
    };
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();