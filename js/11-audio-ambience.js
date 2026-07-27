(function(){
  'use strict'

  var STORAGE = 'deb8_audio_preferences'
  var prefs = { interfaceSounds:true, ambience:false, volume:0.28 }
  var ctx = null
  var master = null
  var ambienceNodes = []
  var ambienceTimer = null

  try {
    var saved = JSON.parse(localStorage.getItem(STORAGE) || '{}')
    prefs.interfaceSounds = saved.interfaceSounds !== false
    prefs.ambience = saved.ambience === true
    prefs.volume = Number.isFinite(saved.volume) ? Math.max(0,Math.min(1,saved.volume)) : 0.28
  } catch(e){}

  function save(){
    try { localStorage.setItem(STORAGE,JSON.stringify(prefs)) } catch(e){}
  }

  function ensureAudio(){
    if(!ctx){
      var AudioCtx = window.AudioContext || window.webkitAudioContext
      if(!AudioCtx) return false
      ctx = new AudioCtx()
      master = ctx.createGain()
      master.gain.value = prefs.volume
      master.connect(ctx.destination)
    }
    if(ctx.state === 'suspended') ctx.resume()
    return true
  }

  function clearAmbience(){
    if(ambienceTimer){ clearInterval(ambienceTimer); ambienceTimer=null }
    ambienceNodes.forEach(function(n){ try{ n.stop() }catch(e){} try{ n.disconnect() }catch(e){} })
    ambienceNodes=[]
  }

  function startAmbience(){
    if(!prefs.ambience || !ensureAudio()) return
    clearAmbience()
    var bed=ctx.createGain()
    bed.gain.value=0.22
    bed.connect(master)
    ;[110,164.81,220].forEach(function(freq,i){
      var osc=ctx.createOscillator()
      var gain=ctx.createGain()
      osc.type=i===1?'triangle':'sine'
      osc.frequency.value=freq
      gain.gain.value=i===0?0.055:0.025
      osc.connect(gain); gain.connect(bed); osc.start()
      ambienceNodes.push(osc,gain)
    })
    ambienceNodes.push(bed)
    ambienceTimer=setInterval(function(){
      if(!ctx || !prefs.ambience) return
      var notes=[329.63,392,440,493.88,523.25]
      var osc=ctx.createOscillator(), gain=ctx.createGain()
      osc.type='sine'; osc.frequency.value=notes[Math.floor(Math.random()*notes.length)]/2
      gain.gain.setValueAtTime(0,ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.025,ctx.currentTime+0.25)
      gain.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+2.8)
      osc.connect(gain); gain.connect(master); osc.start(); osc.stop(ctx.currentTime+3)
    },3600)
  }

  function clickSound(){
    if(!prefs.interfaceSounds || !ensureAudio()) return
    var osc=ctx.createOscillator(), gain=ctx.createGain()
    osc.type='sine'; osc.frequency.setValueAtTime(520,ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(700,ctx.currentTime+0.045)
    gain.gain.setValueAtTime(0.035,ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+0.08)
    osc.connect(gain); gain.connect(master); osc.start(); osc.stop(ctx.currentTime+0.09)
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
    if(prefs.interfaceSounds) clickSound()
  }
  window.toggleAmbience=function(){
    prefs.ambience=!prefs.ambience
    save(); syncUI()
    if(prefs.ambience) startAmbience(); else clearAmbience()
  }
  window.setAmbienceVolume=function(value){
    prefs.volume=Math.max(0,Math.min(1,Number(value)/100))
    if(master) master.gain.setTargetAtTime(prefs.volume,ctx.currentTime,0.03)
    save()
  }

  document.addEventListener('click',function(e){
    if(e.target.closest('button,.dc,.mc,.th,.toggle,.dd-item,.shop-teaser')) clickSound()
  },true)
  document.addEventListener('DOMContentLoaded',function(){
    syncUI()
    if(prefs.ambience){
      var resumeOnce=function(){ startAmbience(); document.removeEventListener('pointerdown',resumeOnce) }
      document.addEventListener('pointerdown',resumeOnce,{once:true})
    }
  })
})()
