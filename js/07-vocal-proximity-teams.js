// ═══════════════════════════════════════════════════
// VOCAL — WebRTC UI (maquette)
// ═══════════════════════════════════════════════════
var vocalState = { active:false, muted:false, speakerOn:true, participants:[] }

function showVocalJoinBtn() {
  var btn = document.getElementById('vocal-join-btn'); if(btn) btn.style.display='block'
}

function joinVocalCall() {
  vocalState.active = true
  vocalState.muted = false
  vocalState.speakerOn = true
  vocalState.participants = (typeof playerNames!=='undefined' && playerNames.length>0) ? playerNames : ['Alex','Léa','Sam','Zoé']
  var jb = document.getElementById('vocal-join-btn'); if(jb) jb.style.display='none'
  var ov = document.getElementById('vocal-overlay'); if(ov) ov.style.display='block'
  renderVocalParticipants()
}

function renderVocalParticipants() {
  var el = document.getElementById('vocal-participants')
  if(!el) return
  var avs = ['🦊','🐙','🐸','🦋','🐼','🦁','🐯','🦄']
  var colors = ['#FF4D6D','#3B82F6','#10B981','#8B5CF6']
  el.innerHTML = vocalState.participants.map(function(name,i){
    var speaking = i===0 // simulate first person speaking
    return '<div style="display:flex;flex-direction:column;align-items:center;gap:3px">'+
      '<div style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;background:'+colors[i%4]+'22;border:2px solid '+(speaking?colors[i%4]+'99':'transparent')+';'+(speaking?'box-shadow:0 0 0 2px '+colors[i%4]+'44':'')+'">' +avs[i%8]+ '</div>'+
      '<div style="font-size:9px;color:var(--muted);font-weight:600">'+name+'</div>'+
      (speaking?'<div style="width:6px;height:6px;border-radius:50%;background:#10B981;animation:blinkDot 1s infinite"></div>':'<div style="width:6px;height:6px;border-radius:50%;background:transparent"></div>')+
      '</div>'
  }).join('')
}

function toggleVocalMute() {
  vocalState.muted = !vocalState.muted
  var btn = document.getElementById('vocal-mute-btn')
  if(btn) {
    btn.textContent = vocalState.muted ? '🔇 Muet' : '🎙️ Micro ON'
    btn.style.background = vocalState.muted ? 'rgba(255,77,109,0.15)' : 'rgba(255,255,255,0.06)'
    btn.style.borderColor = vocalState.muted ? 'rgba(255,77,109,0.4)' : 'rgba(255,255,255,0.12)'
    btn.style.color = vocalState.muted ? '#FF4D6D' : '#fff'
  }
}

function toggleVocalSpeaker() {
  vocalState.speakerOn = !vocalState.speakerOn
  var btn = document.getElementById('vocal-spk-btn')
  if(btn) {
    btn.textContent = vocalState.speakerOn ? '🔊 Haut-parleur' : '🔈 Faible'
    btn.style.background = vocalState.speakerOn ? 'rgba(255,255,255,0.06)' : 'rgba(245,158,11,0.12)'
    btn.style.borderColor = vocalState.speakerOn ? 'rgba(255,255,255,0.12)' : 'rgba(245,158,11,0.3)'
    btn.style.color = vocalState.speakerOn ? '#fff' : '#F59E0B'
  }
}

function closeVocal() {
  var ov = document.getElementById('vocal-overlay'); if(ov) ov.style.display='none'
  var jb = document.getElementById('vocal-join-btn'); if(jb) jb.style.display='block'
  vocalState.active = false
}

function endVocalCall() {
  var ov = document.getElementById('vocal-overlay'); if(ov) ov.style.display='none'
  var jb = document.getElementById('vocal-join-btn'); if(jb) jb.style.display='none'
  vocalState.active = false
}


// ═══════════════════════════════════════════════════
// PROXIMITÉ — Même pièce vs À distance
// ═══════════════════════════════════════════════════
var proximityMode = null  // 'local' | 'remote'

function selProximity(mode) {
  proximityMode = mode
  // Highlight selected card
  var cards = ['prox-local', 'prox-remote']
  cards.forEach(function(id) {
    var el = document.getElementById(id)
    if(!el) return
    if(id === 'prox-' + mode) {
      el.style.border = '2px solid ' + (mode==='remote' ? 'rgba(16,185,129,0.5)' : 'rgba(255,77,109,0.5)')
      el.style.background = mode==='remote' ? 'rgba(16,185,129,0.06)' : 'rgba(255,77,109,0.06)'
    } else {
      el.style.border = ''
      el.style.background = ''
    }
  })
  // Show vocal preview if remote
  var vp = document.getElementById('prox-vocal-preview')
  if(vp) vp.style.display = mode === 'remote' ? 'flex' : 'none'
  // Unlock launch button
  var btn = document.getElementById('btn-prox-launch')
  if(btn) { btn.style.opacity='1'; btn.style.pointerEvents='auto' }
}

