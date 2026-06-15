// ── SHOP ──
const THEMES = [
  { key:'classic',   icon:'⚡', label:'Classique',   color:'#F59E0B' },
  { key:'politique', icon:'🗳️', label:'Politique',    color:'#EF4444' },
  { key:'philo',     icon:'🧠', label:'Philosophie',  color:'#6366F1' },
  { key:'hero',      icon:'🦸', label:'Héros & Myths', color:'#F97316' },
  { key:'drole',     icon:'😂', label:'Drôle',        color:'#EC4899' },
  { key:'cartoon',   icon:'🎬', label:'Pop Culture',  color:'#14B8A6' },
  { key:'enfants',   icon:'🌈', label:'Enfants',      color:'#84CC16' },
]
let shopMode = 'pack'

function openShop(){
  document.getElementById('main-menu')?.classList.remove('open')
  const m = document.getElementById('shop-modal')
  m.style.display='flex'; m.style.opacity='0'; m.style.transition='opacity .25s'
  requestAnimationFrame(()=>requestAnimationFrame(()=>m.style.opacity='1'))
}
function closeShop(){
  const m = document.getElementById('shop-modal')
  m.style.opacity='0'; setTimeout(()=>m.style.display='none', 250)
}

function shopGoThemes(mode){
  shopMode = mode
  closeShop()
  const list  = document.getElementById('shop-themes-list')
  const title = document.getElementById('shop-themes-title')
  const sub   = document.getElementById('shop-themes-sub')
  title.textContent = mode==='pack' ? 'Choisissez un thème' : 'Quel thème débloquer ?'
  sub.textContent   = mode==='pack' ? 'Pack 50 questions · 2.99€ · Accès permanent' : 'Regardez une pub · 3 questions gratuites'
  list.innerHTML = THEMES.map(th=>`
    <div data-oc="confirmShopTheme('${th.key}')" style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--card);border:1.5px solid ${th.color}44;border-radius:14px;cursor:pointer;transition:transform .15s" onmousedown="this.style.transform='scale(0.97)'" onmouseup="this.style.transform=''">
      <div style="font-size:22px">${th.icon}</div>
      <div style="flex:1"><div style="font-weight:700;font-size:14px">${th.label}</div><div style="font-size:11px;color:var(--muted)">50 questions disponibles</div></div>
      <div style="font-family:var(--font-head);font-size:14px;color:${th.color}">${mode==='pack'?'2.99€':'Pub'}</div>
    </div>`).join('')
  setTimeout(()=>{
    const m = document.getElementById('shop-themes-modal')
    m.style.display='flex'; m.style.opacity='0'; m.style.transition='opacity .2s'
    requestAnimationFrame(()=>requestAnimationFrame(()=>m.style.opacity='1'))
  }, 150)
}
function closeShopThemes(){
  const m = document.getElementById('shop-themes-modal')
  m.style.opacity='0'; setTimeout(()=>m.style.display='none', 200)
}
function confirmShopTheme(themeKey){
  const th = THEMES.find(t=>t.key===themeKey)
  closeShopThemes()
  if(shopMode==='pack'){
    setTimeout(()=>alert('🎉 Achat confirmé !\n\n📦 Pack "'+th.label+'" — 2.99€\n50 nouvelles questions débloquées définitivement !'), 250)
  } else {
    setTimeout(()=>alert('📺 Publicité en cours...\n\nAprès le visionnage, 3 questions "'+th.label+'" seront débloquées gratuitement !'), 250)
  }
}

// ── RATE APP ──
function rateApp(){
  window.open('https://apps.apple.com/app/id000000000?action=write-review', '_blank')
}

// ── SHARE APP ──
function shareApp(){
  if(navigator.share){
    navigator.share({ title:'Deb8 — Le jeu qui fait débattre', text:'Découvrez Deb8, le jeu de débat entre amis ! 🎙️', url:'https://deb8.app' }).catch(()=>{})
  } else {
    navigator.clipboard?.writeText('https://deb8.app').then(()=>alert('🔗 Lien copié !\nhttps://deb8.app'))
  }
}

