// ── GAME SCREENS ──
const debateQuestionsPool = [
  "Le télétravail est-il bénéfique pour la productivité ?",
  "Faut-il rendre le vote obligatoire ?",
  "Internet a-t-il rendu les gens plus heureux ?",
  "Faut-il abolir les examens à l'école ?",
  "L'argent fait-il vraiment le bonheur ?"
]

let debateGameQuestions = []
let debQIdx = 0, duelQIdx = 0, duelTourN = 1, tfQIdx = 0, impTourN = 2
let duelTimerInt = null, impTimerInt = null
let duelSec = 45
var impSec = 32

function prepareDebateQuestions(){
  const total = settingVals["nb_questions"] ?? 8
  debateGameQuestions = []

  for(let i = 0; i < total; i++){
    debateGameQuestions.push(debateQuestionsPool[i % debateQuestionsPool.length])
  }

  debQIdx = 0

  document.getElementById("deb-q-total").textContent = total
  document.getElementById("deb-q-num").textContent = 1
  document.getElementById("deb-question").textContent = debateGameQuestions[0]
}

function buildDebatePlayers(){
  const avs = ["🦊","🐙","🐸","🦋","🐼","🦁","🐯","🦄"]
  const colors = ["#FF4D6D","#3B82F6","#10B981","#8B5CF6"]
  const row = document.getElementById("deb-players")
  if(!row) return

  row.innerHTML =
    avs.slice(0,pcount).map((a,i)=>
      `<div class="p-av-sm" style="background:${colors[i%4]}22;color:${colors[i%4]}">${a}</div>`
    ).join("") +
    `<span style="font-size:11px;color:var(--muted);margin-left:6px">${pcount} joueurs</span>`

  showDebateStarter()
}

function showDebateStarter(){
  const avs = ["🦊","🐙","🐸","🦋","🐼","🦁","🐯","🦄"]

  const names = playerNames && playerNames.length > 0
    ? playerNames
    : Array.from({length:pcount}, (_, i) => "Joueur " + (i + 1))

  const idx = Math.floor(Math.random() * names.length)

  document.getElementById("deb-starter-name").textContent = names[idx]
  document.getElementById("deb-starter-av").textContent = avs[idx % avs.length]

  const banner = document.getElementById("deb-starter")
  banner.style.display = "flex"
  banner.style.opacity = "1"

  clearTimeout(banner._timeout)
  banner._timeout = setTimeout(()=>{
    banner.style.opacity = "0"
    setTimeout(()=>{ banner.style.display = "none" }, 400)
  }, 3000)
}

function nextDebateQ(){
  debQIdx++

  if(debQIdx >= debateGameQuestions.length){
    showTFEnd()
    return
  }

  document.getElementById("deb-question").textContent = debateGameQuestions[debQIdx]
  document.getElementById("deb-q-num").textContent = debQIdx + 1
  document.getElementById("deb-q-total").textContent = debateGameQuestions.length

  showDebateStarter()
  startDebateTimer()
}

function switchDebateQ(){
  if(!debateGameQuestions.length) prepareDebateQuestions()

  const cur = debateGameQuestions[debQIdx]
  let newQ = cur
  let tries = 0

  while(newQ === cur && tries < 10){
    newQ = debateQuestionsPool[Math.floor(Math.random() * debateQuestionsPool.length)]
    tries++
  }

  debateGameQuestions[debQIdx] = newQ
  document.getElementById("deb-question").textContent = newQ

  startDebateTimer()
}
// ── DUEL STATE ──
const duelState = {
  nbTours: 5,          // from settings (3,5,7)
  currentTour: 1,
  currentSpeaker: 'pour', // 'pour' or 'contre'
  scores: { pour: 0, contre: 0 },
  players: { pour: { name:'Alex', av:'🦊' }, contre: { name:'Léa', av:'🐙' }, arbitre: { name:'Sam', av:'🐸' } },
  timePerTour: [],     // computed when game starts
}

// Time scale: 60s for tour 1, -10s each tour, min 20s, last tour = final round (45s simultaneous)
function computeTourTimes(nb){
  const times = []
  for(let i=0;i<nb-1;i++) times.push(Math.max(20, 60 - i*10))
  return times
}