function launchFromProximity() {
  if(!proximityMode) return
  // If remote, auto-join vocal when game starts
  if(proximityMode === 'remote') {
    // Will be called after goToScreen in each multi launch
    window._autoVocal = true
  } else {
    window._autoVocal = false
    // Hide vocal button entirely
    var jb = document.getElementById('vocal-join-btn'); if(jb) jb.style.display='none'
  }
  // Go to normal game launch
  launchGame()
}

// Override showVocalJoinBtn to respect proximity
var _origShowVocalJoinBtn = typeof showVocalJoinBtn === 'function' ? showVocalJoinBtn : function(){}
showVocalJoinBtn = function() {
  if(window._autoVocal === false) return
  if(window._autoVocal === true) {
    // Auto-join
    setTimeout(joinVocalCall, 600)
    return
  }
  // Default: show button
  var btn = document.getElementById('vocal-join-btn'); if(btn) btn.style.display='block'
}


// ═══════════════════════════════════════════════════
// PASSER LA QUESTION (sans comptabiliser)
// ═══════════════════════════════════════════════════
function skipTFQuestion(){
  // Reset votes, pick next question without moving tfState.current counter
  clearInterval(tfTimerInt)
  // Swap current question for a fresh one from the pool not yet seen
  var seen = Object.keys(tfState.votes).map(Number)
  seen.push(tfState.current)
  var unused = []
  for(var i=0;i<tfAllQuestions.length;i++){
    if(seen.indexOf(i)<0) unused.push(i)
  }
  if(unused.length === 0) { nextTFQ(); return } // fallback
  var newIdx = unused[Math.floor(Math.random()*unused.length)]
  tfState.questions[tfState.current] = tfAllQuestions[newIdx]
  renderTFVoteScreen()
  startTFTimer()
}

function skipDuelQuestion(){
  clearInterval(duelTimerInt)
  // Pick a different question (not current)
  var newIdx
  do { newIdx = Math.floor(Math.random()*duelQuestions.length) }
  while(duelQuestions[newIdx] === document.getElementById('duel-question').textContent && duelQuestions.length > 1)
  var el = document.getElementById('duel-question')
  if(el) el.textContent = duelQuestions[newIdx]
  // Restart timer for current speaker
  duelSec = duelState.timePerTour[duelState.currentTour-1] || 45
  renderDuelScreen()
  startDuelTimer()
}

function skipImpQuestion(){
  clearInterval(impTimerInt)
  // Re-roll subjects
  var subject = IMP_SUBJECTS[Math.floor(Math.random()*IMP_SUBJECTS.length)]
  var decoy   = IMP_DECOYS[Math.floor(Math.random()*IMP_DECOYS.length)]
  for(var i=0;i<impState.players.length;i++){
    if(impState.players[i].role==='impostor') impState.players[i].subject = decoy
    else { impState.players[i].subject = subject; impState.players[i].realSubject = subject }
  }
  // Reset and show role distribution again so each player sees new subject
  impState.currentRoleIdx = 0
  renderImpRoleScreen()
  document.querySelectorAll('.screen').forEach(function(s){ s.classList.remove('active','out') })
  setTimeout(function(){ document.getElementById('s-imp-roles').classList.add('active') }, 80)
}

// ═══════════════════════════════════════════════════
// MULTI — BIENTÔT DISPONIBLE
// ═══════════════════════════════════════════════════
function showComingSoon(){
  // Show a toast/popup
  var existing = document.getElementById('coming-soon-toast')
  if(existing) { existing.style.opacity='1'; setTimeout(function(){ existing.style.opacity='0' },2500); return }
  var toast = document.createElement('div')
  toast.id = 'coming-soon-toast'
  toast.style.cssText = 'position:absolute;bottom:100px;left:50%;transform:translateX(-50%);z-index:999;background:#1C1C2A;border:1.5px solid rgba(139,92,246,0.4);border-radius:16px;padding:14px 20px;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.5);min-width:220px;transition:opacity .4s'
  toast.innerHTML = '<div style="font-size:22px;margin-bottom:6px">🚀</div><div style="font-family:var(--font-head);font-size:15px;color:#fff">Bientôt disponible !</div><div style="font-size:12px;color:#8B5CF6;margin-top:4px">Le multi en ligne arrive très bientôt.</div>'
  document.querySelector('.phone').appendChild(toast)
  setTimeout(function(){ toast.style.opacity='0'; setTimeout(function(){ toast.remove() },400) }, 2500)
}

// ═══════════════════════════════════════════════════
// MODE ÉQUIPE — 1v1
// ═══════════════════════════════════════════════════
var teamMode = false
var teams = { pour: { name: 'Équipe A', members: [] }, contre: { name: 'Équipe B', members: [] } }

