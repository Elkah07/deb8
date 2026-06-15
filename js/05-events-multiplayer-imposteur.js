// ── INLINE EVENT DISPATCHER ──
document.addEventListener('click', function(e){
  var el = e.target.closest('[data-oc]');
  if(!el) return;
  var fn = el.getAttribute('data-oc');
  try { (new Function('el', fn.replace(/\bthis\b/g, 'el')))(el); } catch(err){ console.warn('onclick error:', fn, err); }
});
document.addEventListener('mousedown', function(e){
  var el = e.target.closest('[onmousedown]');
  if(!el) return;
  var fn = el.getAttribute('onmousedown');
  try { (new Function('el', fn.replace(/\bthis\b/g, 'el')))(el); } catch(err){}
});
document.addEventListener('mouseup', function(e){
  var el = e.target.closest('[onmouseup]');
  if(!el) return;
  var fn = el.getAttribute('onmouseup');
  try { (new Function('el', fn.replace(/\bthis\b/g, 'el')))(el); } catch(err){}
});
document.addEventListener('change', function(e){
  var el = e.target.closest('[data-change]');
  if(!el) return;
  var fn = el.getAttribute('data-change');
  try { (new Function(fn))(); } catch(err){ console.warn('onchange error:', fn, err); }
});


// ══════════════════════════════════════════
// MULTI IMPOSTEUR — Maquette UI simulée
// (À remplacer par Firebase en prod)
// ══════════════════════════════════════════

var multiImpState = {
  isHost: true,        // true = hôte, false = joueur
  myPlayerIdx: 0,      // index du joueur local dans la partie
  players: [],         // liste des joueurs
  impostorIdx: -1,
  subject: '',
  decoy: '',
  round: 1,
  totalRounds: 3,
  duration: 60,
  timerInt: null,
  timerSec: 60,
  votes: {},           // { playerIdx: suspectIdx }
  myVote: null,
  roleVisible: true,
  debRoleVisible: true,
}

// Simuler le lancement depuis le lobby
function launchMultiImp(isHost, playerIdx) {
  clearInterval(multiImpState.timerInt)
  var dur = IMP_DURATIONS[(typeof settingVals !== 'undefined' && settingVals['time_turn'] != null) ? settingVals['time_turn'] : 2]
  multiImpState.isHost = isHost
  multiImpState.myPlayerIdx = playerIdx
  multiImpState.round = 1
  multiImpState.totalRounds = (typeof settingVals !== 'undefined' && settingVals['nb_parties']) ? settingVals['nb_parties'] : 3
  multiImpState.duration = dur
  multiImpState.votes = {}
  multiImpState.myVote = null

  // Build players from names
  var allEmojis = ['🦊','🐙','🐸','🦋','🐼','🦁','🐯','🦄']
  multiImpState.players = []
  for (var i = 0; i < pcount; i++) {
    var nm = (typeof playerNames !== 'undefined' && playerNames[i]) ? playerNames[i] : 'Joueur ' + (i+1)
    multiImpState.players.push({ name: nm, av: allEmojis[i % allEmojis.length] })
  }

  // Assign roles
  multiAssignRoles()

  if (isHost) {
    renderMultiHostScreen()
    goToScreen('s-multi-imp-host')
  } else {
    renderMultiPlayerScreen()
    goToScreen('s-multi-imp-player')
  }
}

function multiAssignRoles() {
  var subject = IMP_SUBJECTS[Math.floor(Math.random() * IMP_SUBJECTS.length)]
  var decoy = IMP_DECOYS[Math.floor(Math.random() * IMP_DECOYS.length)]
  var impostorIdx = Math.floor(Math.random() * multiImpState.players.length)
  multiImpState.impostorIdx = impostorIdx
  multiImpState.subject = subject
  multiImpState.decoy = decoy
  for (var i = 0; i < multiImpState.players.length; i++) {
    multiImpState.players[i].role = i === impostorIdx ? 'impostor' : 'normal'
    multiImpState.players[i].subject = i === impostorIdx ? decoy : subject
  }
}

function goToScreen(id) {
  document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active','out') })
  setTimeout(function() { var el = document.getElementById(id); if(el) el.classList.add('active') }, 80)
}