function initDuel(){
  const nbMap = [3,5,7]
  duelState.nbTours    = nbMap[settingVals['nb_tours'] ?? 1]
  duelState.currentTour   = 1
  duelState.currentSpeaker = 'pour'
  duelState._speakersDone = []
  duelState.scores      = { pour:0, contre:0 }
  duelState.timePerTour = computeTourTimes(duelState.nbTours)
  renderDuelScreen()
  // Show role announce popup before starting timer
  const p = duelState.players
  const queue = [
    { name: p.pour.name, emoji: p.pour.av, role: 'POUR / VRAI', color: '#3B82F6',
      desc: 'Tu argumente <strong style="color:#3B82F6">POUR</strong> le sujet.<br>Convaincs l\'arbitre !' },
    { name: p.contre.name, emoji: p.contre.av, role: 'CONTRE / FAUX', color: '#FF4D6D',
      desc: 'Tu argumente <strong style="color:#FF4D6D">CONTRE</strong> le sujet.<br>Convaincs l\'arbitre !' },
    { name: p.arbitre.name, emoji: p.arbitre.av, role: 'ARBITRE', color: '#F59E0B',
      desc: 'Tu écoutes et tu tranches à chaque tour.<br>À toi le verdict !' },
  ]
  // Add popup to game screen if not already there
  var popup = document.getElementById('duel-role-announce')
  var gameScr = document.getElementById('s-duel')
  if(popup && gameScr && !gameScr.contains(popup)) gameScr.appendChild(popup)
  // Start timer after the last role announcement.
  window._afterAnnounce = startDuelTimer
  showRoleAnnounce(queue)
}

function renderDuelScreen(){
  const t = duelState.currentTour
  const nb = duelState.nbTours
  const speaker = duelState.currentSpeaker
  const opp = speaker === 'pour' ? 'contre' : 'pour'
  const p = duelState.players

  // topbar
  const tNum = document.getElementById('duel-tour-num'); if(tNum) tNum.textContent = t
  const tTot = document.getElementById('duel-tour-total'); if(tTot) tTot.textContent = nb

  // Cards highlight
  const pourCard   = document.getElementById('duel-pour-card')
  const contreCard = document.getElementById('duel-contre-card')
  const pourDot    = document.getElementById('duel-pour-dot')
  const contreDot  = document.getElementById('duel-contre-dot')
  const pourName   = document.getElementById('duel-pour-name')
  const contreName = document.getElementById('duel-contre-name')
  const pourAv     = document.getElementById('duel-pour-av')
  const contreAv   = document.getElementById('duel-contre-av')
  const pourScore  = document.getElementById('duel-pour-score')
  const contreScore= document.getElementById('duel-contre-score')

  if(pourName)   pourName.textContent   = p.pour.name
  if(contreName) contreName.textContent = p.contre.name
  if(pourAv)     pourAv.textContent     = p.pour.av
  if(contreAv)   contreAv.textContent   = p.contre.av
  if(pourScore)  pourScore.textContent  = duelState.scores.pour + ' pt'
  if(contreScore)contreScore.textContent= duelState.scores.contre + ' pt'

  const activePour = speaker === 'pour'
  if(pourCard)  { pourCard.style.border   = activePour ? '2px solid rgba(59,130,246,0.6)' : '1.5px solid rgba(59,130,246,0.15)'; pourCard.style.background   = activePour ? 'rgba(59,130,246,0.18)' : 'rgba(59,130,246,0.05)' }
  if(contreCard){ contreCard.style.border = !activePour ? '2px solid rgba(255,77,109,0.6)' : '1.5px solid rgba(255,77,109,0.15)'; contreCard.style.background = !activePour ? 'rgba(255,77,109,0.18)' : 'rgba(255,77,109,0.05)' }
  if(pourDot)   { pourDot.style.background   = activePour ? '#3B82F6' : 'rgba(255,255,255,0.15)'; pourDot.style.boxShadow = activePour ? '0 0 8px #3B82F6' : 'none' }
  if(contreDot) { contreDot.style.background = !activePour ? '#FF4D6D' : 'rgba(255,255,255,0.15)'; contreDot.style.boxShadow = !activePour ? '0 0 8px #FF4D6D' : 'none' }

  // question tag & sub
  const qtag = document.getElementById('duel-qtag'); if(qtag) qtag.textContent = `⚔️ Tour ${t} / ${nb}`
  const sub  = document.getElementById('duel-sub')
  if(sub){
    const spName = p[speaker].name
    const campLabel = speaker === 'pour' ? '<strong style="color:#3B82F6">POUR</strong>' : '<strong style="color:#FF4D6D">CONTRE</strong>'
    sub.innerHTML = `${spName} parle — il argumente ${campLabel}.`
  }

  // Arbitre
  const arbName = document.getElementById('duel-arbitre-name')
  if(arbName) arbName.textContent = p.arbitre.name + ' ' + p.arbitre.av

  // Timer: only reset when starting a fresh tour (not when switching speaker mid-tour)
  if(!duelState._keepTimer){
    duelSec = duelState.timePerTour[t-1] || 45
  }
  duelState._keepTimer = false
}