// ── CONTACT ──
function openContact(){
  closeSettings()
  const subj=document.getElementById('contact-subject'); if(subj) subj.value=''
  const body=document.getElementById('contact-body'); if(body) body.value=''
  const m = document.getElementById('contact-modal')
  m.style.display='flex'; m.style.opacity='0'; m.style.transition='opacity .25s'
  requestAnimationFrame(()=>requestAnimationFrame(()=>m.style.opacity='1'))
}
function closeContact(){
  const m = document.getElementById('contact-modal')
  m.style.opacity='0'; setTimeout(()=>m.style.display='none', 250)
}
function sendContact(){
  const subj = document.getElementById('contact-subject')?.value.trim()||'(Sans sujet)'
  const body = document.getElementById('contact-body')?.value.trim()
  if(!body){ alert('Veuillez écrire un message.'); return }
  window.location.href = 'mailto:contact@deb8.app?subject='+encodeURIComponent(subj)+'&body='+encodeURIComponent(body)
  closeContact()
}

// ── LEGAL ──
const legalContent = {
  cgu: { title:"📄 Conditions d'utilisation", body:`<strong>1. Acceptation des conditions</strong><br>En utilisant Deb8, vous acceptez les présentes conditions. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser l'application.<br><br><strong>2. Description du service</strong><br>Deb8 est une application de jeu de société numérique permettant à des groupes de participer à des débats ludiques avec plusieurs modes de jeu et des questions par thèmes.<br><br><strong>3. Utilisation acceptable</strong><br>Vous vous engagez à utiliser Deb8 de manière légale et respectueuse. Il est interdit d'utiliser l'application à des fins illicites, discriminatoires ou offensantes.<br><br><strong>4. Achats intégrés</strong><br>Les packs de questions sont disponibles à l'achat. Les achats sont définitifs et non remboursables sauf disposition légale contraire. Les prix sont en euros TTC.<br><br><strong>5. Propriété intellectuelle</strong><br>Tout le contenu de Deb8 est protégé par le droit d'auteur. Toute reproduction sans autorisation est interdite.<br><br><strong>6. Contact</strong><br>Pour toute question : contact@deb8.app` },
  privacy: { title:"🔒 Politique de confidentialité", body:`<strong>1. Données collectées</strong><br>Deb8 collecte un minimum de données : prénoms des joueurs (stockés localement), préférences de l'app (langue, thème), et données d'achat anonymisées via les stores.<br><br><strong>2. Utilisation des données</strong><br>Vos données sont utilisées exclusivement pour faire fonctionner l'application. Elles ne sont jamais vendues à des tiers.<br><br><strong>3. Publicités</strong><br>L'option "Regarder une pub" fait appel à un réseau publicitaire tiers qui peut collecter des données anonymisées. Vous pouvez désactiver la personnalisation dans les réglages de votre appareil.<br><br><strong>4. Stockage local</strong><br>Les prénoms et préférences sont stockés localement sur votre appareil. Aucune donnée n'est envoyée sur nos serveurs.<br><br><strong>5. Vos droits</strong><br>Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression. Contactez-nous : contact@deb8.app<br><br><em>Dernière mise à jour : Janvier 2025</em>` }
}
function openLegal(type){
  const d = legalContent[type]
  document.getElementById('legal-title').textContent = d.title
  document.getElementById('legal-body').innerHTML = d.body
  const m = document.getElementById('legal-modal')
  m.style.display='flex'; m.style.opacity='0'; m.style.transition='opacity .25s'
  requestAnimationFrame(()=>requestAnimationFrame(()=>m.style.opacity='1'))
}
function closeLegal(){
  const m = document.getElementById('legal-modal')
  m.style.opacity='0'; setTimeout(()=>m.style.display='none', 250)
}

// Override go to build s9 when navigating to it
const _go=go
window.go=function(n){
  if(n===9 && gameMode) buildS9()
  // Only build names when navigating to s10 from scratch (not via goFromDevice which calls it already)
  if(n===10 && !window._namesBuilt) buildNames()
  window._namesBuilt = false
  _go(n)
}
