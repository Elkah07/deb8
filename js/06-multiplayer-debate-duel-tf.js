// ═══════════════════════════════════════════════════
// MULTI — DÉBAT CLASSIQUE
// ═══════════════════════════════════════════════════
var multiDebState = { isHost:false, myIdx:0, players:[], qIdx:0, questions:[], totalQ:8 }

function previewMultiDebate(isHost) {
  playerNames = ['Alex','Léa','Sam','Zoé']
  pcount = 4
  var qs = ['Le télétravail devrait être la norme.','Les réseaux sociaux font plus de mal que de bien.','Il faudrait un revenu universel.','L\'école devrait commencer à 10h.','Les films en VO sont meilleurs qu\'en VF.','Le sport devrait être obligatoire chaque jour.','L\'intelligence artificielle va détruire des emplois.','Manger des insectes deviendra normal d\'ici 10 ans.']
  multiDebState.isHost = isHost
  multiDebState.myIdx = isHost ? 0 : 1
  multiDebState.questions = qs
  multiDebState.qIdx = 0
  multiDebState.totalQ = qs.length
  multiDebState.players = playerNames.map(function(n,i){ var avs=['🦊','🐙','🐸','🦋']; return {name:n, av:avs[i]} })
  renderMultiDebateScreen()
  goToScreen('s-multi-debate')
  showVocalJoinBtn()
}

function renderMultiDebateScreen() {
  var q = multiDebState.questions[multiDebState.qIdx]
  var el = document.getElementById('md-question'); if(el) el.textContent = q
  var n = document.getElementById('md-q-num'); if(n) n.textContent = multiDebState.qIdx+1
  var t = document.getElementById('md-q-total'); if(t) t.textContent = multiDebState.totalQ
  // Starter: random player
  var starterIdx = Math.floor(Math.random()*multiDebState.players.length)
  var starter = multiDebState.players[starterIdx]
  var sa = document.getElementById('md-starter-av'); if(sa) sa.textContent = starter.av
  var sn = document.getElementById('md-starter-name'); if(sn) sn.textContent = starter.name
  // Players row
  var row = document.getElementById('md-players-row')
  if(row) {
    var colors = ['#FF4D6D','#3B82F6','#10B981','#8B5CF6']
    row.innerHTML = multiDebState.players.map(function(p,i){
      return '<div style="display:flex;flex-direction:column;align-items:center;gap:3px"><div style="width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;background:'+colors[i%4]+'22;border:2px solid '+colors[i%4]+'44">'+p.av+'</div><div style="font-size:9px;color:var(--muted)">'+p.name+'</div></div>'
    }).join('')
  }
  var hc = document.getElementById('md-host-controls'); if(hc) hc.style.display = multiDebState.isHost ? 'flex' : 'none'
  var pc = document.getElementById('md-player-controls'); if(pc) pc.style.display = multiDebState.isHost ? 'none' : 'block'
}

function multiDebateNext() {
  multiDebState.qIdx = (multiDebState.qIdx+1) % multiDebState.questions.length
  renderMultiDebateScreen()
}
function multiDebateSkip() { multiDebateNext() }

// ═══════════════════════════════════════════════════
// MULTI — 1V1 + ARBITRE
// ═══════════════════════════════════════════════════
var multiDuelState = {
  role: 'pour',   // 'pour' | 'contre' | 'arbitre'
  tour: 1, totalTours: 5,
  scores: {pour:0, contre:0},
  players: {pour:{name:'Alex',av:'🦊'}, contre:{name:'Léa',av:'🐙'}, arbitre:{name:'Sam',av:'🐸'}},
  question: 'Le télétravail devrait être la norme.',
  speakersDone: [],
  timerInt: null, timerSec: 45,
}

