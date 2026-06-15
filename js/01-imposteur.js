// Imposteur
var IMP_SUBJECTS = [
  "La peine de mort","La legalisation du cannabis","L'intelligence artificielle",
  "Les reseaux sociaux","Le vegetarisme","L'energie nucleaire",
  "Le revenu universel","La censure sur internet","Les jeux video violents","La semaine de 4 jours"
]
var IMP_DECOYS = [
  "Les voyages dans l'espace","Le sport a l'ecole","Les chats vs les chiens",
  "Le cinema vs les series","La sieste au travail","Les animaux de compagnie exotiques"
]
var impState = {players:[], currentRoleIdx:0, revealed:false, currentSpeakerIdx:0, tourN:1}

function initImp(){
  clearInterval(impTimerInt)
  var subject = IMP_SUBJECTS[Math.floor(Math.random()*IMP_SUBJECTS.length)]
  var decoy   = IMP_DECOYS[Math.floor(Math.random()*IMP_DECOYS.length)]
  var impostorIdx = Math.floor(Math.random()*pcount)
  var allEmojis = ["\ud83e\udd8a","\ud83d\udc19","\ud83d\udc38","\ud83e\udd8b","\ud83d\udc3c","\ud83e\udd81","\ud83d\udc2f","\ud83e\udd84"]
  impState.players = []
  for(var i=0;i<pcount;i++){
    var nm = (typeof playerNames!=="undefined" && playerNames[i]) ? playerNames[i] : "Joueur "+(i+1)
    impState.players.push({
      name: nm,
      av: allEmojis[i%allEmojis.length],
      role: i===impostorIdx ? "impostor" : "normal",
      subject: i===impostorIdx ? decoy : subject,
      realSubject: subject
    })
  }
  impState.currentRoleIdx = 0
  impState.currentSpeakerIdx = 0
  impState.tourN = 1
  renderImpRoleScreen()
}

function renderImpRoleScreen(){
  var idx = impState.currentRoleIdx
  var p   = impState.players[idx]
  impState.revealed = false
  var av = document.getElementById("imp-cur-av"); if(av) av.textContent = p.av
  var nm = document.getElementById("imp-cur-name"); if(nm) nm.textContent = p.name
  var ci = document.getElementById("imp-cur-idx"); if(ci) ci.textContent = idx+1
  var ct = document.getElementById("imp-cur-total"); if(ct) ct.textContent = impState.players.length
  var mask = document.getElementById("imp-mask"); if(mask) mask.style.display="flex"
  var rev  = document.getElementById("imp-revealed"); if(rev) rev.style.display="none"
  var card = document.getElementById("imp-role-card")
  if(card) card.style.background="linear-gradient(145deg,rgba(139,92,246,0.12),rgba(99,102,241,0.07))"
  var isLast = idx === impState.players.length - 1
  var btn = document.getElementById("imp-next-btn")
  if(btn){
    btn.setAttribute("data-i18n", isLast ? "startDebate" : "nextPlayer")
    btn.textContent = T(isLast ? "startDebate" : "nextPlayer")
    btn.setAttribute("data-oc", isLast ? "startImpGame()" : "impNextPlayer()")
  }
}

function toggleImpReveal(){
  impState.revealed = !impState.revealed
  var idx = impState.currentRoleIdx
  var p   = impState.players[idx]
  var mask = document.getElementById("imp-mask")
  var rev  = document.getElementById("imp-revealed")
  var card = document.getElementById("imp-role-card")
  if(impState.revealed){
    if(mask) mask.style.display="none"
    if(rev)  rev.style.display="flex"
    if(card) card.style.background = p.role==="impostor"
      ? "linear-gradient(145deg,rgba(255,77,109,0.18),rgba(255,140,66,0.1))"
      : "linear-gradient(145deg,rgba(16,185,129,0.14),rgba(59,130,246,0.07))"
    var badge   = document.getElementById("imp-rev-badge")
    var emoji   = document.getElementById("imp-rev-emoji")
    var subject = document.getElementById("imp-rev-subject")
    var camp    = document.getElementById("imp-rev-camp")
    if(p.role==="impostor"){
      if(badge){ badge.textContent="🕵️ IMPOSTEUR"; badge.style.cssText="padding:5px 16px;border-radius:20px;font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;background:rgba(255,77,109,0.2);color:#FF4D6D;border:1px solid rgba(255,77,109,0.4)" }
      if(emoji) emoji.textContent = p.av
      if(subject) subject.innerHTML = "Ton sujet : <strong>"+p.subject+"</strong><br><span style='font-size:12px;color:var(--muted)'>Les autres ont un sujet différent — bluff et reste crédible !</span>"
      if(camp) camp.style.display = "none"
    } else {
      if(badge){ badge.textContent="✅ JOUEUR NORMAL"; badge.style.cssText="padding:5px 16px;border-radius:20px;font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;background:rgba(16,185,129,0.2);color:#10B981;border:1px solid rgba(16,185,129,0.4)" }
      if(emoji) emoji.textContent = p.av
      if(subject) subject.innerHTML = "Sujet : <strong>"+p.realSubject+"</strong><br><span style='font-size:12px;color:var(--muted)'>Débats et trouve l'imposteur !</span>"
      if(camp) camp.style.display = "none"
    }
  } else {
    if(mask) mask.style.display="flex"
    if(rev)  rev.style.display="none"
    if(card) card.style.background="linear-gradient(145deg,rgba(139,92,246,0.12),rgba(99,102,241,0.07))"
  }
}