function toggleTeamMode(){
  teamMode = !teamMode
  var btn = document.getElementById('team-mode-btn')
  if(btn){
    btn.style.background = teamMode ? 'linear-gradient(135deg,#3B82F6,#6366F1)' : 'transparent'
    btn.style.color = teamMode ? '#fff' : 'var(--muted)'
    btn.style.borderColor = teamMode ? 'transparent' : 'var(--border)'
    btn.textContent = teamMode ? '👥 Mode équipe ON' : '👥 Mode équipe'
  }
  var panel = document.getElementById('team-config-panel')
  if(panel) panel.style.display = teamMode ? 'flex' : 'none'
  if(teamMode) buildTeamConfig()
}

function buildTeamConfig(){
  var panel = document.getElementById('team-config-panel')
  if(!panel) return
  var pNames = (typeof playerNames !== 'undefined' && playerNames.length > 0) ? playerNames : []
  
  function makeTeamBlock(side, color, label) {
    var div = document.createElement('div')
    div.style.cssText = 'background:' + color + '08;border:1.5px solid ' + color + '25;border-radius:16px;padding:14px'
    
    var heading = document.createElement('div')
    heading.style.cssText = 'font-size:10px;color:' + color + ';font-weight:800;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px'
    heading.textContent = 'Équipe ' + label
    div.appendChild(heading)
    
    var inp = document.createElement('input')
    inp.id = 'team-' + side + '-name'
    inp.placeholder = "Nom de l'\u00e9quipe..."
    inp.maxLength = 20
    inp.value = teams[side].name
    inp.style.cssText = 'width:100%;background:' + color + '06;border:1.5px solid ' + color + '20;border-radius:10px;padding:8px 12px;color:#fff;font-size:13px;outline:none;box-sizing:border-box;margin-bottom:8px'
    inp.addEventListener('input', function(){ teams[side].name = inp.value || label })
    div.appendChild(inp)
    
    var membLabel = document.createElement('div')
    membLabel.style.cssText = 'font-size:11px;color:var(--muted);margin-bottom:6px'
    membLabel.textContent = 'Membres :'
    div.appendChild(membLabel)
    
    var membRow = document.createElement('div')
    membRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px'
    
    if(pNames.length === 0) {
      membRow.innerHTML = "<div style=\"font-size:11px;color:var(--muted2)\">Entrez les noms des joueurs d'abord</div>"
    } else {
      pNames.forEach(function(name, i) {
        var inTeam = teams[side].members.indexOf(i) >= 0
        var chip = document.createElement('div')
        chip.style.cssText = 'padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;cursor:pointer;transition:all .2s;background:' + (inTeam ? color+'22' : 'transparent') + ';border:1.5px solid ' + (inTeam ? color : 'rgba(255,255,255,0.1)') + ';color:' + (inTeam ? color : 'var(--muted)')
        chip.textContent = name
        chip.addEventListener('click', function(){ toggleTeamMember(side, i) })
        membRow.appendChild(chip)
      })
    }
    div.appendChild(membRow)
    return div
  }
  
  panel.innerHTML = ''
  panel.appendChild(makeTeamBlock('pour', '#3B82F6', 'POUR'))
  panel.appendChild(makeTeamBlock('contre', '#FF4D6D', 'CONTRE'))
}


function toggleTeamMember(side, idx){
  var other = side === 'pour' ? 'contre' : 'pour'
  // Remove from other team if present
  var oi = teams[other].members.indexOf(idx)
  if(oi >= 0) teams[other].members.splice(oi, 1)
  // Toggle in this team
  var ti = teams[side].members.indexOf(idx)
  if(ti >= 0) teams[side].members.splice(ti, 1)
  else teams[side].members.push(idx)
  buildTeamConfig()
}

function updateTeamName(side){
  var inp = document.getElementById('team-'+side+'-name')
  if(inp) teams[side].name = inp.value || (side === 'pour' ? 'Équipe A' : 'Équipe B')
}


// ═══════════════════════════════════════════════════
// MODE ÉQUIPES
// ═══════════════════════════════════════════════════
var TEAM_COLORS = ['#F59E0B','#3B82F6','#10B981','#FF4D6D','#8B5CF6','#EC4899','#14B8A6','#84CC16']
var TEAM_EMOJIS = ['🔥','💧','🌿','⚡','🌙','🌊','🦋','🏔️']

var teamState = {
  count: 3,
  teams: [],      // [{name, color, emoji, members:[], score}]
  currentPair: [0,1],
  qIdx: 0,
  questions: [],
}

function goTeamSetup(){
  // Init teams
  teamState.count = 3
  teamState.teams = []
  for(var i=0;i<3;i++) addTeam(i)
  renderTeamSetup()
  document.querySelectorAll('.screen').forEach(function(s){ s.classList.remove('active','out') })
  setTimeout(function(){ document.getElementById('s12').classList.add('active') }, 80)
}