function previewMultiDuel(role) {
  multiDuelState.role = role
  multiDuelState.tour = 1
  multiDuelState.totalTours = 5
  multiDuelState.scores = {pour:0, contre:0}
  multiDuelState.speakersDone = []
  multiDuelState.timerSec = 45
  renderMultiDuelScreen()
  var screenMap = {pour:'s-multi-duel-pour', contre:'s-multi-duel-contre', arbitre:'s-multi-duel-arb'}
  goToScreen(screenMap[role])
  if(role !== 'arbitre') startMultiDuelTimer(role)
  else renderMultiArbScreen()
  showVocalJoinBtn()
}

function renderMultiDuelScreen() {
  var role = multiDuelState.role
  var t = multiDuelState.tour, nb = multiDuelState.totalTours
  var q = multiDuelState.question
  if(role === 'pour') {
    var tn = document.getElementById('mdp-tour'); if(tn) tn.textContent = t
    var tt = document.getElementById('mdp-total'); if(tt) tt.textContent = nb
    var qe = document.getElementById('mdp-question'); if(qe) qe.textContent = q
    var st = document.getElementById('mdp-active-banner')
    if(st){ st.textContent = '🎙️ C\'est ton tour — argumente POUR !'; st.style.color='#3B82F6' }
  } else if(role === 'contre') {
    var tn2 = document.getElementById('mdc-tour'); if(tn2) tn2.textContent = t
    var tt2 = document.getElementById('mdc-total'); if(tt2) tt2.textContent = nb
    var qe2 = document.getElementById('mdc-question'); if(qe2) qe2.textContent = q
    var st2 = document.getElementById('mdc-status')
    if(st2){ st2.textContent = '⏳ Attends que POUR finisse…'; st2.style.color='var(--muted)' }
  }
}

function renderMultiArbScreen() {
  var p = multiDuelState.players
  var t = multiDuelState.tour, nb = multiDuelState.totalTours
  ;[['mda-tour',t],['mda-total',nb],['mda-question',multiDuelState.question],
    ['mda-av-pour',p.pour.av],['mda-name-pour',p.pour.name],
    ['mda-av-contre',p.contre.av],['mda-name-contre',p.contre.name],
    ['mda-vp-av-pour',p.pour.av],['mda-vp-name-pour',p.pour.name],
    ['mda-vp-av-contre',p.contre.av],['mda-vp-name-contre',p.contre.name]
  ].forEach(function(pair){ var el=document.getElementById(pair[0]); if(el) el.textContent=pair[1] })
  var st = document.getElementById('mda-status')
  if(st){ st.textContent = '⏳ '+p.pour.name+' argumente POUR…' }
  var sd = document.getElementById('mda-score-display')
  if(sd){ sd.textContent = p.pour.name+' '+multiDuelState.scores.pour+' — '+p.contre.name+' '+multiDuelState.scores.contre }
}

function startMultiDuelTimer(role) {
  clearInterval(multiDuelState.timerInt)
  multiDuelState.timerSec = 45
  updateMultiDuelTimer(role)
  multiDuelState.timerInt = setInterval(function(){
    multiDuelState.timerSec--
    updateMultiDuelTimer(role)
    if(multiDuelState.timerSec <= 0) {
      clearInterval(multiDuelState.timerInt)
      // Auto signal done
      multiDuelNextSpeaker(role)
    }
  }, 1000)
}

function updateMultiDuelTimer(role) {
  var sec = multiDuelState.timerSec
  var pct = sec/45
  var col = pct > 0.4 ? (role==='pour'?'#3B82F6':'#FF4D6D') : pct > 0.2 ? '#F59E0B' : '#FF4D6D'
  var prefix = role === 'pour' ? 'mdp' : 'mdc'
  var te = document.getElementById(prefix+'-timer'); if(te){ te.textContent=sec; te.style.color=col }
  var arc = document.getElementById(prefix+'-arc')
  if(arc){ arc.style.strokeDashoffset=150.8*(1-pct); arc.style.stroke=col }
  // Arbitre also sees timer
  var ta = document.getElementById('mda-timer'); if(ta){ ta.textContent=sec; ta.style.color='#F59E0B' }
  var aa = document.getElementById('mda-arc')
  if(aa){ aa.style.strokeDashoffset=150.8*(1-pct); aa.style.stroke=pct>0.4?'#F59E0B':pct>0.2?'#F59E0B':'#FF4D6D' }
}