function impNextPlayer(){
  impState.currentRoleIdx++
  renderImpRoleScreen()
}

// ── IMPOSTEUR — Nouvelle logique ──
// Durée par tour selon réglage time_turn: 0=30s, 1=45s, 2=60s, 3=120s
var IMP_DURATIONS = [30, 45, 60, 120, 90]
var impVotes = {} // { voterIdx: suspectIdx }
var impVoteIdx = 0 // current voter
var impTotalRounds = 3

function startImpGame(){
  clearInterval(impTimerInt)
  impTotalRounds = (typeof settingVals !== "undefined" && settingVals["nb_parties"]) ? settingVals["nb_parties"] : 3
  impState.tourN = 1
  renderImpGameScreen()
  document.querySelectorAll(".screen").forEach(function(s){ s.classList.remove("active","out") })
  setTimeout(function(){ document.getElementById("s-imp").classList.add("active") }, 80)
  var dur = getImpDurationSeconds ? getImpDurationSeconds() : IMP_DURATIONS[(typeof settingVals !== "undefined" && settingVals["time_turn"] != null) ? settingVals["time_turn"] : 1]
  impSec = dur
  startImpTimer()
}

function renderImpGameScreen(){
  var tr = document.getElementById("imp-tour"); if(tr) tr.textContent = impState.tourN
  var tt = document.getElementById("imp-tour-total"); if(tt) tt.textContent = impTotalRounds
  // Players avatars — no roles shown
  var row = document.getElementById("imp-players-row")
  if(row){
    var colors = ["#FF4D6D","#3B82F6","#10B981","#8B5CF6","#F59E0B","#EC4899","#14B8A6","#84CC16"]
    var html = ""
    for(var j=0;j<impState.players.length;j++){
      var pl = impState.players[j]
      var c = colors[j%colors.length]
      html += "<div style='display:flex;flex-direction:column;align-items:center;gap:4px'>"
      html += "<div style='width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;background:"+c+"22;border:2px solid "+c+"44'>"+pl.av+"</div>"
      html += "<div style='font-size:10px;color:var(--muted);font-weight:600'>"+pl.name+"</div>"
      html += "</div>"
    }
    row.innerHTML = html
  }
  // Reset vote CTA and skip btn
  var cta = document.getElementById("imp-vote-cta"); if(cta) cta.style.display = "none"
  var skip = document.getElementById("imp-btn-skip"); if(skip) skip.style.display = ""
}

function startImpTimer(){
  clearInterval(impTimerInt)
  var dur = getImpDurationSeconds ? getImpDurationSeconds() : IMP_DURATIONS[(typeof settingVals !== "undefined" && settingVals["time_turn"] != null) ? settingVals["time_turn"] : 1]
  updateImpTimer(dur)
  impTimerInt = setInterval(function(){
    impSec--
    if(impSec <= 0){
      clearInterval(impTimerInt)
      impSec = 0
      updateImpTimer(dur)
      // Show vote CTA, hide skip
      var cta = document.getElementById("imp-vote-cta"); if(cta) cta.style.display = "block"
      var skip = document.getElementById("imp-btn-skip"); if(skip) skip.style.display = "none"
      return
    }
    updateImpTimer(dur)
  },1000)
}