function addTeam(i){
  teamState.teams.push({
    name: 'Équipe ' + ['A','B','C','D','E','F','G','H'][i % 8],
    color: TEAM_COLORS[i % TEAM_COLORS.length],
    emoji: TEAM_EMOJIS[i % TEAM_EMOJIS.length],
    members: [],
    score: 0
  })
}

function changeTeamCount(d){
  var next = teamState.count + d
  if(next < 3 || next > 8) return
  teamState.count = next
  // Add or remove teams
  while(teamState.teams.length < next) addTeam(teamState.teams.length)
  while(teamState.teams.length > next) teamState.teams.pop()
  var el = document.getElementById('team-count-val'); if(el) el.textContent = next
  renderTeamSetup()
}

function renderTeamSetup(){
  var list = document.getElementById('teams-list')
  if(!list) return
  list.innerHTML = ''
  var names = (typeof playerNames !== 'undefined' && playerNames.length > 0) ? playerNames : []

  teamState.teams.forEach(function(team, ti){
    var card = document.createElement('div')
    card.style.cssText = 'background:var(--card);border:1.5px solid ' + team.color + '30;border-radius:18px;padding:14px 16px;display:flex;flex-direction:column;gap:10px'

    // Header: emoji + name input
    var header = document.createElement('div')
    header.style.cssText = 'display:flex;align-items:center;gap:10px'

    var emojiEl = document.createElement('div')
    emojiEl.style.cssText = 'width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;background:' + team.color + '20;border:1.5px solid ' + team.color + '40;flex-shrink:0'
    emojiEl.textContent = team.emoji

    var inp = document.createElement('input')
    inp.value = team.name
    inp.maxLength = 20
    inp.style.cssText = 'flex:1;background:' + team.color + '08;border:1.5px solid ' + team.color + '30;border-radius:10px;padding:8px 12px;color:#fff;font-size:13px;font-weight:700;outline:none'
    ;(function(idx){ inp.addEventListener('input', function(){ teamState.teams[idx].name = inp.value || ('Équipe ' + idx) }) })(ti)

    header.appendChild(emojiEl)
    header.appendChild(inp)
    card.appendChild(header)

    // Members
    if(names.length > 0){
      var membLabel = document.createElement('div')
      membLabel.style.cssText = 'font-size:10px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:1px'
      membLabel.textContent = 'Membres'
      card.appendChild(membLabel)

      var chips = document.createElement('div')
      chips.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px'
      names.forEach(function(name, ni){
        var inTeam = team.members.indexOf(ni) >= 0
        var chip = document.createElement('div')
        chip.style.cssText = 'padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;cursor:pointer;transition:all .2s;background:' +
          (inTeam ? team.color+'25' : 'transparent') + ';border:1.5px solid ' +
          (inTeam ? team.color : 'rgba(255,255,255,0.1)') + ';color:' + (inTeam ? team.color : 'var(--muted)')
        chip.textContent = name
        ;(function(teamIdx, memberIdx){
          chip.addEventListener('click', function(){
            // Remove from all teams first
            teamState.teams.forEach(function(t){ var i=t.members.indexOf(memberIdx); if(i>=0) t.members.splice(i,1) })
            // Add to this team (or deselect if already in)
            var already = teamState.teams[teamIdx].members.indexOf(memberIdx)
            if(already < 0) teamState.teams[teamIdx].members.push(memberIdx)
            renderTeamSetup()
          })
        })(ti, ni)
        chips.appendChild(chip)
      })
      card.appendChild(chips)
    }

    list.appendChild(card)
  })
}

var teamTimerInt = null
var TEAM_TIMER_SEC = 60

// (old launchTeamGame removed — see new one below)

function startTeamTimer(){
  clearInterval(teamTimerInt)
  var sec = TEAM_TIMER_SEC
  updateTeamTimer(sec)
  teamTimerInt = setInterval(function(){
    sec--
    updateTeamTimer(sec)
    if(sec <= 0){
      clearInterval(teamTimerInt)
      // Auto-trigger point attribution
      teamPointTo()
    }
  }, 1000)
}

function updateTeamTimer(sec){
  var pct = sec / TEAM_TIMER_SEC
  var col = pct > 0.4 ? '#F59E0B' : pct > 0.2 ? '#EF4444' : '#FF4D6D'
  var te = document.getElementById('team-timer'); if(te){ te.textContent = sec; te.style.color = col }
  var arc = document.getElementById('team-arc')
  if(arc){ arc.style.strokeDashoffset = 150.8*(1-pct); arc.style.stroke = col }
}