// ── VUE HÔTE ──
function renderMultiHostScreen() {
  var el = document.getElementById('multi-host-round'); if(el) el.textContent = multiImpState.round
  var et = document.getElementById('multi-host-total'); if(et) et.textContent = multiImpState.totalRounds
  var ed = document.getElementById('multi-host-duration'); if(ed) ed.textContent = multiImpState.duration + 's'
  var list = document.getElementById('multi-host-players')
  if (list) {
    var colors = ['#FF4D6D','#3B82F6','#10B981','#8B5CF6','#F59E0B','#EC4899','#14B8A6','#84CC16']
    list.innerHTML = multiImpState.players.map(function(p, i) {
      return '<div style="background:var(--card);border:1.5px solid var(--border);border-radius:14px;padding:10px 14px;display:flex;align-items:center;gap:10px">' +
        '<div style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;background:' + colors[i%colors.length] + '22">' + p.av + '</div>' +
        '<div style="flex:1"><div style="font-size:14px;font-weight:700">' + p.name + (i===0?' <span style="font-size:10px;color:var(--muted);font-weight:400">· Hôte</span>':'') + '</div></div>' +
        '<div style="width:8px;height:8px;border-radius:50%;background:#10B981;box-shadow:0 0 6px #10B981"></div>' +
        '</div>'
    }).join('')
  }
}

function multiHostLaunchDebate() {
  multiImpState.timerSec = multiImpState.duration
  multiImpState.votes = {}
  multiImpState.myVote = null
  renderMultiDebateScreen(true)
  goToScreen('s-multi-imp-debate')
  startMultiTimer()
}

// ── VUE JOUEUR ──
function renderMultiPlayerScreen() {
  multiImpState.roleVisible = false
  var masked = document.getElementById('multi-role-masked')
  var revealed = document.getElementById('multi-role-revealed')
  if(masked) masked.style.display = 'flex'
  if(revealed) revealed.style.display = 'none'
  var card = document.getElementById('multi-role-card')
  if(card) card.style.background = 'linear-gradient(145deg,rgba(139,92,246,0.1),rgba(99,102,241,0.06))'
}

function toggleMultiRole() {
  multiImpState.roleVisible = !multiImpState.roleVisible
  var me = multiImpState.players[multiImpState.myPlayerIdx]
  var isImp = me.role === 'impostor'
  var masked = document.getElementById('multi-role-masked')
  var revealed = document.getElementById('multi-role-revealed')
  var card = document.getElementById('multi-role-card')
  if (multiImpState.roleVisible) {
    if(masked) masked.style.display = 'none'
    if(revealed) revealed.style.display = 'flex'
    if(card) card.style.background = isImp
      ? 'linear-gradient(145deg,rgba(255,77,109,0.15),rgba(255,140,66,0.08))'
      : 'linear-gradient(145deg,rgba(16,185,129,0.1),rgba(59,130,246,0.06))'
    var badge = document.getElementById('multi-role-badge-big')
    var av = document.getElementById('multi-role-av')
    var nm = document.getElementById('multi-role-name')
    var sub = document.getElementById('multi-role-subject')
    var pb = document.getElementById('multi-player-badge')
    if(badge) {
      badge.textContent = isImp ? '🕵️ IMPOSTEUR' : '✅ JOUEUR NORMAL'
      badge.style.cssText = 'padding:5px 16px;border-radius:20px;font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;background:' +
        (isImp ? 'rgba(255,77,109,0.2);color:#FF4D6D;border:1px solid rgba(255,77,109,0.4)' : 'rgba(16,185,129,0.2);color:#10B981;border:1px solid rgba(16,185,129,0.4)')
    }
    if(av) av.textContent = me.av
    if(nm) nm.textContent = me.name
    if(pb) { pb.textContent = isImp ? 'IMPOSTEUR' : 'JOUEUR'; pb.style.background = isImp ? 'rgba(255,77,109,0.12)' : 'rgba(16,185,129,0.12)'; pb.style.color = isImp ? '#FF4D6D' : '#10B981'; pb.style.borderColor = isImp ? 'rgba(255,77,109,0.3)' : 'rgba(16,185,129,0.3)' }
    if(sub) {
      if(isImp) sub.innerHTML = 'Ton sujet : <strong>' + me.subject + '</strong><br><span style="font-size:12px;color:var(--muted)">Les autres ont un sujet différent — bluff !</span>'
      else sub.innerHTML = 'Sujet : <strong>' + me.subject + '</strong><br><span style="font-size:12px;color:var(--muted)">Débats et trouve l\'imposteur !</span>'
    }
  } else {
    if(masked) masked.style.display = 'flex'
    if(revealed) revealed.style.display = 'none'
    if(card) card.style.background = 'linear-gradient(145deg,rgba(139,92,246,0.1),rgba(99,102,241,0.06))'
  }
}