// Speaker toggle within a tour — each speaker gets their own full timer
function duelNextSpeaker(){
  clearInterval(duelTimerInt)
  // Mark current speaker as done for this tour
  if(!duelState._speakersDone) duelState._speakersDone = []
  duelState._speakersDone.push(duelState.currentSpeaker)
  // Both speakers have spoken → go to arbitre vote
  if(duelState._speakersDone.length >= 2){
    duelState._speakersDone = []
    duelEndTurn()
    return
  }
  // Switch to other speaker with fresh full timer
  duelState.currentSpeaker = duelState.currentSpeaker === 'pour' ? 'contre' : 'pour'
  duelState._keepTimer = false
  renderDuelScreen()
  startDuelTimer()
}

// End of tour → show arbitre vote screen
function duelEndTurn(){
  clearInterval(duelTimerInt)
  // Is this the last tour? → final round first
  if(duelState.currentTour === duelState.nbTours){
    showFinalRound()
    return
  }
  showArbitreVote()
}

function showArbitreVote(){
  const p = duelState.players
  const el = (id) => document.getElementById(id)
  if(el('popup-tour-num'))     el('popup-tour-num').textContent     = duelState.currentTour
  if(el('popup-arbitre-label')) el('popup-arbitre-label').textContent = p.arbitre.name + ', qui a été le plus convaincant ?'
  if(el('popup-av-pour'))      el('popup-av-pour').textContent      = p.pour.av
  if(el('popup-name-pour'))    el('popup-name-pour').textContent    = p.pour.name
  if(el('popup-av-contre'))    el('popup-av-contre').textContent    = p.contre.av
  if(el('popup-name-contre'))  el('popup-name-contre').textContent  = p.contre.name
  updateScoreDisplay()
  // Reset button styles
  ;['popup-btn-pour','popup-btn-contre'].forEach(id=>{
    const b=el(id); if(b){b.style.transform='';b.style.opacity='1';b.style.boxShadow=''}
  })
  // Show popup
  const popup = el('duel-vote-popup')
  if(popup){ popup.style.display='flex'; popup.style.opacity='0'; popup.style.transform='scale(0.95)'
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      popup.style.transition='opacity .25s,transform .25s'
      popup.style.opacity='1'; popup.style.transform='scale(1)'
    }))
  }
}

function updateScoreDisplay(){
  const p = duelState.players
  const s = duelState.scores
  const txt = `${p.pour.name} ${s.pour} — ${p.contre.name} ${s.contre}`
  ;['popup-score','vote-score-display'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.textContent=txt
  })
}