function renderTeamGame(){
  var q = teamState.questions[teamState.qIdx % teamState.questions.length]
  var qe = document.getElementById('team-question'); if(qe) qe.textContent = q
  var qn = document.getElementById('team-q-num'); if(qn) qn.textContent = teamState.qIdx+1
  var qt = document.getElementById('team-q-total'); if(qt) qt.textContent = teamState.teams.length * 3

  // Matchup
  var ma = document.getElementById('team-matchup')
  if(ma){
    var t1 = teamState.teams[teamState.currentPair[0]]
    var t2 = teamState.teams[teamState.currentPair[1]]
    ma.innerHTML =
      '<div style="flex:1;background:'+t1.color+'15;border:2px solid '+t1.color+'40;border-radius:14px;padding:10px;text-align:center">' +
        '<div style="font-size:22px">'+t1.emoji+'</div>' +
        '<div style="font-size:13px;font-weight:800;color:'+t1.color+';margin-top:4px">'+t1.name+'</div>' +
        '<div style="font-size:12px;color:var(--muted);margin-top:2px">'+t1.score+' pt'+((t1.score!==1)?'s':'')+'</div>' +
      '</div>' +
      '<div style="display:flex;align-items:center;font-size:18px;color:var(--muted2);padding:0 4px">VS</div>' +
      '<div style="flex:1;background:'+t2.color+'15;border:2px solid '+t2.color+'40;border-radius:14px;padding:10px;text-align:center">' +
        '<div style="font-size:22px">'+t2.emoji+'</div>' +
        '<div style="font-size:13px;font-weight:800;color:'+t2.color+';margin-top:4px">'+t2.name+'</div>' +
        '<div style="font-size:12px;color:var(--muted);margin-top:2px">'+t2.score+' pt'+((t2.score!==1)?'s':'')+'</div>' +
      '</div>'
  }

  // All scores row
  var sc = document.getElementById('team-scores')
  if(sc){
    sc.innerHTML = teamState.teams.map(function(t){
      return '<div style="display:flex;align-items:center;gap:6px;background:'+t.color+'12;border:1px solid '+t.color+'25;border-radius:10px;padding:5px 10px">' +
        '<span>'+t.emoji+'</span><span style="font-size:11px;font-weight:700;color:'+t.color+'">'+t.name+'</span>' +
        '<span style="font-size:11px;color:var(--muted);margin-left:2px">'+t.score+'pt</span>' +
      '</div>'
    }).join('')
  }
}

function teamPointTo(){
  var popup = document.getElementById('team-point-popup')
  if(!popup) return
  var t1 = teamState.teams[teamState.currentPair[0]]
  var t2 = teamState.teams[teamState.currentPair[1]]
  var choices = document.getElementById('team-point-choices')
  if(choices){
    choices.innerHTML = [t1, t2].map(function(t, i){
      var idx = teamState.currentPair[i]
      return '<button data-oc="giveTeamPoint('+idx+')" style="padding:16px;border-radius:16px;border:2px solid '+t.color+'50;background:'+t.color+'12;cursor:pointer;display:flex;align-items:center;gap:12px;width:100%">' +
        '<div style="font-size:28px">'+t.emoji+'</div>' +
        '<div style="text-align:left"><div style="font-size:15px;font-weight:800;color:'+t.color+'">'+t.name+'</div><div style="font-size:11px;color:var(--muted)">'+t.score+' point(s) actuellement</div></div>' +
      '</button>'
    }).join('')
  }
  popup.style.display = 'flex'
}

function giveTeamPoint(teamIdx){
  teamState.teams[teamIdx].score++
  cancelTeamPoint()
  var n = teamState.teams.length
  var p = teamState.currentPair
  var next = nextPair(p[0], p[1], n)
  teamState.currentPair = next
  teamState.qIdx++
  if(teamState.qIdx >= n * (n-1)){
    clearInterval(teamTimerInt)
    showTeamEnd()
    return
  }
  renderTeamGame()
  startTeamTimer()
}

function nextPair(a, b, n){
  b++
  if(b >= n){ a++; b = a+1 }
  if(a >= n-1) return [0, 1] // loop
  return [a, b]
}

function cancelTeamPoint(){
  var popup = document.getElementById('team-point-popup')
  if(popup) popup.style.display = 'none'
}

function skipTeamQuestion(){
  var qs = teamState.questions
  var cur = qs[teamState.qIdx % qs.length]
  var tries = 0
  var newQ
  do { newQ = qs[Math.floor(Math.random()*qs.length)]; tries++ } while(newQ === cur && tries < 10)
  teamState.questions[teamState.qIdx % qs.length] = newQ
  renderTeamGame()
  startTeamTimer()
}

