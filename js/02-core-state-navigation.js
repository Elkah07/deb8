// ── STATE ──
let pcount = 4, devMode = null, gameMode = null;
let playerNames = [];

const modes = {
  debate:{
    icon:'🎙️', name:'Débat Classique', color:'#FF4D6D',
    bg:'linear-gradient(135deg,rgba(255,77,109,0.15),rgba(255,140,66,0.1))',
    border:'rgba(255,77,109,0.3)',
    min:'Minimum 2 joueurs',
    hasRoles: false,
    rules:[
      {t:'Choisissez vos thèmes', d:'Sélectionnez un ou plusieurs thèmes. Les questions sont piochées aléatoirement parmi vos choix.'},
      {t:'Une question s\'affiche', d:'Tout le groupe voit la question. Pas de camps, pas de score — juste un bon débat chill entre amis.'},
      {t:'Débattez librement !', d:'Chacun donne son avis, argumente, réagit. Quand vous avez terminé, appuyez sur "Question suivante".'},
      {t:'Pas de vainqueur', d:'Ce mode n\'a pas de gagnant. L\'objectif c\'est juste de débattre, découvrir les opinions de chacun et s\'amuser !'},
    ],
    settings:[
      {key:'nb_questions', label:'Nombre de questions', type:'counter', val:8, min:1, max:50},
      {key:'time_debate', label:'Timer par question', type:'seg_custom', options:['∞','3 min','6 min','9 min','⏱️'], val:0},
    ]
  },
  duel:{
    icon:'⚔️', name:'1v1 + Arbitre', color:'#3B82F6',
    bg:'linear-gradient(135deg,rgba(59,130,246,0.15),rgba(99,102,241,0.1))',
    border:'rgba(59,130,246,0.3)',
    min:'Minimum 3 joueurs (dont 1 arbitre)',
    hasRoles: true,
    rules:[
      {t:'Désignez (ou tirez au sort) les rôles', d:'Choisissez manuellement qui combat et qui arbitre — ou laissez le jeu tout attribuer aléatoirement.'},
      {t:'POUR ou CONTRE ?', d:'Le jeu attribue aléatoirement un camp à chaque débatteur. Impossible de choisir son côté !'},
      {t:'Temps dégressif', d:'Le temps de parole diminue à chaque tour. Plus on avance, plus c\'est intense — 90s au tour 1, 30s au dernier !'},
      {t:'Le dernier tour : chaos total', d:'Au round final, les deux débatteurs parlent en même temps pendant 45 secondes. Convaincre dans le bruit, c\'est l\'art !'},
      {t:'L\'arbitre tranche chaque tour', d:'Après chaque tour, l\'arbitre désigne le vainqueur. Celui qui cumule le plus de tours remportés gagne le débat.'},
    ],
    settings:[
      {key:'nb_tours', label:'Nombre de tours', type:'seg', options:['3 tours','5 tours','7 tours'], val:1},
    ]
  },
  tf:{
    icon:'✅', name:'Vrai / Faux', color:'#10B981',
    bg:'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(20,184,166,0.1))',
    border:'rgba(16,185,129,0.3)',
    min:'2 joueurs face à face',
    hasRoles: false,
    rules:[
      {t:'Phase 1 — Vote', d:'Les questions défilent une par une. Chacun vote de son côté (Vrai/Faux) sans voir le choix de l\'autre. On ne discute pas encore !'},
      {t:'10 questions au total', d:'On enchaîne rapidement les 10 questions. Chacun vote en silence, le téléphone posé entre les deux joueurs.'},
      {t:'Phase 2 — Débat', d:'Une fois les 10 questions passées, seules les questions où vous avez voté différemment réapparaissent.'},
      {t:'Débattez vos désaccords', d:'Pour chaque désaccord, chacun explique pourquoi il a voté ainsi. Pas de score, juste une bonne discussion !'},
      {t:'Question suivante', d:'Quand vous avez bien débattu un désaccord, appuyez sur "Suivant" pour passer au prochain. Pas de vainqueur — juste de la découverte !'},
    ],
    settings:[
      {key:'nb_questions', label:'Nombre de questions', type:'counter', val:10, min:4, max:20},
    ]
  },
  imp:{
    icon:'🕵️', name:'L\'Imposteur', color:'#8B5CF6',
    bg:'linear-gradient(135deg,rgba(139,92,246,0.15),rgba(99,102,241,0.1))',
    border:'rgba(139,92,246,0.3)',
    min:'Minimum 3 joueurs',
    hasRoles: false,
    rules:[
      {t:'Rôles secrets', d:'Chaque joueur prend le téléphone seul pour voir son rôle. La plupart reçoivent le <strong>même sujet</strong> + un camp (POUR / CONTRE). L\'imposteur reçoit un <strong>sujet différent</strong>.'},
      {t:'Le débat commence', d:'Les joueurs débattent à tour de rôle. L\'imposteur doit bluffer et rester crédible sans connaître le vrai sujet du groupe.'},
      {t:'Vote d\'élimination', d:'Après ~3 tours, un vote est lancé. Chacun désigne la personne qu\'il soupçonne d\'être l\'imposteur.'},
      {t:'Révélation', d:'L\'imposteur est-il démasqué ? Si oui, les autres gagnent. S\'il survit, l\'imposteur marque un point.'},
      {t:'Exemple concret', d:'3 joueurs : Alex <em>POUR la castration chimique</em> · Léa <em>CONTRE</em> · Sam (imposteur) <em>POUR la peine de mort</em>.'},
    ],
    settings:[
      {key:'nb_parties', label:'Nombre de parties', type:'counter', val:3, min:1, max:10},
      {key:'time_turn', label:'Temps de parole par tour', type:'seg_custom_seconds', options:['30 sec','45 sec','1 min','2 min','⏱️'], val:1},
    ]
  }
};

