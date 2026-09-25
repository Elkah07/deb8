/* Deb8 V35 — uniquement le bouton Thèmes -> Réglages */
(function(){
  function bind(){
    const b=document.getElementById('btn-theme')
    if(!b) return
    b.addEventListener('click',function(e){
      e.preventDefault()
      if(typeof openGameSettings==='function') openGameSettings()
    })
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bind,{once:true})
  else bind()
})()