function duelArbitreVote(winner){
  duelState.scores[winner]++
  // Flash winner button
  const btn = document.getElementById('popup-btn-'+winner)
  if(btn){ btn.style.transform='scale(1.05)'; btn.style.boxShadow='0 0 30px '+(winner==='pour'?'rgba(59,130,246,0.5)':'rgba(255,77,109,0.5)') }
  setTimeout(()=>{
    // Hide popup
    const popup = document.getElementById('duel-vote-popup')
    if(popup){ popup.style.opacity='0'; popup.style.transform='scale(0.95)'
      setTimeout(()=>{ popup.style.display='none'; popup.style.transition='' },260)
    }
    duelState.currentTour++
    // Swap POUR and CONTRE so each player defends the other camp
    const tmp = duelState.players.pour
    duelState.players.pour = duelState.players.contre
    duelState.players.contre = tmp
    // Also swap scores to keep them tied to the right player
    const tmpScore = duelState.scores.pour
    duelState.scores.pour = duelState.scores.contre
    duelState.scores.contre = tmpScore
    duelState.currentSpeaker = 'pour'
    duelState._speakersDone = []
    if(duelState.currentTour > duelState.nbTours - 1){
      // Last tour → final round
      showFinalRound()
    } else {
      renderDuelScreen()
      duelSec = duelState.timePerTour[duelState.currentTour-1]
      updateDuelTimer()
      startDuelTimer()
    }
  }, 500)
}

function showFinalRound(){
  const p = duelState.players
  const el = (id) => document.getElementById(id)
  if(el('final-av-pour'))   el('final-av-pour').textContent   = p.pour.av
  if(el('final-name-pour')) el('final-name-pour').textContent = p.pour.name
  if(el('final-av-contre')) el('final-av-contre').textContent = p.contre.av
  if(el('final-name-contre'))el('final-name-contre').textContent = p.contre.name
  if(el('final-timer'))     el('final-timer').textContent     = '45'
  const arc = el('final-arc'); if(arc) arc.style.strokeDashoffset = '0'
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active','out'))
  setTimeout(()=>el('s-duel-final').classList.add('active'),80)
}

let finalTimerInt = null
function startFinalRound(){
  const btn = document.getElementById('final-start-btn')
  if(btn) btn.style.display = 'none'
  let sec = 45
  clearInterval(finalTimerInt)
  finalTimerInt = setInterval(()=>{
    sec--
    const el = document.getElementById('final-timer'); if(el) el.textContent = sec
    const arc = document.getElementById('final-arc')
    if(arc) arc.style.strokeDashoffset = 238.8*(1-sec/45)
    if(sec<=0){
      clearInterval(finalTimerInt)
      showFinalArbitreVote()
    }
  },1000)
}

// Legacy timer functions (kept for duel screen)
function startDuelTimer(){
  clearInterval(duelTimerInt)
  updateDuelTimer()
  duelTimerInt=setInterval(()=>{
    duelSec--
    if(duelSec<0){ clearInterval(duelTimerInt); duelEndTurn(); return }
    updateDuelTimer()
  },1000)
}
function updateDuelTimer(){
  const t = duelState.currentTour
  const maxSec = duelState.timePerTour[t-1] || 45
  if(typeof duelSec === 'undefined') duelSec = maxSec
  const el=document.getElementById('duel-timer')
  if(el) el.textContent=duelSec
  const arc=document.getElementById('duel-arc')
  if(arc){
    const pct = duelSec/maxSec
    arc.style.strokeDashoffset=150.8*(1-pct)
    arc.style.stroke=duelSec>maxSec*0.4?'#3B82F6':duelSec>maxSec*0.2?'#F59E0B':'#FF4D6D'
    const numEl=document.getElementById('duel-timer'); if(numEl) numEl.style.color=arc.style.stroke
  }
}
function nextDuelTurn(){
  duelTourN = duelTourN >= 3 ? 1 : duelTourN + 1
  const t = document.getElementById('duel-tour'); if(t) t.textContent = duelTourN
  // Alternate: odd tours = POUR speaks, even = CONTRE speaks
  const pourSpeaks = duelTourN % 2 === 1
  const pourCard   = document.getElementById('duel-pour-card')
  const contreCard = document.getElementById('duel-contre-card')
  const pourDot    = document.getElementById('duel-pour-dot')
  const contreDot  = document.getElementById('duel-contre-dot')
  const pourName   = document.getElementById('duel-pour-name')
  const contreName = document.getElementById('duel-contre-name')
  const sub        = document.getElementById('duel-sub')

  if(pourSpeaks){
    if(pourCard)  { pourCard.style.border='2px solid rgba(59,130,246,0.5)'; pourCard.style.background='rgba(59,130,246,0.18)' }
    if(contreCard){ contreCard.style.border='1.5px solid rgba(255,77,109,0.15)'; contreCard.style.background='rgba(255,77,109,0.05)' }
    if(pourDot)   { pourDot.style.background='#3B82F6'; pourDot.style.boxShadow='0 0 8px #3B82F6'; pourDot.style.opacity='1' }
    if(contreDot) { contreDot.style.background='rgba(255,255,255,0.15)'; contreDot.style.boxShadow='none' }
    if(sub && pourName) sub.innerHTML=`<strong>${pourName.textContent}</strong> parle — il argumente <strong style="color:#3B82F6">POUR</strong>.`
  } else {
    if(contreCard){ contreCard.style.border='2px solid rgba(255,77,109,0.5)'; contreCard.style.background='rgba(255,77,109,0.18)' }
    if(pourCard)  { pourCard.style.border='1.5px solid rgba(59,130,246,0.15)'; pourCard.style.background='rgba(59,130,246,0.05)' }
    if(contreDot) { contreDot.style.background='#FF4D6D'; contreDot.style.boxShadow='0 0 8px #FF4D6D'; contreDot.style.opacity='1' }
    if(pourDot)   { pourDot.style.background='rgba(255,255,255,0.15)'; pourDot.style.boxShadow='none' }
    if(sub && contreName) sub.innerHTML=`<strong>${contreName.textContent}</strong> parle — elle argumente <strong style="color:#FF4D6D">CONTRE</strong>.`
  }

  duelSec = 45; updateDuelTimer()
}