// ── NAVIGATION ──
const sbIds = ['n1','n2','n10','n3','n4','n8','n5','n9','n7']
function go(n){
  document.querySelectorAll('.screen').forEach(s=>{s.classList.remove('active','out')})
  const cur=document.querySelector('.screen.active')
  if(cur){cur.classList.add('out');setTimeout(()=>cur.classList.remove('out'),300)}
  setTimeout(()=>document.getElementById('s'+n).classList.add('active'),80)
  // highlight sidebar
  sbIds.forEach(id=>{
    const btn=document.getElementById(id)
    if(btn) btn.classList.toggle('on', id==='n'+n)
  })
}

// ── DEVICE ──
function selDev(m){
  devMode=m
  document.querySelectorAll('.dc').forEach(c=>c.classList.remove('sel'))
  document.getElementById('d-'+m).classList.add('sel')
  document.getElementById('np-wrap').style.display= m==='solo'?'block':'none'
  const btn=document.getElementById('btn-dev')
  btn.style.opacity='1';btn.style.pointerEvents='all'
  btn.textContent = m==='solo' ? 'Nommer les joueurs →' : 'Créer le lobby →'
}
function chgP(d){pcount=Math.max(2,Math.min(15,pcount+d));document.getElementById('pcount').textContent=pcount}

function goFromDevice(){
  if(devMode==='solo') { buildNames(); window._namesBuilt = true; window.go(10) }
  else window.go(7)
}

const AVATARS=['🦊','🐙','🐸','🦋','🐼','🦁','🐯','🦄','🐺','🐻','🐨','🦊']
function buildNames(){
  const list=document.getElementById('names-list')
  list.innerHTML=''
  for(let i=0;i<pcount;i++){
    const div=document.createElement('div')
    div.className='name-row'
    div.innerHTML=`
      <div class="name-av" style="background:rgba(255,77,109,${0.1+i*0.03})">${AVATARS[i]}</div>
      <input class="name-input" placeholder="Joueur ${i+1}" maxlength="16" id="pname-${i}" value="">
    `
    list.appendChild(div)
  }
  // focus first
  setTimeout(()=>{ const f=document.getElementById('pname-0'); if(f) f.focus() },200)
}