function showTeamEnd(){
  var sorted = teamState.teams.slice().sort(function(a,b){ return b.score - a.score })
  var el = document.getElementById('team-final-scores')
  if(el){
    el.innerHTML = sorted.map(function(t, i){
      var medal = i===0?'🥇':i===1?'🥈':i===2?'🥉':'  '
      return '<div style="background:var(--card);border:1.5px solid '+t.color+'30;border-radius:16px;padding:14px 16px;display:flex;align-items:center;gap:12px">' +
        '<div style="font-size:24px">'+medal+'</div>' +
        '<div style="font-size:24px">'+t.emoji+'</div>' +
        '<div style="flex:1"><div style="font-size:15px;font-weight:800;color:'+t.color+'">'+t.name+'</div></div>' +
        '<div style="font-family:var(--font-head);font-size:22px;color:'+t.color+'">'+t.score+'<span style="font-size:12px;color:var(--muted)"> pts</span></div>' +
      '</div>'
    }).join('')
  }
  document.querySelectorAll('.screen').forEach(function(s){ s.classList.remove('active','out') })
  setTimeout(function(){ document.getElementById('s-team-end').classList.add('active') }, 80)
}



// ═══════════════════════════════════════════════════
// 1V1 — ROUND FINAL : VERDICT + PODIUM
// ═══════════════════════════════════════════════════
function showFinalArbitreVote(){
  const p = duelState.players
  const el = (id) => document.getElementById(id)
  if(el('popup-tour-num'))      el('popup-tour-num').textContent     = '🔥 Final'
  if(el('popup-arbitre-label')) el('popup-arbitre-label').textContent = 'Tour final terminé ! ' + p.arbitre.name + ', qui a gagné ?'
  if(el('popup-av-pour'))       el('popup-av-pour').textContent      = p.pour.av
  if(el('popup-name-pour'))     el('popup-name-pour').textContent    = p.pour.name
  if(el('popup-av-contre'))     el('popup-av-contre').textContent    = p.contre.av
  if(el('popup-name-contre'))   el('popup-name-contre').textContent  = p.contre.name
  updateScoreDisplay()
  ;['popup-btn-pour','popup-btn-contre'].forEach(id=>{
    const b=el(id); if(b){b.style.transform='';b.style.opacity='1';b.style.boxShadow=''}
  })
  const bp = el('popup-btn-pour');   if(bp) bp.setAttribute('data-oc', 'finalVote("pour")')
  const bc = el('popup-btn-contre'); if(bc) bc.setAttribute('data-oc', 'finalVote("contre")')
  const popup = el('duel-vote-popup')
  if(popup){ popup.style.display='flex'; popup.style.opacity='0'; popup.style.transform='scale(0.95)'
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      popup.style.transition='opacity .25s,transform .25s'
      popup.style.opacity='1'; popup.style.transform='scale(1)'
    }))
  }
}

function finalVote(winner){
  duelState.scores[winner]++
  const popup = document.getElementById('duel-vote-popup')
  if(popup){ popup.style.opacity='0'; popup.style.transform='scale(0.95)'
    setTimeout(()=>{ popup.style.display='none'; popup.style.transition='' }, 260)
  }
  const bp = document.getElementById('popup-btn-pour')
  const bc = document.getElementById('popup-btn-contre')
  if(bp) bp.setAttribute('data-oc', 'duelArbitreVote("pour")')
  if(bc) bc.setAttribute('data-oc', 'duelArbitreVote("contre")')
  setTimeout(showDuelPodium, 350)
}

function showDuelPodium(){
  const p = duelState.players
  const s = duelState.scores
  const players = [
    { name: p.pour.name,   av: p.pour.av,   score: s.pour,   color:'#3B82F6' },
    { name: p.contre.name, av: p.contre.av,  score: s.contre, color:'#FF4D6D' },
    { name: p.arbitre.name,av: p.arbitre.av, score: -1,       color:'#F59E0B', isArbitre: true },
  ]
  const sorted = players.slice().sort((a,b) => b.score - a.score)
  const maxScore = Math.max(s.pour, s.contre, 1)

  const stage = document.querySelector('.podium-stage')
  if(stage){
    const podiumOrder = sorted.length >= 2 ? [sorted[1], sorted[0], sorted[2]].filter(Boolean) : sorted
    stage.innerHTML = podiumOrder.map(pl => {
      const rank = sorted.indexOf(pl) + 1
      return `<div class="podium-player pd-${rank}">
        ${rank===1 ? '<div class="pd-crown">👑</div>' : ''}
        <div class="pd-av">${pl.av}</div>
        <div class="pd-name">${pl.name}</div>
        <div class="pd-pts" style="color:${pl.color}">${pl.isArbitre ? 'Arbitre ⚖️' : pl.score + ' pt' + (pl.score!==1?'s':'')}</div>
        <div class="pd-block">${rank}</div>
      </div>`
    }).join('')
  }

  const list = document.querySelector('.score-list')
  if(list){
    const barColors = ['linear-gradient(90deg,#FFE600,#FF8C42)','linear-gradient(90deg,#3B82F6,#8B5CF6)','linear-gradient(90deg,#10B981,#14B8A6)']
    list.innerHTML = sorted.map((pl, i) => `
      <div class="score-row">
        <div class="sr-rank">#${i+1}</div>
        <div class="sr-av">${pl.av}</div>
        <div class="sr-bar-wrap">
          <div class="sr-name">${pl.name}</div>
          <div class="sr-bar-bg"><div class="sr-bar-fill" style="width:${pl.isArbitre?0:Math.round(pl.score/maxScore*100)}%;background:${barColors[i]||barColors[2]}"></div></div>
        </div>
        <div class="sr-pts" style="${i===0?'color:#FFE600':''}">${pl.isArbitre ? 'Arbitre' : pl.score + ' pts'}</div>
      </div>`).join('')
  }

  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active','out'))
  setTimeout(()=>document.getElementById('s-podium').classList.add('active'), 80)
}