// ── VRAI/FAUX — 2-phase logic ──
const tfAllQuestions=[
  'Les chats sont plus intelligents que les chiens.',
  'On devrait travailler 4 jours par semaine.',
  'L\'école devrait commencer à 10h.',
  'Les superhéros Marvel sont meilleurs que DC.',
  'Manger des insectes deviendra normal d\'ici 10 ans.',
  'Internet a rendu les gens plus heureux.',
  'Le sport devrait être obligatoire tous les jours.',
  'Les films en VO sont meilleurs qu\'en VF.',
  'Il faudrait un revenu universel.',
  'Les réseaux sociaux font plus de mal que de bien.',
]

let tfState = {
  questions: [],
  current: 0,        // phase 1: current question index
  votes: {},         // { 0:{p1:'vrai',p2:'faux'}, 1:{...}, ... }
  disagreements: [], // indices where they disagreed
  debIdx: 0,         // phase 2: current disagreement index
}

const TF_AV = { p1:'🦊', p2:'🐸' }

function initTF(){
  clearInterval(tfTimerInt)
  const nb = (settingVals['nb_questions'] ?? 10)
  tfState.questions = tfAllQuestions.slice(0, Math.min(nb, tfAllQuestions.length))
  tfState.current = 0
  tfState.votes = {}
  tfState.disagreements = []
  tfState.debIdx = 0
  renderTFVoteScreen()
}

let tfTimerInt = null
const TF_VOTE_DURATION = 10

function renderTFVoteScreen(){
  const q = tfState.questions[tfState.current]
  // Update BOTH question elements (one per player)
  ;['tf-question-p1','tf-question-p2'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.textContent=q
  })
  const num=document.getElementById('tf-q-num'); if(num) num.textContent=tfState.current+1
  const tot=document.getElementById('tf-q-total'); if(tot) tot.textContent=tfState.questions.length
  // Reset buttons
  ;['p1','p2'].forEach(p=>{
    const bv=document.getElementById('btn-vrai-'+p)
    const bf=document.getElementById('btn-faux-'+p)
    if(bv){bv.style.opacity='1';bv.style.transform='';bv.disabled=false}
    if(bf){bf.style.opacity='1';bf.style.transform='';bf.disabled=false}
    const dot=document.getElementById('tf-dot-'+p)
    if(dot){dot.style.background='rgba(255,255,255,0.2)';dot.style.boxShadow='none'}
  })
  delete tfState.votes[tfState.current]
  // Start 10s timer
  startTFTimer()
}