// ── MODE ──
function selMode(m){
  gameMode=m
  const md=modes[m]
  // build how-to screen
  const hero=document.getElementById('rule-hero')
  hero.style.background=md.bg
  hero.style.border='1.5px solid '+md.border
  hero.innerHTML=`<div class="rule-emoji">${md.icon}</div><div class="rule-name" style="color:${md.color}">${md.name}</div><div class="rule-min" style="background:${md.border.replace('0.3','0.15')};color:${md.color};border:1px solid ${md.border}">${md.min}</div>`

  const list=document.getElementById('rules-list')
  list.innerHTML=md.rules.map((r,i)=>`
    <div class="rule-item">
      <div class="rule-num" style="background:${md.border.replace('0.3','0.15')};color:${md.color}">${i+1}</div>
      <div class="rule-txt"><strong>${r.t}</strong><br>${r.d}</div>
    </div>`).join('')

  const btnGo=document.getElementById('btn-go')
  btnGo.style.background=`linear-gradient(135deg,${md.color},${md.color}cc)`
  window._btnGoMode = m
  window._btnGoHasRoles = md.hasRoles
  btnGo.textContent = md.hasRoles ? 'Choisir les rôles →' : 'Choisir les thèmes →' 

  go(4)
}

// ── THEMES ──
function toggleTheme(el){
  if(el.classList.contains('sel') && document.querySelectorAll('.th.sel').length<=1) return
  el.classList.toggle('sel')
  const any=document.querySelectorAll('.th.sel').length>0
  const btn=document.getElementById('btn-theme')
  btn.style.opacity=any?'1':'0.4'
  btn.style.pointerEvents=any?'all':'none'
}

// ── ROLES (s8) ──
function selRoles(mode){
  document.querySelectorAll('.dc').forEach(c=>c.classList.remove('sel'))
  document.getElementById('role-'+mode).classList.add('sel')
  document.getElementById('manual-roles').style.display = mode==='manual' ? 'flex' : 'none'
  const btn=document.getElementById('btn-roles')
  btn.style.opacity='1';btn.style.pointerEvents='all'
}