// ── DÉBAT ──
function renderMultiDebateScreen(isHost) {
  var me = multiImpState.players[multiImpState.myPlayerIdx]
  var isImp = me.role === 'impostor'
  var el = document.getElementById('multi-deb-round'); if(el) el.textContent = multiImpState.round
  var et = document.getElementById('multi-deb-total'); if(et) et.textContent = multiImpState.totalRounds
  // Role badge top right
  var rb = document.getElementById('multi-deb-role-badge')
  if(rb) { rb.textContent = isImp ? '🕵️ IMPOSTEUR' : '✅ NORMAL'; rb.style.background = isImp ? 'rgba(255,77,109,0.12)' : 'rgba(16,185,129,0.12)'; rb.style.color = isImp ? '#FF4D6D' : '#10B981' }
  // Mini role card
  var av = document.getElementById('multi-deb-av'); if(av) av.textContent = me.av
  var rl = document.getElementById('multi-deb-role-label'); if(rl) { rl.textContent = isImp ? '🕵️ IMPOSTEUR' : '✅ JOUEUR NORMAL'; rl.style.color = isImp ? '#FF4D6D' : '#10B981' }
  var subj = document.getElementById('multi-deb-subject'); if(subj) subj.textContent = me.subject
  multiImpState.debRoleVisible = true
  var vis = document.getElementById('multi-deb-role-visible'); if(vis) vis.style.display = 'flex'
  var hid = document.getElementById('multi-deb-role-hidden'); if(hid) hid.style.display = 'none'
  // Host skip button
  var skip = document.getElementById('multi-host-skip'); if(skip) skip.style.display = isHost ? 'block' : 'none'
}

function toggleMultiDebRole() {
  multiImpState.debRoleVisible = !multiImpState.debRoleVisible
  var vis = document.getElementById('multi-deb-role-visible')
  var hid = document.getElementById('multi-deb-role-hidden')
  if(multiImpState.debRoleVisible) {
    if(vis) vis.style.display = 'flex'
    if(hid) hid.style.display = 'none'
  } else {
    if(vis) vis.style.display = 'none'
    if(hid) hid.style.display = 'block'
  }
}

function startMultiTimer() {
  clearInterval(multiImpState.timerInt)
  updateMultiTimer()
  multiImpState.timerInt = setInterval(function() {
    multiImpState.timerSec--
    if (multiImpState.timerSec <= 0) {
      clearInterval(multiImpState.timerInt)
      multiImpState.timerSec = 0
      updateMultiTimer()
      // Auto go to vote
      setTimeout(multiGoToVote, 800)
      return
    }
    updateMultiTimer()
  }, 1000)
}

function updateMultiTimer() {
  var sec = multiImpState.timerSec
  var dur = multiImpState.duration
  var el = document.getElementById('multi-imp-timer'); if(el) el.textContent = sec
  var arc = document.getElementById('multi-imp-arc')
  if (arc) {
    var pct = dur > 0 ? sec/dur : 0
    arc.style.strokeDashoffset = 150.8*(1-pct)
    var col = pct > 0.4 ? '#8B5CF6' : pct > 0.2 ? '#F59E0B' : '#FF4D6D'
    arc.style.stroke = col
    var num = document.getElementById('multi-imp-timer'); if(num) num.style.color = col
  }
}

function multiHostSkipDebate() {
  clearInterval(multiImpState.timerInt)
  multiGoToVote()
}

// ── VOTE ──
function multiGoToVote() {
  multiImpState.myVote = null
  var waiting = document.getElementById('multi-voted-waiting'); if(waiting) waiting.style.display = 'none'
  renderMultiSuspects()
  goToScreen('s-multi-imp-vote')
}

function renderMultiSuspects() {
  var list = document.getElementById('multi-suspects-list')
  if (!list) return
  var colors = ['#FF4D6D','#3B82F6','#10B981','#8B5CF6','#F59E0B','#EC4899','#14B8A6','#84CC16']
  list.innerHTML = multiImpState.players.map(function(p, i) {
    if (i === multiImpState.myPlayerIdx) return '' // can't vote for self
    return '<div data-oc="castMultiVote(' + i + ')" style="background:var(--card);border:2px solid var(--border);border-radius:16px;padding:14px 16px;display:flex;align-items:center;gap:12px;cursor:pointer;transition:all .2s" id="msuspect-' + i + '">' +
      '<div style="width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;background:' + colors[i%colors.length] + '22">' + p.av + '</div>' +
      '<div style="font-family:var(--font-head);font-size:16px;flex:1">' + p.name + '</div>' +
      '<div style="font-size:20px;color:var(--muted2)">→</div></div>'
  }).join('')
}