function startTFTimer(){
  clearInterval(tfTimerInt)
  let sec = TF_VOTE_DURATION
  updateTFTimerUI(sec)
  tfTimerInt = setInterval(()=>{
    sec--
    updateTFTimerUI(sec)
    if(sec <= 0){
      clearInterval(tfTimerInt)
      // Auto-advance: assign random vote to whoever hasn't voted
      const cv = tfState.votes[tfState.current] || {}
      if(!cv.p1) tfState.votes[tfState.current] = {...cv, p1: Math.random()>.5?'vrai':'faux'}
      if(!cv.p2) tfState.votes[tfState.current] = {...tfState.votes[tfState.current], p2: Math.random()>.5?'vrai':'faux'}
      advanceTFVote()
    }
  }, 1000)
}

function updateTFTimerUI(sec){
  const color = sec > 6 ? '#10B981' : sec > 3 ? '#F59E0B' : '#FF4D6D'
  const pct = (sec / TF_VOTE_DURATION) * 100

  // Both timers (one per player side)
  ;['p1','p2'].forEach(p => {
    const num = document.getElementById('tf-timer-'+p)
    const bar = document.getElementById('tf-bar-'+p)
    if(num){ num.textContent = sec; num.style.color = color }
    if(bar){ bar.style.width = pct+'%'; bar.style.background = color }
  })
}

function tfVoteP(player, val, btn){
  if(!tfState.votes[tfState.current]) tfState.votes[tfState.current] = {}
  if(tfState.votes[tfState.current][player]) return // prevent double vote
  tfState.votes[tfState.current][player] = val
  // Lock that player's buttons
  const bv=document.getElementById('btn-vrai-'+player)
  const bf=document.getElementById('btn-faux-'+player)
  if(bv){bv.style.opacity='0.3';bv.disabled=true}
  if(bf){bf.style.opacity='0.3';bf.disabled=true}
  btn.style.opacity='1'
  btn.style.transform='scale(1.06)'
  // Light up dot
  const dot=document.getElementById('tf-dot-'+player)
  if(dot){dot.style.background='#10B981';dot.style.boxShadow='0 0 8px #10B981'}
  // Both voted? → stop timer and advance immediately
  const cv = tfState.votes[tfState.current]
  if(cv.p1 && cv.p2){
    clearInterval(tfTimerInt)
    // Small flash then next
    setTimeout(()=>advanceTFVote(), 400)
  }
}

function advanceTFVote(){
  const cv = tfState.votes[tfState.current]
  // record disagreement
  if(cv.p1 !== cv.p2) tfState.disagreements.push(tfState.current)
  tfState.current++
  if(tfState.current < tfState.questions.length){
    renderTFVoteScreen()
  } else {
    // Phase 1 done → go to phase 2
    startTFDebate()
  }
}

function startTFDebate(){
  clearInterval(tfTimerInt)
  tfState.debIdx = 0
  if(tfState.disagreements.length === 0){
    showTFEnd()
    return
  }
  renderTFDebateScreen()
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active','out'))
  setTimeout(()=>document.getElementById('s-tf-debate').classList.add('active'),80)
}

function renderTFDebateScreen(){
  const qIdx = tfState.disagreements[tfState.debIdx]
  const q = tfState.questions[qIdx]
  const votes = tfState.votes[qIdx]
  // question
  const qEl=document.getElementById('tf-deb-question'); if(qEl) qEl.textContent=q
  // counter
  const num=document.getElementById('tf-deb-num'); if(num) num.textContent=tfState.debIdx+1
  const tot=document.getElementById('tf-deb-total'); if(tot) tot.textContent=tfState.disagreements.length
  // votes display
  const p1vote=votes.p1==='vrai'?'VRAI ✅':'FAUX ❌'
  const p2vote=votes.p2==='vrai'?'VRAI ✅':'FAUX ❌'
  const p1col=votes.p1==='vrai'?'#10B981':'#FF4D6D'
  const p2col=votes.p2==='vrai'?'#10B981':'#FF4D6D'
  const v1=document.getElementById('tf-deb-p1-vote'); if(v1){v1.textContent=p1vote;v1.style.color=p1col}
  const v2=document.getElementById('tf-deb-p2-vote'); if(v2){v2.textContent=p2vote;v2.style.color=p2col}
  // avatars
  const av1=document.getElementById('tf-deb-p1-av'); if(av1) av1.textContent=TF_AV.p1
  const av2=document.getElementById('tf-deb-p2-av'); if(av2) av2.textContent=TF_AV.p2
}