function impSkipTimer(){
  clearInterval(impTimerInt)
  impSec = 0
  var dur = getImpDurationSeconds ? getImpDurationSeconds() : IMP_DURATIONS[(typeof settingVals !== "undefined" && settingVals["time_turn"] != null) ? settingVals["time_turn"] : 1]
  updateImpTimer(dur)
  var cta = document.getElementById("imp-vote-cta"); if(cta) cta.style.display = "block"
  var skip = document.getElementById("imp-btn-skip"); if(skip) skip.style.display = "none"
}

function updateImpTimer(dur){
  if(!dur) dur = IMP_DURATIONS[(typeof settingVals !== "undefined" && settingVals["time_turn"] != null) ? settingVals["time_turn"] : 1]
  var el = document.getElementById("imp-timer"); if(el) el.textContent = impSec
  var arc = document.getElementById("imp-arc")
  if(arc){
    var pct = dur > 0 ? impSec/dur : 0
    arc.style.strokeDashoffset = 150.8*(1-pct)
    var col = pct > 0.4 ? "#8B5CF6" : pct > 0.2 ? "#F59E0B" : "#FF4D6D"
    arc.style.stroke = col
    var num = document.getElementById("imp-timer"); if(num) num.style.color = col
  }
}

// ── VOTE PHASE ──
function startImpVote(){
  impVotes = {}
  impVoteIdx = 0
  renderImpVoteScreen()
  document.querySelectorAll(".screen").forEach(function(s){ s.classList.remove("active","out") })
  setTimeout(function(){ document.getElementById("s-imp-vote").classList.add("active") }, 80)
}

function renderImpVoteScreen(){
  var voter = impState.players[impVoteIdx]
  var av = document.getElementById("imp-voter-av"); if(av) av.textContent = voter.av
  var nm = document.getElementById("imp-voter-name"); if(nm) nm.textContent = voter.name
  var vi = document.getElementById("imp-vote-idx"); if(vi) vi.textContent = impVoteIdx+1
  var vt = document.getElementById("imp-vote-total"); if(vt) vt.textContent = impState.players.length
  // Build suspects list (everyone except self)
  var list = document.getElementById("imp-suspects-list")
  if(list){
    var colors = ["#FF4D6D","#3B82F6","#10B981","#8B5CF6","#F59E0B","#EC4899","#14B8A6","#84CC16"]
    var html = ""
    for(var j=0;j<impState.players.length;j++){
      if(j === impVoteIdx) continue // can't vote for self
      var pl = impState.players[j]
      var c = colors[j%colors.length]
      html += "<div data-oc='castImpVote("+j+")' style='background:var(--card);border:2px solid var(--border);border-radius:16px;padding:14px 16px;display:flex;align-items:center;gap:12px;cursor:pointer;transition:all .2s' id='suspect-"+j+"'>"
      html += "<div style='width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;background:"+c+"22'>"+pl.av+"</div>"
      html += "<div style='font-family:var(--font-head);font-size:16px'>"+pl.name+"</div>"
      html += "<div style='margin-left:auto;font-size:20px;color:var(--muted2)'>→</div>"
      html += "</div>"
    }
    list.innerHTML = html
  }
}

function castImpVote(suspectIdx){
  impVotes[impVoteIdx] = suspectIdx
  impVoteIdx++
  if(impVoteIdx >= impState.players.length){
    showImpReveal()
  } else {
    renderImpVoteScreen()
  }
}

