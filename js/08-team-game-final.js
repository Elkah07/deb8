function teamNextSpeaker(){
  clearInterval(teamTimerInt)
  if(!teamState.speakersDone) teamState.speakersDone = []
  teamState.speakersDone.push(teamState.currentSpeaker)

  if(teamState.speakersDone.length >= 2){
    // Les deux ont parlé → popup verdict arbitre
    teamState.speakersDone = []
    showTeamArbVote()
  } else {
    // Passer à l'autre équipe
    teamState.currentSpeaker = teamState.currentSpeaker === 'pour' ? 'contre' : 'pour'
    renderTeamGameNew()
    startTeamTimer()
  }
}

function showTeamArbVote(){
  var t1  = teamState.teams[teamState.currentPair[0]]
  var t2  = teamState.teams[teamState.currentPair[1]]
  var arb = teamState.teams[teamState.arbitreIdx]

  var lbl = document.getElementById('team-arb-label')
  if(lbl) lbl.textContent = arb.emoji + ' ' + arb.name + ' — qui a le mieux argumenté ?'
  var sco = document.getElementById('team-score-now')
  if(sco) sco.textContent = t1.name + ' ' + t1.score + ' — ' + t2.name + ' ' + t2.score

  var choices = document.getElementById('team-vote-choices')
  if(choices){
    choices.innerHTML = [
      {team: t1, idx: teamState.currentPair[0], camp:'POUR'},
      {team: t2, idx: teamState.currentPair[1], camp:'CONTRE'}
    ].map(function(item){
      return '<button data-oc="giveTeamPoint(' + item.idx + ')" style="flex:1;padding:14px 8px;border-radius:16px;border:2px solid ' + item.team.color + '50;background:' + item.team.color + '12;cursor:pointer;text-align:center">' +
        '<div style="font-size:26px">' + item.team.emoji + '</div>' +
        '<div style="font-size:13px;font-weight:800;color:' + item.team.color + ';margin-top:4px">' + item.team.name + '</div>' +
        '<div style="font-size:10px;color:' + item.team.color + ';margin-top:2px">' + item.camp + '</div>' +
        '</button>'
    }).join('')
  }

  var popup = document.getElementById('team-vote-popup')
  if(popup){ popup.style.display='flex'; popup.style.opacity='0'; popup.style.transform='scale(0.95)'
    requestAnimationFrame(function(){ requestAnimationFrame(function(){
      popup.style.transition='opacity .25s,transform .25s'
      popup.style.opacity='1'; popup.style.transform='scale(1)'
    })})
  }
}

function giveTeamPoint(teamIdx){
  teamState.teams[teamIdx].score++
  // Hide popup
  var popup = document.getElementById('team-vote-popup')
  if(popup){ popup.style.opacity='0'; setTimeout(function(){ popup.style.display='none'; popup.style.transition='' }, 260) }

  teamState.tourIdx++
  var totalTours = teamState.nbTours || (teamState.teams.length * (teamState.teams.length - 1))
  if(teamState.tourIdx >= totalTours){
    clearInterval(teamTimerInt)
    setTimeout(showTeamEnd, 300)
    return
  }
  // Arbitre is FIXED for the whole game
  // POUR and CONTRE swap camps each tour
  var tmp = teamState.currentPair[0]
  teamState.currentPair[0] = teamState.currentPair[1]
  teamState.currentPair[1] = tmp
  teamState.currentSpeaker = 'pour'
  teamState.speakersDone = []
  teamState.qIdx++

  setTimeout(function(){
    renderTeamGameNew()
    startTeamTimer()
  }, 300)
}

// ═══════════════════════════════════════════════════
// POPUP ANNONCE RÔLES 1V1
// ═══════════════════════════════════════════════════
var _roleAnnounceQueue = []
var _roleAnnounceIdx = 0

function showRoleAnnounce(queue){
  _roleAnnounceQueue = queue
  _roleAnnounceIdx = 0
  renderRoleAnnounce()
  var popup = document.getElementById('duel-role-announce')
  if(popup){ popup.style.display='flex'; popup.style.opacity='0'; popup.style.transform='scale(0.95)'
    requestAnimationFrame(function(){ requestAnimationFrame(function(){
      popup.style.transition='opacity .25s,transform .25s'
      popup.style.opacity='1'; popup.style.transform='scale(1)'
    })})
  }
}

function renderRoleAnnounce(){
  var item = _roleAnnounceQueue[_roleAnnounceIdx]
  if(!item) return
  var emoji  = document.getElementById('dra-emoji')
  var title  = document.getElementById('dra-title')
  var badge  = document.getElementById('dra-role-badge')
  var desc   = document.getElementById('dra-desc')
  var btn    = document.getElementById('dra-btn')
  var isLast = _roleAnnounceIdx === _roleAnnounceQueue.length - 1

  if(emoji) emoji.textContent = item.emoji
  if(title) title.textContent = item.name
  if(badge){
    badge.textContent = item.role
    badge.style.background = item.color + '25'
    badge.style.color = item.color
    badge.style.border = '1.5px solid ' + item.color + '50'
  }
  if(desc)  desc.innerHTML = item.desc
  if(btn){
    btn.textContent = isLast ? 'Lancer la partie !' : 'OK, compris !'
    btn.style.background = isLast
      ? 'linear-gradient(135deg,#10B981,#14B8A6)'
      : 'linear-gradient(135deg,' + item.color + ',' + item.color + 'aa)'
  }
}

function nextRoleAnnounce(){
  _roleAnnounceIdx++
  if(_roleAnnounceIdx >= _roleAnnounceQueue.length){
    var popup = document.getElementById('duel-role-announce')
    if(popup){ popup.style.opacity='0'; popup.style.transform='scale(0.95)'
      setTimeout(function(){ popup.style.display='none'; popup.style.transition='' }, 260)
    }
    // Fire callback if set (e.g. startTeamTimer after team role announce)
    if(window._afterAnnounce){
      var fn = window._afterAnnounce
      window._afterAnnounce = null
      setTimeout(fn, 300)
    }
    return
  }
  // Animate transition
  var popup = document.getElementById('duel-role-announce')
  if(popup){ popup.style.opacity='0'; popup.style.transform='scale(0.95)'
    setTimeout(function(){
      renderRoleAnnounce()
      popup.style.transition='opacity .2s,transform .2s'
      popup.style.opacity='1'; popup.style.transform='scale(1)'
    }, 200)
  }
}