// ── BUILD S9 (settings + nb questions) ──
function buildS9(){
  const md=modes[gameMode]
  const list=document.getElementById('settings-list-9')
  list.innerHTML=md.settings.map(s=>{
    if(s.type==='counter'){
  const hint = s.odd ? '<div class="sc-hint">⚠️ Nombre impair requis pour garantir un gagnant</div>' : ''
  const currentVal = settingVals[s.key] ?? s.val

  return `<div class="setting-card">
    <div class="sc-label">${s.label}</div>
    <div class="sc-ctrl">
      <button class="sc-btn" data-oc="chgSetting('${s.key}',-1)">−</button>

      <input
        class="sc-input"
        id="sv-${s.key}"
        type="number"
        min="${s.min}"
        max="${s.max}"
        value="${currentVal}"
        oninput="setSettingInput('${s.key}', this.value)"
      >

      <button class="sc-btn" data-oc="chgSetting('${s.key}',1)">+</button>
    </div>${hint}
  </div>`
    } else if(s.type==='seg_custom'){
      // segmented with last option being "custom"
      const btns=s.options.map((o,i)=>`<button class="seg-btn ${i===s.val?'on':''}" data-oc="selSegCustom('${s.key}',${i},this,${i===s.options.length-1})">${o}</button>`).join('')
      return `<div class="setting-card">
        <div class="sc-label">${s.label}</div>
        <div class="seg">${btns}</div>
        <div class="custom-timer-wrap" id="custom-wrap-${s.key}">
          <span class="custom-timer-unit">⏱</span>
          <input class="custom-timer-input" type="number" min="1" max="120" placeholder="5" id="custom-input-${s.key}">
          <span class="custom-timer-unit">min</span>
        </div>
      </div>`
    } else if(s.type==='seg_custom_seconds'){
      const btns=s.options.map((o,i)=>`<button class="seg-btn ${i===s.val?'on':''}" data-oc="selSegCustomSeconds('${s.key}',${i},this,${i===s.options.length-1})">${o}</button>`).join('')
      return `<div class="setting-card">
        <div class="sc-label">${s.label}</div>
        <div class="seg">${btns}</div>
        <div class="custom-timer-wrap" id="custom-wrap-${s.key}">
          <span class="custom-timer-unit">⏱</span>
          <input class="custom-timer-input" type="number" min="10" max="600" placeholder="90" id="custom-input-${s.key}">
          <span class="custom-timer-unit">sec</span>
        </div>
      </div>`
    } else {
      return `<div class="setting-card">
        <div class="sc-label">${s.label}</div>
        <div class="seg">${s.options.map((o,i)=>`<button class="seg-btn ${i===s.val?'on':''}" data-oc="selSeg('${s.key}',${i},this)">${o}</button>`).join('')}</div>
      </div>`
    }
  }).join('')
  const sub = document.getElementById('s9-sub')
  if(md.settings.find(s=>s.key==='nb_questions')){
    sub.textContent = gameMode==='tf'
      ? 'Combien de questions voulez-vous vous poser ?'
      : 'Combien de questions voulez-vous jouer ?'
  } else if(md.settings.find(s=>s.key==='nb_parties')){
    sub.textContent='Combien de parties et quel temps par tour ?'
  } else {
    sub.textContent='Configurez votre partie.'
  }
}

const settingVals={}
function chgSetting(key,d){
  const md=modes[gameMode]
  const s=md.settings.find(x=>x.key===key)
  let v=(settingVals[key]??s.val)+d
  v=Math.max(s.min,Math.min(s.max,v))
  if(s.odd && v%2===0) v+=d>0?1:-1
  v=Math.max(s.min,Math.min(s.max,v))
  settingVals[key]=v
  const el = document.getElementById('sv-'+key)
if(el){
  if(el.tagName === 'INPUT') el.value = v
  else el.textContent = v
}
}

function setSettingInput(key, value){
  const md = modes[gameMode]
  const s = md.settings.find(x => x.key === key)
  let v = parseInt(value, 10)

  if(!Number.isFinite(v)) return
  v = Math.max(s.min, Math.min(s.max, v))

  if(s.odd && v % 2 === 0) v += 1
  v = Math.max(s.min, Math.min(s.max, v))

  settingVals[key] = v

  const el = document.getElementById('sv-' + key)
  if(el) el.value = v
}

function selSeg(key,i,el){
  el.closest('.seg').querySelectorAll('.seg-btn').forEach((b,j)=>b.classList.toggle('on',j===i))
  settingVals[key]=i
}
function selSegCustom(key,i,el,isCustom){
  el.closest('.seg').querySelectorAll('.seg-btn').forEach((b,j)=>b.classList.toggle('on',j===i))
  settingVals[key]=i
  const wrap=document.getElementById('custom-wrap-'+key)
  if(wrap) wrap.classList.toggle('show', isCustom)
}

function selSegCustomSeconds(key,i,el,isCustom){
  el.closest('.seg').querySelectorAll('.seg-btn').forEach((b,j)=>b.classList.toggle('on',j===i))
  settingVals[key]=i
  const wrap=document.getElementById('custom-wrap-'+key)
  if(wrap) wrap.classList.toggle('show', isCustom)
}
function getCustomSeconds(key, fallback){
  const input = document.getElementById('custom-input-'+key)
  const val = input ? parseInt(input.value, 10) : NaN
  if(Number.isFinite(val)) return Math.max(10, Math.min(600, val))
  return fallback
}