function castMultiVote(suspectIdx) {
  multiImpState.votes[multiImpState.myPlayerIdx] = suspectIdx
  multiImpState.myVote = suspectIdx
  // Show waiting
  var list = document.getElementById('multi-suspects-list'); if(list) list.style.display = 'none'
  var waiting = document.getElementById('multi-voted-waiting'); if(waiting) waiting.style.display = 'block'
  // Simulate others voting after short delay, then reveal
  var total = multiImpState.players.length
  var vc = document.getElementById('multi-vote-count'); if(vc) vc.textContent = '1 / ' + total + ' votes'
  // Simulate other votes with delay
  var othersDelay = [800, 1400, 1900, 2300]
  var voteCount = 1
  multiImpState.players.forEach(function(p, i) {
    if (i === multiImpState.myPlayerIdx) return
    var delay = othersDelay[voteCount-1] || (voteCount * 600)
    voteCount++
    ;(function(idx, d, vc2) {
      setTimeout(function() {
        // Random vote (simulation) — biased slightly toward impostor
        var suspects = multiImpState.players.map(function(_,j){ return j }).filter(function(j){ return j !== idx })
        var vote = Math.random() < 0.55 ? multiImpState.impostorIdx : suspects[Math.floor(Math.random()*suspects.length)]
        multiImpState.votes[idx] = vote
        var counted = Object.keys(multiImpState.votes).length
        if(vc2) vc2.textContent = counted + ' / ' + total + ' votes'
        if (counted >= total) {
          setTimeout(showMultiReveal, 600)
        }
      }, d)
    })(i, delay, vc)
  })
}

// ── RÉVÉLATION ──
function showMultiReveal() {
  var imp = multiImpState.players[multiImpState.impostorIdx]
  var votesAgainst = 0
  for (var v in multiImpState.votes) { if (multiImpState.votes[v] === multiImpState.impostorIdx) votesAgainst++ }
  var total = multiImpState.players.length
  var caught = votesAgainst >= Math.ceil(total / 2)

  document.getElementById('multi-reveal-emoji').textContent = caught ? '🎉' : '😈'
  document.getElementById('multi-reveal-title').textContent = caught ? 'Imposteur démasqué !' : "L'imposteur s'en sort !"
  document.getElementById('multi-reveal-av').textContent = imp.av
  document.getElementById('multi-reveal-name').textContent = imp.name
  document.getElementById('multi-reveal-subjects').innerHTML =
    'Son sujet : <strong>' + imp.subject + '</strong><br>Sujet des autres : <strong>' + multiImpState.subject + '</strong>'
  var rc = document.getElementById('multi-reveal-card')
  if(rc) { rc.style.background = caught ? 'linear-gradient(145deg,rgba(16,185,129,0.1),rgba(20,184,166,0.06))' : 'linear-gradient(145deg,rgba(255,77,109,0.1),rgba(255,140,66,0.06))'; rc.style.borderColor = caught ? 'rgba(16,185,129,0.3)' : 'rgba(255,77,109,0.3)' }
  document.getElementById('multi-reveal-result').innerHTML = caught
    ? "<strong style='color:#10B981'>Les joueurs gagnent !</strong><br>" + votesAgainst + ' vote(s) sur ' + total + ' ont désigné ' + imp.name
    : "<strong style='color:#FF4D6D'>" + imp.name + " (l'imposteur) gagne !</strong><br>Seulement " + votesAgainst + ' vote(s) sur ' + total

  // Votes summary
  var colors = ['#FF4D6D','#3B82F6','#10B981','#8B5CF6','#F59E0B','#EC4899','#14B8A6','#84CC16']
  var vEl = document.getElementById('multi-reveal-votes')
  if(vEl) {
    vEl.innerHTML = multiImpState.players.map(function(p, i) {
      var ti = multiImpState.votes[i]
      if (ti == null) return ''
      var target = multiImpState.players[ti]
      var correct = ti === multiImpState.impostorIdx
      return '<div style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--muted)">' +
        '<span style="font-size:16px">' + p.av + '</span>' +
        '<span>' + p.name + ' → <strong style="color:' + (correct?'#10B981':'#FF4D6D') + '">' + target.name + '</strong></span>' +
        '<span style="margin-left:auto">' + (correct?'✅':'❌') + '</span></div>'
    }).join('')
  }

  var nb = document.getElementById('multi-next-round-btn')
  if(nb) nb.style.display = multiImpState.round >= multiImpState.totalRounds ? 'none' : ''

  goToScreen('s-multi-imp-reveal')
}

function multiNextRound() {
  multiImpState.round++
  multiAssignRoles()
  multiImpState.votes = {}
  multiImpState.myVote = null
  var list = document.getElementById('multi-suspects-list'); if(list) list.style.display = ''
  var waiting = document.getElementById('multi-voted-waiting'); if(waiting) waiting.style.display = 'none'
  if (multiImpState.isHost) {
    renderMultiHostScreen()
    goToScreen('s-multi-imp-host')
  } else {
    renderMultiPlayerScreen()
    goToScreen('s-multi-imp-player')
  }
}

// Sidebar shortcut to preview multi imp (host view)
function previewMultiImp(isHost) {
  playerNames = ['Alex','Léa','Sam','Zoé']
  pcount = 4
  launchMultiImp(isHost, isHost ? 0 : 1)
}