function selDuelFormat(format) {
  if(format === 'solo') {
    // Hide team mode section on S8
    var tw = document.getElementById('team-mode-wrap')
    if(tw) tw.style.display = 'none'
    window.go(8)
  } else {
    goTeamSetup()
  }
}


function btnGoAction() {
  var m = window._btnGoMode
  var hasRoles = window._btnGoHasRoles
  if(!m) return
  if(m === 'duel') window.go(13)  // always show solo/équipe choice
  else window.go(hasRoles ? 8 : 5)
}


// ═══════════════════════════════════════════════════
// TEAM MODE — TOURS DE PAROLE
// ═══════════════════════════════════════════════════
// teamState.currentPair = [idxPour, idxContre]
// teamState.currentSpeaker = 'pour' | 'contre'
// teamState.speakersDone = []
// teamState.arbitreIdx = idx de l'équipe arbitre (rotation)

function trySelTeam(){
  if(pcount < 5){
    showComingSoon('Il faut au moins 5 joueurs pour le mode équipes !')
    return
  }
  selDuelFormat('team')
}

// Override showComingSoon to accept custom message
var _origShowComingSoon = showComingSoon
showComingSoon = function(msg){
  var existing = document.getElementById('coming-soon-toast')
  if(existing){ existing.remove() }
  var toast = document.createElement('div')
  toast.id = 'coming-soon-toast'
  toast.style.cssText = 'position:absolute;bottom:100px;left:50%;transform:translateX(-50%);z-index:999;background:#1C1C2A;border:1.5px solid rgba(139,92,246,0.4);border-radius:16px;padding:14px 20px;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.5);min-width:220px;transition:opacity .4s;white-space:nowrap'
  toast.innerHTML = '<div style="font-size:22px;margin-bottom:6px">⚠️</div><div style="font-family:var(--font-head);font-size:14px;color:#fff">' + (msg || 'Bientôt disponible !') + '</div>'
  document.querySelector('.phone').appendChild(toast)
  setTimeout(function(){ toast.style.opacity='0'; setTimeout(function(){ toast.remove() },400) }, 2500)
}

function launchTeamGame(){
  TEAM_TIMER_SEC = (typeof settingVals !== 'undefined' && settingVals['time_turn'] != null)
    ? [30,45,60,120][settingVals['time_turn']] : 60
  teamState.teams.forEach(function(t){ t.score = 0 })
  teamState.questions = (typeof debateQuestions !== 'undefined' && debateQuestions.length > 0)
    ? debateQuestions.slice() : duelQuestions.concat(duelQuestions)
  teamState.qIdx = 0
  teamState.tourIdx = 0
  // Arbitre = 3rd team (fixed for whole game), debaters = teams 0 and 1
  teamState.currentPair = [0, 1]
  teamState.arbitreIdx  = 2 % teamState.teams.length
  // Total tours = settingVals nb_tours if set, else 5 by default
  var nbMap = [3,5,7]
  teamState.nbTours = nbMap[typeof settingVals !== 'undefined' && settingVals['nb_tours'] != null ? settingVals['nb_tours'] : 1]
  teamState.currentSpeaker = 'pour'
  teamState.speakersDone = []
  renderTeamGameNew()
  document.querySelectorAll('.screen').forEach(function(s){ s.classList.remove('active','out') })
  setTimeout(function(){
    document.getElementById('s-team').classList.add('active')
    // Build role announce queue: POUR, CONTRE, Arbitre(s)
    var queue = []
    teamState.teams.forEach(function(t, i){
      var isPour   = i === teamState.currentPair[0]
      var isContre = i === teamState.currentPair[1]
      var role  = isPour ? 'POUR / VRAI' : isContre ? 'CONTRE / FAUX' : 'ARBITRE'
      var color = isPour ? t.color : isContre ? t.color : '#F59E0B'
      var desc  = isPour   ? 'Votre équipe argumente <strong style="color:' + t.color + '">POUR</strong> le sujet !'
                : isContre ? 'Votre équipe argumente <strong style="color:' + t.color + '">CONTRE</strong> le sujet !'
                : 'Votre équipe écoute et tranche à la fin !'
      queue.push({ name: t.emoji + ' ' + t.name, emoji: t.emoji, role: role, color: color, desc: desc })
    })
    // Move popup into s-team screen
    var popup = document.getElementById('duel-role-announce')
    var scr   = document.getElementById('s-team')
    if(popup && scr && !scr.contains(popup)) scr.appendChild(popup)
    // After last slide, start timer instead of closing
    window._afterAnnounce = startTeamTimer
    showRoleAnnounce(queue)
  }, 80)
}