function nextTFDebate(){
  tfState.debIdx++
  if(tfState.debIdx < tfState.disagreements.length){
    renderTFDebateScreen()
  } else {
    showTFEnd()
  }
}

function showTFEnd(){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active','out'))
  setTimeout(()=>{
    const screen = document.getElementById('s-tf-end')
    if(screen){
      const nb = document.getElementById('tf-end-nb')
      if(nb) nb.textContent = tfState.disagreements.length
      screen.classList.add('active')
    }
  },80)
}
// Imposteur timer
function startImpTimer(){
  clearInterval(impTimerInt)
  var dur = (typeof getImpDurationSeconds === 'function') ? getImpDurationSeconds() : 45
  impSec = dur
  updateImpTimer()
  impTimerInt=setInterval(()=>{
    impSec--
    if(impSec<=0){
      impSec=0
      updateImpTimer()
      clearInterval(impTimerInt)
      var cta = document.getElementById('imp-vote-cta'); if(cta) cta.style.display = 'block'
      var skip = document.getElementById('imp-btn-skip'); if(skip) skip.style.display = 'none'
      return
    }
    updateImpTimer()
  },1000)
}
function updateImpTimer(){
  const el=document.getElementById('imp-timer'); if(el) el.textContent=impSec
  const arc=document.getElementById('imp-arc')
  if(arc){
    const pct=impSec/((typeof getImpDurationSeconds==='function')?getImpDurationSeconds():45)
    arc.style.strokeDashoffset=150.8*(1-pct)
    arc.style.stroke=impSec>15?'#8B5CF6':impSec>8?'#F59E0B':'#FF4D6D'
  }
}
function nextImpTurn(){
  impTourN=impTourN>=3?1:impTourN+1
  const t=document.getElementById('imp-tour'); if(t) t.textContent=impTourN
  impSec=45; updateImpTimer()
}
function impVote(){
  showPodium()
}


// ── DÉBAT CLASSIQUE — TIMER v22 ──
let debateTimerInt = null
let debateTimerSec = 0
let debateTimerTotal = 0

function getDebateDurationSeconds(){
  const idx = settingVals['time_debate'] ?? 0
  if(idx === 0) return 0
  if(idx === 1) return 180
  if(idx === 2) return 360
  if(idx === 3) return 540
  if(idx === 4) {
    const input = document.getElementById('custom-input-time_debate')
    const minutes = input ? parseInt(input.value, 10) : NaN
    if(Number.isFinite(minutes)) return Math.max(1, Math.min(120, minutes)) * 60
    return 300
  }
  return 0
}

function startDebateTimer(){
  clearInterval(debateTimerInt)
  const box = document.getElementById('debate-timer-box')
  const dur = getDebateDurationSeconds()
  if(!box) return
  if(!dur){
    box.style.display = 'none'
    return
  }
  box.style.display = 'flex'
  debateTimerTotal = dur
  debateTimerSec = dur
  updateDebateTimer()
  debateTimerInt = setInterval(function(){
    debateTimerSec--
    if(debateTimerSec <= 0){
      debateTimerSec = 0
      updateDebateTimer()
      clearInterval(debateTimerInt)
      return
    }
    updateDebateTimer()
  }, 1000)
}

function updateDebateTimer(){
  const label = document.getElementById('debate-timer-label')
  const bar = document.getElementById('debate-timer-bar')
  const min = Math.floor(debateTimerSec / 60)
  const sec = String(debateTimerSec % 60).padStart(2, '0')
  const pct = debateTimerTotal ? (debateTimerSec / debateTimerTotal) * 100 : 0
  const color = pct > 40 ? '#FF4D6D' : pct > 20 ? '#F59E0B' : '#EF4444'
  if(label){ label.textContent = String(min).padStart(2, '0') + ':' + sec; label.style.color = color }
  if(bar){ bar.style.width = pct + '%'; bar.style.background = color }
}