// ── RÉVÉLATION ──
function showImpReveal(){
  // Find impostor
  var impIdx = -1
  for(var i=0;i<impState.players.length;i++){
    if(impState.players[i].role === "impostor"){ impIdx = i; break }
  }
  var imp = impState.players[impIdx]
  // Count votes against impostor
  var votesAgainstImp = 0
  var voteResults = {}
  for(var voter in impVotes){
    var target = impVotes[voter]
    voteResults[target] = (voteResults[target]||0)+1
    if(target === impIdx) votesAgainstImp++
  }
  var majority = Math.ceil((impState.players.length-1) / 2) + (impState.players.length > 2 ? 0 : 0)
  var impostorCaught = votesAgainstImp >= Math.ceil(impState.players.length / 2)

  // Update reveal screen
  document.getElementById("imp-reveal-av").textContent = imp.av
  document.getElementById("imp-reveal-name").textContent = imp.name
  document.getElementById("imp-reveal-emoji").textContent = impostorCaught ? "🎉" : "😈"
  document.getElementById("imp-reveal-title").textContent = impostorCaught ? "Imposteur démasqué !" : "L'imposteur s'en sort !"
  document.getElementById("imp-reveal-subject").textContent = "Son sujet : '" + imp.subject + "' — les autres avaient : '" + imp.realSubject + "'"
  document.getElementById("imp-reveal-card").style.background = impostorCaught
    ? "linear-gradient(145deg,rgba(16,185,129,0.12),rgba(20,184,166,0.08))"
    : "linear-gradient(145deg,rgba(255,77,109,0.12),rgba(255,140,66,0.08))"
  document.getElementById("imp-reveal-card").style.borderColor = impostorCaught ? "rgba(16,185,129,0.4)" : "rgba(255,77,109,0.4)"

  var resultEl = document.getElementById("imp-reveal-result")
  resultEl.innerHTML = impostorCaught
    ? "<strong style='color:#10B981'>Les joueurs gagnent !</strong><br><span>"+votesAgainstImp+" vote(s) sur "+impState.players.length+" ont pointé "+imp.name+"</span>"
    : "<strong style='color:#FF4D6D'>"+imp.name+" (l'imposteur) gagne !</strong><br><span>Seulement "+votesAgainstImp+" vote(s) sur "+impState.players.length+" l'ont soupçonné</span>"

  // Show votes summary
  var votesEl = document.getElementById("imp-reveal-votes")
  var colors = ["#FF4D6D","#3B82F6","#10B981","#8B5CF6","#F59E0B","#EC4899","#14B8A6","#84CC16"]
  var html = ""
  for(var v=0;v<impState.players.length;v++){
    var voter2 = impState.players[v]
    var targetIdx = impVotes[v]
    if(targetIdx == null) continue
    var target2 = impState.players[targetIdx]
    var correct = targetIdx === impIdx
    html += "<div style='display:flex;align-items:center;gap:8px;font-size:12px;color:var(--muted)'>"
    html += "<span style='font-size:16px'>"+voter2.av+"</span>"
    html += "<span>"+voter2.name+" → <strong style='color:"+(correct?"#10B981":"#FF4D6D")+"'>"+target2.name+"</strong></span>"
    html += "<span style='margin-left:auto'>"+(correct?"✅":"❌")+"</span>"
    html += "</div>"
  }
  votesEl.innerHTML = html

  // Hide "next round" btn if last round
  var nextBtn = document.getElementById("imp-next-round-btn")
  if(nextBtn) nextBtn.style.display = impState.tourN >= impTotalRounds ? "none" : ""

  document.querySelectorAll(".screen").forEach(function(s){ s.classList.remove("active","out") })
  setTimeout(function(){ document.getElementById("s-imp-reveal").classList.add("active") }, 80)
}

// ── NOUVEAU TOUR ──
function startNextImpRound(){
  impState.tourN++
  // Re-init with new impostor
  var subject = IMP_SUBJECTS[Math.floor(Math.random()*IMP_SUBJECTS.length)]
  var decoy   = IMP_DECOYS[Math.floor(Math.random()*IMP_DECOYS.length)]
  var impostorIdx = Math.floor(Math.random()*pcount)
  var allEmojis = ["\ud83e\udd8a","\ud83d\udc19","\ud83d\udc38","\ud83e\udd8b","\ud83d\udc3c","\ud83e\udd81","\ud83d\udc2f","\ud83e\udd84"]
  for(var i=0;i<impState.players.length;i++){
    impState.players[i].role = i===impostorIdx ? "impostor" : "normal"
    impState.players[i].subject = i===impostorIdx ? decoy : subject
    impState.players[i].realSubject = subject
  }
  impState.currentRoleIdx = 0
  // Go back to role distribution
  renderImpRoleScreen()
  document.querySelectorAll(".screen").forEach(function(s){ s.classList.remove("active","out") })
  setTimeout(function(){ document.getElementById("s-imp-roles").classList.add("active") }, 80)
}

function nextImpTurn(){ /* legacy - unused */ }
function impVote(){ startImpVote() }


function getImpDurationSeconds(){
  var idx = (typeof settingVals !== "undefined" && settingVals["time_turn"] != null) ? settingVals["time_turn"] : 1
  var base = IMP_DURATIONS[idx] || 45
  if(idx === 4 && typeof getCustomSeconds === "function") return getCustomSeconds("time_turn", 90)
  return base
}