function multiDuelNextSpeaker(role) {
  clearInterval(multiDuelState.timerInt)
  if(multiDuelState.speakersDone.indexOf(role) < 0) multiDuelState.speakersDone.push(role)
  if(multiDuelState.speakersDone.length >= 2) {
    // Both done → show arbitre verdict
    multiDuelState.speakersDone = []
    var popup = document.getElementById('mda-vote-popup')
    if(popup){ popup.style.display='flex'; popup.style.opacity='0'; popup.style.transform='scale(0.95)'
      requestAnimationFrame(function(){ requestAnimationFrame(function(){
        popup.style.transition='opacity .25s,transform .25s'; popup.style.opacity='1'; popup.style.transform='scale(1)'
      })})
    }
    // Update status on player screens
    var sp = document.getElementById('mdp-active-banner'); if(sp){ sp.textContent='⏳ L\'arbitre tranche…'; sp.style.color='var(--muted)' }
    var sc = document.getElementById('mdc-status'); if(sc){ sc.textContent='⏳ L\'arbitre tranche…' }
    var sa = document.getElementById('mda-status'); if(sa){ sa.textContent='🏛️ Verdict !' ; sa.style.color='#F59E0B' }
  } else {
    // Switch speaker
    var other = role === 'pour' ? 'contre' : 'pour'
    // Update status messages
    if(role === 'pour') {
      var sp2 = document.getElementById('mdp-active-banner'); if(sp2){ sp2.textContent='✅ Tu as terminé — attends le verdict'; sp2.style.color='#10B981' }
      var sc2 = document.getElementById('mdc-status'); if(sc2){ sc2.textContent='🎙️ C\'est ton tour — argumente CONTRE !'; sc2.style.color='#FF4D6D' }
      var sa2 = document.getElementById('mda-status'); if(sa2){ sa2.textContent='⏳ '+multiDuelState.players.contre.name+' argumente CONTRE…' }
    } else {
      var sc3 = document.getElementById('mdc-status'); if(sc3){ sc3.textContent='✅ Tu as terminé — attends le verdict'; sc3.style.color='#10B981' }
      var sp3 = document.getElementById('mdp-active-banner'); if(sp3){ sp3.textContent='🎙️ C\'est ton tour — argumente POUR !'; sp3.style.color='#3B82F6' }
    }
    startMultiDuelTimer(other)
  }
}

function multiArbVote(winner) {
  multiDuelState.scores[winner]++
  var popup = document.getElementById('mda-vote-popup')
  if(popup){ popup.style.opacity='0'; setTimeout(function(){ popup.style.display='none'; popup.style.transition='' },260) }
  multiDuelState.tour++
  if(multiDuelState.tour > multiDuelState.totalTours) {
    // End
    goToScreen('s-podium')
    return
  }
  renderMultiArbScreen()
  var sp = document.getElementById('mdp-active-banner'); if(sp){ sp.textContent='🎙️ C\'est ton tour — argumente POUR !'; sp.style.color='#3B82F6' }
  var sc = document.getElementById('mdc-status'); if(sc){ sc.textContent='⏳ Attends que POUR finisse…'; sc.style.color='var(--muted)' }
  startMultiDuelTimer(multiDuelState.role === 'arbitre' ? 'pour' : multiDuelState.role)
}

// ═══════════════════════════════════════════════════
// MULTI — VRAI / FAUX
// ═══════════════════════════════════════════════════
var multiTFState = {
  myIdx: 0, players: [], questions: [], qIdx: 0,
  votes: {},    // { qIdx: { playerIdx: 'vrai'|'faux' } }
  timerInt: null, timerSec: 10, myVote: null
}
var TF_MULTI_DURATION = 10