function launchGame(){
  if(devMode==='multi'){ window.go(7); return }

  document.querySelectorAll('.sc-input').forEach(input => {
  const key = input.id.replace('sv-', '')
  const md = modes[gameMode]
  const s = md.settings.find(x => x.key === key)

  if(!s) return

  let v = parseInt(input.value, 10)
  if(!Number.isFinite(v)) v = s.val

  v = Math.max(s.min, Math.min(s.max, v))

  if(s.odd && v % 2 === 0) v += 1
  v = Math.max(s.min, Math.min(s.max, v))

  settingVals[key] = v
  input.value = v
})
  // Read player names from inputs
  playerNames = []
  for(let i=0;i<pcount;i++){
    const inp = document.getElementById('pname-'+i)
    playerNames.push((inp && inp.value.trim()) ? inp.value.trim() : 'Joueur '+(i+1))
  }
  clearInterval(duelTimerInt); clearInterval(impTimerInt)
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active','out'))
  document.querySelectorAll('.sb').forEach(b=>b.classList.remove('on'))
  const screenMap={debate:'s-debate',duel:'s-duel',tf:'s-tf-vote',imp:'s-imp'}
  const sid=screenMap[gameMode]
  if(!sid) return
  // init tf state
  if(gameMode==='tf') initTF()
  if(gameMode==='duel') { initDuel(); return }
  if(gameMode==='imp') {
    initImp()
    clearInterval(impTimerInt)
    setTimeout(()=>document.getElementById('s-imp-roles').classList.add('active'),80)
    return
  }
  setTimeout(()=>{ document.getElementById(sid).classList.add('active'); if(gameMode==='debate' && typeof startDebateTimer==='function') startDebateTimer() },80)
}

// ── MENU / SETTINGS ──
function toggleMenu(e){
  e.stopPropagation()
  document.getElementById('main-menu').classList.toggle('open')
}
document.addEventListener('click', ()=>{
  document.getElementById('main-menu')?.classList.remove('open')
})
function openSettings(){
  document.getElementById('main-menu').classList.remove('open')
  document.getElementById('settings-panel').classList.add('open')
}
function closeSettings(){
  document.getElementById('settings-panel').classList.remove('open')
}

// ── DARK MODE ──
function toggleDarkMode(){
  const isLight = document.body.classList.toggle('light')
  const toggle = document.getElementById('dark-toggle')
  if(toggle) toggle.classList.toggle('on', !isLight)
}

// ── i18n ──
const i18n = {
  FR: { play:'Jouer !', how:'Comment ça marche ?', rate:"Noter l'application", share:'Partager Deb8', contact:'Nous contacter', cgu:"Conditions d'utilisation", privacy:'Politique de confidentialité' },
  EN: { play:'Play!', how:'How does it work?', rate:'Rate the app', share:'Share Deb8', contact:'Contact us', cgu:'Terms of use', privacy:'Privacy policy' },
  ES: { play:'¡Jugar!', how:'¿Cómo funciona?', rate:'Valorar la app', share:'Compartir Deb8', contact:'Contáctanos', cgu:'Términos de uso', privacy:'Política de privacidad' },
}
let currentLang = 'FR'

function T(key){ return (i18n[currentLang]||i18n.FR)[key] || key }

function selLang(lang){
  currentLang = lang
  ;['FR','EN','ES'].forEach(l=>{
    const btn = document.getElementById('lang-'+l)
    if(btn) btn.classList.toggle('on', l===lang)
  })
  applyI18n()
}
function applyI18n(){
  const t = i18n[currentLang]
  const playBtn = document.querySelector('#s1 .btn-main')
  if(playBtn) playBtn.textContent = t.play
  const howBtn = document.querySelector('#s1 .btn-outline')
  if(howBtn) howBtn.textContent = t.how
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key = el.getAttribute('data-i18n')
    if(t[key]) el.textContent = t[key]
  })
}
