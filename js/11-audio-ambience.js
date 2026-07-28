(function(){
  'use strict'

  var STORAGE = 'deb8_audio_preferences'
  var prefs = { interfaceSounds:true, ambience:false, volume:0.34 }
  var soundFiles = {
    tap:'assets/sounds/tap.ogg',
    start:'assets/sounds/start.ogg',
    next:'assets/sounds/next.ogg',
    vote:'assets/sounds/vote.ogg',
    countdown:'assets/sounds/countdown.ogg',
    reveal:'assets/sounds/reveal.ogg',
    win:'assets/sounds/win.ogg',
    lose:'assets/sounds/lose.ogg'
  }
  var sounds = {}
  var ambienceCtx = null
  var ambienceMaster = null
  var ambienceNodes = []
  var ambienceTimer = null
  var lastSoundAt = {}

  try {
    var saved = JSON.parse(localStorage.getItem(STORAGE) || '{}')
    prefs.interfaceSounds = saved.interfaceSounds !== false
    prefs.ambience = saved.ambience === true
    prefs.volume = Number.isFinite(saved.volume) ? Math.max(0,Math.min(1,saved.volume)) : 0.34
  } catch(e){}

  Object.keys(soundFiles).forEach(function(name){
    var audio = new Audio(soundFiles[name])
    audio.preload = 'auto'
    sounds[name] = audio
  })

  function save(){
    try { localStorage.setItem(STORAGE,JSON.stringify(prefs)) } catch(e){}
  }

  function play(name, force){
    if((!prefs.interfaceSounds && !force) || !sounds[name]) return
    var now = Date.now()
    if(lastSoundAt[name] && now-lastSoundAt[name] < 90) return
    lastSoundAt[name] = now
    try {
      var audio = sounds[name].cloneNode()
      audio.volume = Math.max(0.04, prefs.volume)
      audio.play().catch(function(){})
    } catch(e){}
  }
  window.playDeb8Sound = play

  function ensureAmbience(){
    if(!ambienceCtx){
      var AudioCtx = window.AudioContext || window.webkitAudioContext
      if(!AudioCtx) return false
      ambienceCtx = new AudioCtx()
      ambienceMaster = ambienceCtx.createGain()
      ambienceMaster.gain.value = prefs.volume * 0.45
      ambienceMaster.connect(ambienceCtx.destination)
    }
    if(ambienceCtx.state === 'suspended') ambienceCtx.resume()
    return true
  }

  function clearAmbience(){
    if(ambienceTimer){ clearInterval(ambienceTimer); ambienceTimer=null }
    ambienceNodes.forEach(function(n){ try{ n.stop() }catch(e){} try{ n.disconnect() }catch(e){} })
    ambienceNodes=[]
  }

  function startAmbience(){
    if(!prefs.ambience || !ensureAmbience()) return
    clearAmbience()
    ;[98,146.83,196].forEach(function(freq,i){
      var osc=ambienceCtx.createOscillator(), gain=ambienceCtx.createGain()
      osc.type=i===1?'triangle':'sine'
      osc.frequency.value=freq
      gain.gain.value=i===0?0.05:0.018
      osc.connect(gain); gain.connect(ambienceMaster); osc.start()
      ambienceNodes.push(osc,gain)
    })
    ambienceTimer=setInterval(function(){
      if(!ambienceCtx || !prefs.ambience) return
      var notes=[293.66,349.23,392,440]
      var osc=ambienceCtx.createOscillator(), gain=ambienceCtx.createGain()
      osc.type='sine'; osc.frequency.value=notes[Math.floor(Math.random()*notes.length)]/2
      gain.gain.setValueAtTime(0,ambienceCtx.currentTime)
      gain.gain.linearRampToValueAtTime(0.018,ambienceCtx.currentTime+0.25)
      gain.gain.exponentialRampToValueAtTime(0.0001,ambienceCtx.currentTime+2.4)
      osc.connect(gain); gain.connect(ambienceMaster); osc.start(); osc.stop(ambienceCtx.currentTime+2.5)
    },3200)
  }

  function syncUI(){
    var ui=document.getElementById('ui-sound-toggle')
    var ambience=document.getElementById('ambience-toggle')
    var volume=document.getElementById('ambience-volume')
    if(ui) ui.classList.toggle('on',prefs.interfaceSounds)
    if(ambience) ambience.classList.toggle('on',prefs.ambience)
    if(volume) volume.value=Math.round(prefs.volume*100)
  }

  window.toggleInterfaceSounds=function(){
    prefs.interfaceSounds=!prefs.interfaceSounds
    save(); syncUI()
    if(prefs.interfaceSounds) play('start')
  }
  window.toggleAmbience=function(){
    prefs.ambience=!prefs.ambience
    save(); syncUI()
    if(prefs.ambience) startAmbience(); else clearAmbience()
  }
  window.setAmbienceVolume=function(value){
    prefs.volume=Math.max(0,Math.min(1,Number(value)/100))
    if(ambienceMaster) ambienceMaster.gain.setTargetAtTime(prefs.volume*0.45,ambienceCtx.currentTime,0.03)
    save()
  }

  function soundForAction(el){
    var text=(el.textContent || '').toLowerCase()
    var action=(el.getAttribute('data-oc') || '').toLowerCase()
    if(/vote|vrai|faux|pour|contre|tranch|gagn/.test(text+' '+action)) return 'vote'
    if(/révél|voir mon rôle|afficher.*rôle|retourner/.test(text+' '+action)) return 'reveal'
    if(/jouer|lancer|commencer|démarrer|c'est parti/.test(text+' '+action)) return 'start'
    if(/suivant|continuer|prochaine|changer|switch|rejouer/.test(text+' '+action)) return 'next'
    return 'tap'
  }

  var screenSounds = {
    's-debate':'start','s-duel':'start','s-tf-vote':'start','s-imp-roles':'start',
    's-team':'start','s-multi-debate':'start','s-multi-duel-pour':'start',
    's-multi-tf':'start','s-multi-imp-player':'start',
    's-imp-vote':'vote','s-multi-imp-vote':'vote',
    's-imp-reveal':'reveal','s-multi-imp-reveal':'reveal',
    's-duel-final':'reveal','s-multi-tf-result':'reveal',
    's-podium':'win','s-team-end':'win','s-tf-end':'win'
  }

  function watchScreens(){
    var observer = new MutationObserver(function(changes){
      changes.forEach(function(change){
        var el=change.target
        if(el.classList && el.classList.contains('screen') && el.classList.contains('active')){
          var sound=screenSounds[el.id]
          if(sound) setTimeout(function(){ play(sound) },100)
        }
      })
    })
    document.querySelectorAll('.screen').forEach(function(screen){
      observer.observe(screen,{attributes:true,attributeFilter:['class']})
    })
  }

  function watchCountdowns(){
    var ids=['duel-timer','final-timer','tf-timer-p1','tf-timer-p2','imp-timer','multi-imp-timer','team-timer']
    ids.forEach(function(id){
      var el=document.getElementById(id)
      if(!el) return
      var previous=''
      new MutationObserver(function(){
        var value=(el.textContent || '').trim()
        if(value!==previous && /^(1|2|3)$/.test(value)) play('countdown')
        previous=value
      }).observe(el,{childList:true,subtree:true,characterData:true})
    })
  }

  document.addEventListener('click',function(e){
    var target=e.target.closest('button,.dc,.mc,.th,.toggle,.dd-item,.shop-teaser,.vote-choice')
    if(target) play(soundForAction(target))
  },true)

  document.addEventListener('DOMContentLoaded',function(){
    syncUI()
    watchScreens()
    watchCountdowns()
    if(prefs.ambience){
      document.addEventListener('pointerdown',function(){ startAmbience() },{once:true})
    }
  })
})()