function previewMultiTF(myIdx) {
  playerNames = ['Alex','Léa','Sam','Zoé']
  pcount = 4
  multiTFState.myIdx = myIdx || 0
  multiTFState.players = playerNames.map(function(n,i){ var avs=['🦊','🐙','🐸','🦋']; return {name:n,av:avs[i]} })
  multiTFState.questions = tfAllQuestions
  multiTFState.qIdx = 0
  multiTFState.votes = {}
  multiTFState.myVote = null
  renderMultiTFScreen()
  goToScreen('s-multi-tf')
  startMultiTFTimer()
  showVocalJoinBtn()
}

function renderMultiTFScreen() {
  var q = multiTFState.questions[multiTFState.qIdx]
  var qe = document.getElementById('mtf-question'); if(qe) qe.textContent = q
  var n = document.getElementById('mtf-num'); if(n) n.textContent = multiTFState.qIdx+1
  var t = document.getElementById('mtf-total'); if(t) t.textContent = multiTFState.questions.length
  // Reset vote UI
  multiTFState.myVote = null
  var mv = document.getElementById('mtf-my-vote'); if(mv) mv.style.display='flex'
  var vm = document.getElementById('mtf-voted-msg'); if(vm) vm.style.display='none'
  var bv = document.getElementById('mtf-btn-vrai'); if(bv){ bv.style.opacity='1'; bv.style.transform=''; bv.disabled=false }
  var bf = document.getElementById('mtf-btn-faux'); if(bf){ bf.style.opacity='1'; bf.style.transform=''; bf.disabled=false }
  // Votes row — show pending dots
  var row = document.getElementById('mtf-votes-row')
  if(row) {
    var colors = ['#FF4D6D','#3B82F6','#10B981','#8B5CF6']
    row.innerHTML = multiTFState.players.map(function(p,i){
      return '<div style="display:flex;flex-direction:column;align-items:center;gap:3px"><div style="font-size:18px">'+p.av+'</div><div id="mtf-dot-'+i+'" style="width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,0.15)"></div></div>'
    }).join('')
  }
}

function startMultiTFTimer() {
  clearInterval(multiTFState.timerInt)
  multiTFState.timerSec = TF_MULTI_DURATION
  updateMultiTFTimer()
  multiTFState.timerInt = setInterval(function(){
    multiTFState.timerSec--
    updateMultiTFTimer()
    if(multiTFState.timerSec <= 0) {
      clearInterval(multiTFState.timerInt)
      // Auto vote if not voted
      if(!multiTFState.myVote) castMultiTFVote(Math.random()>0.5?'vrai':'faux')
      else finishMultiTFVote()
    }
  }, 1000)
}

function updateMultiTFTimer() {
  var sec = multiTFState.timerSec
  var pct = sec / TF_MULTI_DURATION
  var col = pct>0.6?'#10B981':pct>0.3?'#F59E0B':'#FF4D6D'
  var te = document.getElementById('mtf-timer'); if(te){ te.textContent=sec; te.style.color=col }
  var arc = document.getElementById('mtf-arc')
  if(arc){ arc.style.strokeDashoffset=150.8*(1-pct); arc.style.stroke=col }
}