function renderTeamGameNew(){
  var t1 = teamState.teams[teamState.currentPair[0]]  // POUR
  var t2 = teamState.teams[teamState.currentPair[1]]  // CONTRE
  var arb = teamState.teams[teamState.arbitreIdx]
  var n  = teamState.teams.length
  var totalTours = n * (n - 1)

  // Topbar
  var tn = document.getElementById('team-tour-num'); if(tn) tn.textContent = teamState.tourIdx + 1
  var tt = document.getElementById('team-tour-total'); if(tt) tt.textContent = totalTours
  var qt = document.getElementById('team-q-tag'); if(qt) qt.textContent = '🏆 Tour ' + (teamState.tourIdx+1)

  // Question
  var qe = document.getElementById('team-question')
  if(qe) qe.textContent = teamState.questions[teamState.qIdx % teamState.questions.length]

  // Matchup cards
  var ma = document.getElementById('team-matchup')
  if(ma){
    var sp = teamState.currentSpeaker
    var pourActive = sp === 'pour'
    ma.innerHTML =
      '<div style="flex:1;background:' + t1.color + (pourActive?'25':'10') + ';border:2px solid ' + t1.color + (pourActive?'80':'30') + ';border-radius:14px;padding:10px;text-align:center;transition:all .3s">' +
        '<div style="font-size:20px">' + t1.emoji + '</div>' +
        '<div style="font-size:12px;font-weight:800;color:' + t1.color + ';margin-top:3px">' + t1.name + '</div>' +
        '<div style="font-size:10px;color:' + t1.color + ';font-weight:700;margin-top:2px">POUR / VRAI</div>' +
        '<div style="font-size:11px;color:var(--muted);margin-top:3px">' + t1.score + ' pt</div>' +
        (pourActive ? '<div style="width:8px;height:8px;border-radius:50%;background:' + t1.color + ';box-shadow:0 0 8px ' + t1.color + ';margin:5px auto 0;animation:blinkDot 1s infinite"></div>' : '') +
      '</div>' +
      '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 4px;gap:4px">' +
        '<div style="font-size:16px;color:var(--muted2)">⚔️</div>' +
        '<div style="font-size:10px;color:var(--muted);font-weight:700;text-align:center">' + arb.emoji + '<br><span style="font-size:9px">Arbitre</span></div>' +
      '</div>' +
      '<div style="flex:1;background:' + t2.color + (!pourActive?'25':'10') + ';border:2px solid ' + t2.color + (!pourActive?'80':'30') + ';border-radius:14px;padding:10px;text-align:center;transition:all .3s">' +
        '<div style="font-size:20px">' + t2.emoji + '</div>' +
        '<div style="font-size:12px;font-weight:800;color:' + t2.color + ';margin-top:3px">' + t2.name + '</div>' +
        '<div style="font-size:10px;color:' + t2.color + ';font-weight:700;margin-top:2px">CONTRE / FAUX</div>' +
        '<div style="font-size:11px;color:var(--muted);margin-top:3px">' + t2.score + ' pt</div>' +
        (!pourActive ? '<div style="width:8px;height:8px;border-radius:50%;background:' + t2.color + ';box-shadow:0 0 8px ' + t2.color + ';margin:5px auto 0;animation:blinkDot 1s infinite"></div>' : '') +
      '</div>'
  }

  // Speaker banner
  var sb = document.getElementById('team-speaker-label')
  if(sb){
    var active = pourActive ? t1 : t2
    var camp = pourActive ? 'POUR / VRAI' : 'CONTRE / FAUX'
    sb.textContent = active.name + ' — argumente ' + camp
  }

  // Scores row
  renderTeamScores()
}

function renderTeamScores(){
  var sc = document.getElementById('team-scores')
  if(!sc) return
  sc.innerHTML = teamState.teams.map(function(t){
    return '<div style="display:flex;align-items:center;gap:4px;background:' + t.color + '12;border:1px solid ' + t.color + '25;border-radius:8px;padding:4px 8px">' +
      '<span style="font-size:14px">' + t.emoji + '</span>' +
      '<span style="font-size:10px;font-weight:700;color:' + t.color + '">' + t.name + '</span>' +
      '<span style="font-size:11px;color:var(--muted);margin-left:2px">' + t.score + 'pt</span>' +
      '</div>'
  }).join('')
}