function castMultiTFVote(val) {
  if(multiTFState.myVote) return
  multiTFState.myVote = val
  clearInterval(multiTFState.timerInt)
  // Lock buttons
  var bv = document.getElementById('mtf-btn-vrai'); if(bv){ bv.disabled=true; bv.style.opacity = val==='vrai'?'1':'0.3'; if(val==='vrai') bv.style.transform='scale(1.05)' }
  var bf = document.getElementById('mtf-btn-faux'); if(bf){ bf.disabled=true; bf.style.opacity = val==='faux'?'1':'0.3'; if(val==='faux') bf.style.transform='scale(1.05)' }
  // Light up my dot
  var dot = document.getElementById('mtf-dot-'+multiTFState.myIdx)
  if(dot){ dot.style.background = val==='vrai'?'#10B981':'#FF4D6D'; dot.style.boxShadow='0 0 6px '+(val==='vrai'?'#10B981':'#FF4D6D') }
  // Show voted msg
  var mv = document.getElementById('mtf-my-vote'); if(mv) mv.style.display='none'
  var vm = document.getElementById('mtf-voted-msg'); if(vm) vm.style.display='block'
  var vi = document.getElementById('mtf-my-vote-icon'); if(vi) vi.textContent = val==='vrai'?'✅':'❌'
  // Simulate others voting
  if(!multiTFState.votes[multiTFState.qIdx]) multiTFState.votes[multiTFState.qIdx]={}
  multiTFState.votes[multiTFState.qIdx][multiTFState.myIdx] = val
  var delays = [400,800,1100,1500]
  multiTFState.players.forEach(function(p,i){
    if(i===multiTFState.myIdx) return
    setTimeout(function(){
      var v = Math.random()>0.5?'vrai':'faux'
      multiTFState.votes[multiTFState.qIdx][i] = v
      var d = document.getElementById('mtf-dot-'+i)
      if(d){ d.style.background=v==='vrai'?'#10B981':'#FF4D6D'; d.style.boxShadow='0 0 6px '+(v==='vrai'?'#10B981':'#FF4D6D') }
      var allVoted = Object.keys(multiTFState.votes[multiTFState.qIdx]).length >= multiTFState.players.length
      if(allVoted) setTimeout(finishMultiTFVote, 400)
    }, delays[i] || i*400)
  })
}

function finishMultiTFVote() {
  var qIdx = multiTFState.qIdx
  var q = multiTFState.questions[qIdx]
  var votes = multiTFState.votes[qIdx] || {}
  var qe = document.getElementById('mtfr-question'); if(qe) qe.textContent = q
  // Build results
  var pEl = document.getElementById('mtfr-players')
  if(pEl) {
    var colors = ['#FF4D6D','#3B82F6','#10B981','#8B5CF6']
    pEl.innerHTML = multiTFState.players.map(function(p,i){
      var v = votes[i] || '?'
      return '<div style="background:var(--card);border:1.5px solid var(--border);border-radius:14px;padding:10px 14px;display:flex;align-items:center;gap:10px">'+
        '<div style="font-size:22px">'+p.av+'</div>'+
        '<div style="flex:1;font-size:13px;font-weight:700">'+p.name+'</div>'+
        '<div style="font-family:var(--font-head);font-size:16px;color:'+(v==='vrai'?'#10B981':'#FF4D6D')+'">'+(v==='vrai'?'✅ VRAI':'❌ FAUX')+'</div>'+
        '</div>'
    }).join('')
  }
  // Agreement?
  var vList = Object.values(votes)
  var allSame = vList.length > 0 && vList.every(function(v){ return v===vList[0] })
  var agEl = document.getElementById('mtfr-agreement')
  if(agEl) {
    if(allSame){ agEl.style.background='rgba(16,185,129,0.1)'; agEl.style.color='#10B981'; agEl.style.border='1.5px solid rgba(16,185,129,0.3)'; agEl.textContent='🤝 Accord total !' }
    else { agEl.style.background='rgba(255,77,109,0.08)'; agEl.style.color='#FF4D6D'; agEl.style.border='1.5px solid rgba(255,77,109,0.25)'; agEl.textContent='💥 Désaccord — débat à suivre !' }
  }
  var nb = document.getElementById('mtfr-next-btn')
  if(nb){ nb.textContent = multiTFState.qIdx >= multiTFState.questions.length-1 ? '🏁 Fin' : 'Question suivante →' }
  goToScreen('s-multi-tf-result')
}

function multiTFNext() {
  multiTFState.qIdx++
  if(multiTFState.qIdx >= multiTFState.questions.length){
    goToScreen('s-tf-end')
    return
  }
  renderMultiTFScreen()
  goToScreen('s-multi-tf')
  startMultiTFTimer()
}
