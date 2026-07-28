/* Deb8 V24 — moteur multijoueur Firebase Realtime Database */
(function(){
'use strict';

const FIREBASE_CONFIG={
  apiKey:'AIzaSyBImESh2mcZtOBnzjDawyPiEXEzbz-bSvg',
  authDomain:'deb8-3df5d.firebaseapp.com',
  databaseURL:'https://deb8-3df5d-default-rtdb.europe-west1.firebasedatabase.app',
  projectId:'deb8-3df5d',
  storageBucket:'deb8-3df5d.firebasestorage.app',
  messagingSenderId:'839398207563',
  appId:'1:839398207563:web:1dbe43fff9988b78f55dce'
};

const ONLINE_AVATARS=['🦊','🐙','🐸','🦋','🐼','🦁','🐯','🦄','🐧','🐰','🐻','🐺'];
const MODE_META={
  debate:{label:'Débat classique',icon:'🎙️',min:2},
  duel:{label:'1v1 + arbitre',icon:'⚔️',min:3},
  tf:{label:'Vrai / Faux',icon:'✅',min:2},
  imp:{label:'Imposteur',icon:'🕵️',min:3}
};
const state={app:null,auth:null,db:null,user:null,profile:null,roomCode:null,room:null,isHost:false,roomRef:null,playerRef:null,roomListener:null,gameBindings:[],selectedAvatar:'🦊',launching:false};

function setStatus(msg){const e=document.getElementById('online-connection-status');if(e)e.textContent=msg||''}
function setError(msg){const e=document.getElementById('online-entry-error');if(e)e.textContent=msg||''}
function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active','out'));setTimeout(()=>document.getElementById(id)?.classList.add('active'),60)}
function normalizeCode(v){return String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,5)}
function randomCode(){const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<5;i++)s+=chars[Math.floor(Math.random()*chars.length)];return s}
function now(){return firebase.database.ServerValue.TIMESTAMP}

async function ensureFirebase(){
  if(state.user)return state.user;
  if(!window.firebase)throw new Error('Le module Firebase n’a pas pu être chargé.');
  if(!firebase.apps.length)firebase.initializeApp(FIREBASE_CONFIG);
  state.app=firebase.app();state.auth=firebase.auth();state.db=firebase.database();
  const cred=await state.auth.signInAnonymously();state.user=cred.user;
  return state.user;
}

function loadProfile(){
  try{const p=JSON.parse(localStorage.getItem('deb8_online_profile')||'null');if(p&&p.name&&p.avatar)return p}catch(e){}
  return null;
}
function saveProfileLocal(p){localStorage.setItem('deb8_online_profile',JSON.stringify(p));state.profile=p}
function buildAvatarGrid(){
  const grid=document.getElementById('online-avatar-grid');if(!grid)return;
  const current=state.profile?.avatar||state.selectedAvatar;state.selectedAvatar=current;
  grid.innerHTML=ONLINE_AVATARS.map(a=>`<button class="online-avatar-choice ${a===current?'on':''}" data-avatar="${a}">${a}</button>`).join('');
  grid.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{state.selectedAvatar=b.dataset.avatar;document.getElementById('online-avatar-preview').textContent=state.selectedAvatar;grid.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b))}));
}

window.openOnlineFlow=async function(){
  try{await ensureFirebase();state.profile=loadProfile();if(!state.profile){buildAvatarGrid();showScreen('s14')}else{showScreen('s15')}}catch(e){alert('Firebase : '+e.message)}
};
window.saveOnlineProfile=function(){
  const input=document.getElementById('online-profile-name');const name=(input?.value||'').trim();
  if(name.length<2){input?.focus();return}
  saveProfileLocal({name:name.slice(0,16),avatar:state.selectedAvatar});showScreen('s15');
};

async function reserveRoom(){
  for(let i=0;i<12;i++){const code=randomCode(),ref=state.db.ref('rooms/'+code);const snap=await ref.once('value');if(!snap.exists())return {code,ref}}
  throw new Error('Impossible de générer un code. Réessaie.');
}

window.createOnlineRoom=async function(){
  setError('');try{
    await ensureFirebase();state.profile=state.profile||loadProfile();if(!state.profile)return openOnlineFlow();
    const {code,ref}=await reserveRoom();state.roomCode=code;state.roomRef=ref;state.isHost=true;
    await ref.set({hostId:state.user.uid,status:'lobby',mode:null,createdAt:now(),updatedAt:now(),players:{}});
    await joinPlayerRecord(true);listenRoom();showScreen('s7');
  }catch(e){setError(e.message)}
};
window.joinOnlineRoom=async function(){
  setError('');try{
    await ensureFirebase();state.profile=state.profile||loadProfile();if(!state.profile)return openOnlineFlow();
    const code=normalizeCode(document.getElementById('online-join-code')?.value);if(code.length!==5)throw new Error('Entre le code à 5 caractères.');
    const ref=state.db.ref('rooms/'+code);
    const [statusSnap,hostSnap]=await Promise.all([ref.child('status').once('value'),ref.child('hostId').once('value')]);
    if(!statusSnap.exists())throw new Error('Cette partie est introuvable.');
    if(statusSnap.val()!=='lobby')throw new Error('Cette partie a déjà commencé.');
    state.roomCode=code;state.roomRef=ref;state.isHost=hostSnap.val()===state.user.uid;
    await joinPlayerRecord(state.isHost);listenRoom();showScreen('s7');
  }catch(e){setError(e.message)}
};

async function joinPlayerRecord(host){
  state.playerRef=state.roomRef.child('players/'+state.user.uid);
  await state.playerRef.update({uid:state.user.uid,name:state.profile.name,avatar:state.profile.avatar,ready:false,host:!!host,online:true,joinedAt:now(),lastSeen:now()});
  state.playerRef.onDisconnect().update({online:false,ready:false,lastSeen:now()});
  state.roomRef.child('updatedAt').set(now());
}
function listenRoom(){
  if(state.roomListener&&state.roomRef)state.roomRef.off('value',state.roomListener);
  state.roomListener=snap=>{if(!snap.exists()){cleanupRoomState();showScreen('s15');setError('La salle a été fermée.');return}state.room=snap.val();state.isHost=state.room.hostId===state.user.uid;renderLobby();handleRoomState()};
  state.roomRef.on('value',state.roomListener);
}
function players(){return Object.values(state.room?.players||{}).filter(p=>p.online!==false)}
function shuffledCopy(items){
  const copy=(items||[]).slice();
  for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]]}
  return copy;
}
function onlineTFQuestionPool(){
  const all=typeof deb8SelectedTFQuestions==='function'?deb8SelectedTFQuestions():(typeof tfAllQuestions!=='undefined'&&Array.isArray(tfAllQuestions)?tfAllQuestions:[]);
  const wanted=Math.max(4,Math.min(Number(typeof settingVals!=='undefined'?settingVals.nb_questions:10)||10,20));
  return shuffledCopy(all).slice(0,Math.min(wanted,all.length));
}
async function onlineDebateQuestionPool(){
  if(typeof prepareDebateQuestions==='function')await prepareDebateQuestions();
  const all=Array.isArray(debateGameQuestions)?debateGameQuestions:[];
  const wanted=Math.max(4,Math.min(Number(typeof settingVals!=='undefined'?settingVals.nb_questions:8)||8,20));
  return shuffledCopy(all).slice(0,Math.min(wanted,all.length)).map(q=>({
    text:String(q?.text||q?.question||q||''),
    theme:String(q?.theme||'Classique')
  }));
}
function renderLobby(){
  const room=state.room||{}, ps=players(), me=room.players?.[state.user.uid];
  document.getElementById('online-room-code').textContent=state.roomCode||'-----';
  document.getElementById('online-player-count').textContent=`Joueurs (${ps.length})`;
  const list=document.getElementById('online-player-list');if(list)list.innerHTML=ps.sort((a,b)=>(b.host?1:0)-(a.host?1:0)||(a.joinedAt||0)-(b.joinedAt||0)).map(p=>`<div class="pl"><div class="pl-av" style="background:rgba(139,92,246,.14)">${p.avatar||'🙂'}</div><div><div class="pl-name">${escapeHtml(p.name||'Joueur')}${p.host?'<span class="online-host-tag">HÔTE</span>':''}${p.uid===state.user.uid?'<span class="online-you-tag">TOI</span>':''}</div><div class="pl-stat">${p.ready?'Prêt à débattre':'Pas encore prêt'}</div></div><div class="pl-dot ${p.ready?'dot-green':'dot-blink'}"></div></div>`).join('');
  const ready=document.getElementById('online-ready-btn');if(ready){ready.classList.toggle('ready',!!me?.ready);ready.textContent=me?.ready?'✅ Je suis prêt':'Je suis prêt'}
  document.getElementById('online-host-mode-panel').style.display=state.isHost?'flex':'none';
  document.getElementById('online-player-mode-wait').style.display=state.isHost?'none':'flex';
  document.querySelectorAll('.online-mode-btn').forEach(b=>b.classList.toggle('on',b.dataset.mode===room.mode));
  const meta=MODE_META[room.mode];document.getElementById('online-mode-label').textContent=meta?.label||'L’hôte choisit…';document.getElementById('online-mode-icon').textContent=meta?.icon||'🎮';
  const allReady=ps.length>0&&ps.every(p=>p.ready), min=meta?.min||99, enough=ps.length>=min;
  const start=document.getElementById('online-start-btn');start.style.display=state.isHost?'block':'none';start.disabled=!(room.mode&&allReady&&enough);start.style.opacity=start.disabled?'.4':'1';
  document.getElementById('online-lobby-hint').textContent=!room.mode?'Choisis un mode.':!enough?`Il faut au moins ${min} joueurs pour ce mode.`:!allReady?'Tous les joueurs doivent être prêts.':'Tout le monde est prêt !';
  setStatus('Synchronisé avec Firebase · '+ps.length+' connecté'+(ps.length>1?'s':''));
}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
window.toggleOnlineReady=async function(){if(!state.playerRef)return;const ready=!!state.room?.players?.[state.user.uid]?.ready;await state.playerRef.update({ready:!ready,lastSeen:now()})};
window.onlineSelectMode=async function(mode){if(!state.isHost||!MODE_META[mode])return;await state.roomRef.update({mode,updatedAt:now()})};
window.copyOnlineCode=async function(){try{await navigator.clipboard.writeText(state.roomCode);setStatus('Code copié : '+state.roomCode)}catch(e){alert(state.roomCode)}};
window.shareOnlineRoom=async function(){const url=location.origin+location.pathname+'?room='+state.roomCode;const data={title:'Rejoins ma partie Deb8',text:'Code Deb8 : '+state.roomCode,url};if(navigator.share)await navigator.share(data).catch(()=>{});else{await navigator.clipboard.writeText(url);setStatus('Lien copié')}};
window.leaveOnlineRoom=async function(){try{if(state.playerRef)await state.playerRef.remove();if(state.isHost&&state.roomRef){await Promise.all([state.db.ref('playerSecrets/'+state.roomCode).remove(),state.db.ref('hostSecrets/'+state.roomCode).remove(),state.roomRef.remove()])}}catch(e){}cleanupRoomState();showScreen('s2')};
function clearGameBindings(){
  (state.gameBindings||[]).forEach(binding=>binding.ref.off('value',binding.callback));
  state.gameBindings=[];
  if(typeof multiTFState!=='undefined')clearInterval(multiTFState.timerInt);
  if(typeof multiDuelState!=='undefined')clearInterval(multiDuelState.timerInt);
  if(typeof multiImpState!=='undefined')clearInterval(multiImpState.timerInt);
}
function bindGameValue(ref,callback){ref.on('value',callback);state.gameBindings.push({ref,callback})}
function cleanupRoomState(){clearGameBindings();if(state.roomRef&&state.roomListener)state.roomRef.off('value',state.roomListener);Object.assign(state,{roomCode:null,room:null,isHost:false,roomRef:null,playerRef:null,roomListener:null,gameBindings:[],launching:false})}

window.startOnlineGame=async function(){
  if(!state.isHost||!state.room?.mode)return;const ps=players(),meta=MODE_META[state.room.mode];if(ps.length<meta.min||!ps.every(p=>p.ready))return;
  clearGameBindings();
  const ordered=ps.slice().sort((a,b)=>(a.joinedAt||0)-(b.joinedAt||0));
  const game={status:'starting',mode:state.room.mode,startedAt:now(),hostId:state.user.uid,round:1,questionIndex:0,players:ordered.map(p=>({uid:p.uid,name:p.name,avatar:p.avatar})),revision:Date.now()};
  if(state.room.mode==='debate'){
    const questions=await onlineDebateQuestionPool();
    if(!questions.length){alert('Aucune question Débat disponible.');return}
    game.debate={questionIndex:0,questions,starterIndexes:questions.map(()=>Math.floor(Math.random()*ordered.length)),finished:false};
  }
  if(state.room.mode==='tf'){
    const questions=onlineTFQuestionPool();
    if(!questions.length){alert('Aucune question Vrai/Faux disponible.');return}
    game.tf={questionIndex:0,question:questions[0],questions,votes:{},showResult:false,finished:false};
  }
  if(state.room.mode==='duel'){
    const questions=onlineTFQuestionPool();
    if(!questions.length){alert('Aucune question 1v1 disponible.');return}
    const roleOrder=shuffledCopy(ordered);
    game.roles={};
    game.roles[roleOrder[0].uid]='pour';game.roles[roleOrder[1].uid]='contre';
    roleOrder.slice(2).forEach(p=>{game.roles[p.uid]='arbitre'});
    game.duel={tour:1,totalTours:Math.min(questions.length,Math.max(3,Number(typeof settingVals!=='undefined'?settingVals.nb_questions:5)||5)),scores:{pour:0,contre:0},phase:'pour',phaseStartedAt:now(),duration:45,questionIndex:0,questions,question:questions[0],ballots:{},finished:false};
  }
  if(state.room.mode==='imp'){
    const pair=deb8RandomImpostorPair(),impIdx=Math.floor(Math.random()*ordered.length),subject=pair.subject,decoy=pair.decoy;
    game.imp={round:1,totalRounds:Math.max(1,Number(typeof settingVals!=='undefined'?settingVals.nb_parties:3)||3),phase:'roles',duration:60,votes:{},finished:false};
    const secrets={};ordered.forEach((p,i)=>secrets[p.uid]={role:i===impIdx?'impostor':'normal',subject:i===impIdx?decoy:subject});
    await Promise.all([
      state.db.ref('playerSecrets/'+state.roomCode).set(secrets),
      state.db.ref('hostSecrets/'+state.roomCode).set({impostorUid:ordered[impIdx].uid,subject,decoy})
    ]);
  }
  await state.roomRef.update({status:'playing',game,updatedAt:now()});
};
function handleRoomState(){
  if(state.room?.status==='playing'&&state.room.game&&!state.launching){
    state.launching=true;
    launchOnlineMode(state.room.game).catch(e=>{state.launching=false;alert('Lancement : '+e.message)})
    return
  }
  if(state.room?.status==='lobby'&&state.launching){
    clearGameBindings();state.launching=false;showScreen('s7')
  }
}
window.returnOnlineLobby=async function(){
  if(!state.roomRef){showScreen('s2');return}
  clearGameBindings()
  if(state.isHost){
    const updates={status:'lobby',game:null,updatedAt:now()}
    Object.keys(state.room?.players||{}).forEach(uid=>{updates['players/'+uid+'/ready']=false})
    await Promise.all([
      state.roomRef.update(updates),
      state.db.ref('playerSecrets/'+state.roomCode).remove(),
      state.db.ref('hostSecrets/'+state.roomCode).remove()
    ])
  }else{
    state.launching=false;showScreen('s7')
  }
}
async function launchOnlineMode(game){
  const ps=game.players||[],myIdx=Math.max(0,ps.findIndex(p=>p.uid===state.user.uid));pcount=ps.length;playerNames=ps.map(p=>p.name);devMode='multi';gameMode=game.mode;
  if(game.mode==='debate'){
    multiDebState.isHost=state.isHost;
    multiDebState.myIdx=myIdx;
    multiDebState.players=ps.map(p=>({uid:p.uid,name:p.name,av:p.avatar}));
    multiDebState.questions=(game.debate?.questions||[]).map(q=>q.text||q);
    multiDebState.qIdx=0;
    multiDebState.totalQ=multiDebState.questions.length;
    renderMultiDebateScreen();
    goToScreen('s-multi-debate');
    syncDebate(game)
  }
  else if(game.mode==='tf'){
    const tf=game.tf||{};
    previewMultiTF(myIdx,ps,tf.questions||[]);
    syncTF(game)
  }
  else if(game.mode==='duel'){
    const role=game.roles?.[state.user.uid]||'arbitre';
    const arbiters=ps.filter(p=>game.roles?.[p.uid]==='arbitre').map(toPlayer);
    multiDuelState.players={pour:toPlayer(ps.find(p=>game.roles?.[p.uid]==='pour')),contre:toPlayer(ps.find(p=>game.roles?.[p.uid]==='contre')),arbitre:arbiters[0]||toPlayer(null)};
    multiDuelState.arbiters=arbiters;
    previewMultiDuel(role);
    syncDuel(game)
  }
  else if(game.mode==='imp'){const priv=(await state.db.ref('playerSecrets/'+state.roomCode+'/'+state.user.uid).once('value')).val();if(!priv)throw new Error('Ton rôle privé est indisponible.');launchFirebaseImpostor(game,priv,myIdx)}
}
function toPlayer(p){return {name:p?.name||'Joueur',av:p?.avatar||'🙂'}}

function syncDebate(game){
  const initial=game.debate||{};
  multiDebState.isHost=state.isHost;
  multiDebState.players=(game.players||[]).map(p=>({name:p.name,av:p.avatar}));
  multiDebState.questions=(initial.questions||[]).map(q=>q.text||q);
  multiDebState.totalQ=multiDebState.questions.length;
  bindGameValue(state.roomRef.child('game/debate'),async s=>{
    const d=s.val()||{};
    if(d.finished){clearGameBindings();if(state.isHost)await state.roomRef.update({status:'lobby',game:null,updatedAt:now()});return}
    if(Array.isArray(d.questions)&&d.questions.length){
      multiDebState.questions=d.questions.map(q=>q.text||q);
      multiDebState.totalQ=multiDebState.questions.length;
    }
    multiDebState.qIdx=Math.max(0,d.questionIndex||0);
    renderMultiDebateScreen();
    const q=d.questions?.[multiDebState.qIdx];
    const tag=document.getElementById('md-theme-tag');if(tag&&q?.theme)tag.textContent='⚡ '+q.theme;
    const starter=multiDebState.players[d.starterIndexes?.[multiDebState.qIdx]||0];
    const av=document.getElementById('md-starter-av');if(av&&starter)av.textContent=starter.av;
    const name=document.getElementById('md-starter-name');if(name&&starter)name.textContent=starter.name;
    goToScreen('s-multi-debate');
  });
  window.multiDebateNext=window.multiDebateSkip=async function(){
    if(!state.isHost)return;
    const ref=state.roomRef.child('game/debate');
    await ref.transaction(d=>{
      if(!d||d.finished)return d;
      const next=(d.questionIndex||0)+1;
      if(next>=(d.questions||[]).length)d.finished=true;else d.questionIndex=next;
      return d;
    });
  };
}
function syncTF(game){
  clearInterval(multiTFState.timerInt)
  bindGameValue(state.roomRef.child('game/tf'),s=>{
    const v=s.val()||{}
    if(v.finished){
      clearInterval(multiTFState.timerInt);goToScreen('s-tf-end');
      const restart=document.querySelector('#s-tf-end [data-oc="go(1)"]');if(restart)restart.setAttribute('data-oc','returnOnlineLobby()');
      return
    }
    if(Array.isArray(v.questions)&&v.questions.length)multiTFState.questions=v.questions.slice()
    if(v.questionIndex!=null&&v.questionIndex!==multiTFState.qIdx){
      multiTFState.qIdx=v.questionIndex
      renderMultiTFScreen()
      goToScreen('s-multi-tf')
    }
    if(v.question&&multiTFState.questions[multiTFState.qIdx]!==v.question){
      multiTFState.questions[multiTFState.qIdx]=v.question
      const question=document.getElementById('mtf-question')
      if(question)question.textContent=v.question
    }
    const onlineVotes=v.votes||{},indexed={}
    Object.keys(onlineVotes).forEach(uid=>{
      const i=(game.players||[]).findIndex(p=>p.uid===uid)
      if(i<0)return
      indexed[i]=onlineVotes[uid]
      const dot=document.getElementById('mtf-dot-'+i)
      if(dot){dot.style.background=onlineVotes[uid]==='vrai'?'#10B981':'#FF4D6D'}
    })
    multiTFState.votes[multiTFState.qIdx]=indexed
    const participantIds=new Set((game.players||[]).map(p=>p.uid))
    const validVoteCount=Object.keys(onlineVotes).filter(uid=>participantIds.has(uid)).length
    if(state.isHost&&!v.showResult&&participantIds.size>0&&validVoteCount>=participantIds.size){
      state.roomRef.child('game/tf/showResult').set(true)
      return
    }
    if(v.showResult){
      clearInterval(multiTFState.timerInt)
      finishMultiTFVote()
    }
  })
  window.castMultiTFVote=async function(val){
    if(multiTFState.myVote)return
    multiTFState.myVote=val
    clearInterval(multiTFState.timerInt)
    const voteBox=document.getElementById('mtf-my-vote')
    const votedMsg=document.getElementById('mtf-voted-msg')
    const voteIcon=document.getElementById('mtf-my-vote-icon')
    if(voteBox)voteBox.style.display='none'
    if(votedMsg)votedMsg.style.display='block'
    if(voteIcon)voteIcon.textContent=val==='vrai'?'✅':'❌'
    await state.roomRef.child('game/tf/votes/'+state.user.uid).set(val)
    const snap=await state.roomRef.child('game/tf/votes').once('value')
    const participantIds=new Set((game.players||[]).map(p=>p.uid))
    const validVoteCount=Object.keys(snap.val()||{}).filter(uid=>participantIds.has(uid)).length
    if(state.isHost&&validVoteCount>=participantIds.size){
      setTimeout(()=>state.roomRef.child('game/tf/showResult').set(true),400)
    }
  }
  window.multiTFNext=async function(){
    if(!state.isHost)return
    const next=multiTFState.qIdx+1
    if(next>=multiTFState.questions.length){
      await state.roomRef.child('game/tf').update({questionIndex:multiTFState.qIdx,votes:{},showResult:false,finished:true})
    }else{
      await state.roomRef.child('game/tf').update({questionIndex:next,question:multiTFState.questions[next],votes:{},showResult:false,finished:false})
    }
  }
  if(state.isHost&&!game.tf)state.roomRef.child('game/tf').set({questionIndex:0,question:multiTFState.questions[0],questions:multiTFState.questions,votes:{},showResult:false,finished:false});
}
function syncDuel(game){
  let timer=null,lastPhase='',finalizing=false;
  bindGameValue(state.roomRef.child('game/duel'),s=>{
    const d=s.val();if(!d)return
    multiDuelState.tour=d.tour||1
    multiDuelState.totalTours=d.totalTours||5
    multiDuelState.scores=d.scores||{pour:0,contre:0}
    multiDuelState.question=d.question||multiDuelState.question
    if(d.finished){clearInterval(timer);showMultiDuelPodium();return}
    renderMultiDuelScreen()
    if(multiDuelState.role==='arbitre')renderMultiArbScreen()
    const phase=d.phase||'pour'
    const statusPour=document.getElementById('mdp-active-banner'),statusContre=document.getElementById('mdc-status'),statusArb=document.getElementById('mda-status')
    if(statusPour){statusPour.textContent=phase==='pour'?'🎙️ C’est ton tour — argumente POUR !':phase==='verdict'?'⏳ L’arbitre tranche…':'⏳ Le camp CONTRE argumente…';statusPour.style.color=phase==='pour'?'#3B82F6':'var(--muted)'}
    if(statusContre){statusContre.textContent=phase==='contre'?'🎙️ C’est ton tour — argumente CONTRE !':phase==='verdict'?'⏳ L’arbitre tranche…':'⏳ Le camp POUR argumente…';statusContre.style.color=phase==='contre'?'#FF4D6D':'var(--muted)'}
    if(statusArb){statusArb.textContent=phase==='verdict'?'🏛️ Verdict !':'⏳ '+multiDuelState.players[phase]?.name+' argumente '+phase.toUpperCase()+'…'}
    const popup=document.getElementById('mda-vote-popup');if(popup)popup.style.display=phase==='verdict'&&multiDuelState.role==='arbitre'?'flex':'none'
    if(state.isHost&&phase==='verdict'&&!finalizing){
      const arbiterIds=(game.players||[]).filter(p=>game.roles?.[p.uid]==='arbitre').map(p=>p.uid)
      const ballots=d.ballots||{},valid=arbiterIds.filter(uid=>ballots[uid]==='pour'||ballots[uid]==='contre')
      if(arbiterIds.length&&valid.length===arbiterIds.length){
        finalizing=true
        finalizeDuelRound(arbiterIds).finally(()=>{finalizing=false})
      }
    }
    if(phase!==lastPhase){
      lastPhase=phase;clearInterval(timer)
      if(phase!=='verdict'){
        timer=setInterval(()=>{
          const sec=Math.max(0,(d.duration||45)-Math.floor((Date.now()-(d.phaseStartedAt||Date.now()))/1000))
          multiDuelState.timerSec=sec;updateMultiDuelTimer(phase)
          if(sec<=0){clearInterval(timer);advanceDuelPhase(phase)}
        },250)
      }
    }
  });
  async function advanceDuelPhase(role){
    if(game.roles?.[state.user.uid]!==role&&!state.isHost)return
    await state.roomRef.child('game/duel').transaction(d=>{
      if(!d||d.finished||d.phase!==role)return d
      d.phase=role==='pour'?'contre':'verdict';d.phaseStartedAt=now();return d
    })
  }
  window.multiDuelNextSpeaker=advanceDuelPhase
  async function finalizeDuelRound(arbiterIds){
    await state.roomRef.child('game/duel').transaction(d=>{
      if(!d||d.finished||d.phase!=='verdict')return d
      const ballots=d.ballots||{},valid=arbiterIds.filter(uid=>ballots[uid]==='pour'||ballots[uid]==='contre')
      if(valid.length<arbiterIds.length)return d
      const pour=valid.filter(uid=>ballots[uid]==='pour').length,contre=valid.length-pour
      const roundWinner=pour===contre?ballots[valid[0]]:(pour>contre?'pour':'contre')
      d.scores=d.scores||{pour:0,contre:0};d.scores[roundWinner]=(d.scores[roundWinner]||0)+1
      d.tour=(d.tour||1)+1;d.finished=d.tour>(d.totalTours||5);d.ballots={}
      if(!d.finished){d.questionIndex=(d.questionIndex||0)+1;d.question=d.questions[d.questionIndex%d.questions.length];d.phase='pour';d.phaseStartedAt=now()}
      return d
    })
  }
  window.multiArbVote=async function(winner){
    if(multiDuelState.role!=='arbitre')return
    const ref=state.roomRef.child('game/duel')
    await ref.child('ballots/'+state.user.uid).set(winner)
    const popup=document.getElementById('mda-vote-popup')
    if(popup)popup.style.display='none'
  };
}
function launchFirebaseImpostor(game,priv,myIdx){
  let timer=null,lastPhase=''
  const playersByUid=game.players||[]
  multiImpState.isHost=state.isHost;multiImpState.myPlayerIdx=myIdx;multiImpState.players=playersByUid.map((p,i)=>({uid:p.uid,name:p.name,av:p.avatar,role:i===myIdx?priv.role:'hidden',subject:i===myIdx?priv.subject:''}));multiImpState.impostorIdx=-1;multiImpState.subject='';multiImpState.round=game.imp?.round||1;multiImpState.totalRounds=game.imp?.totalRounds||3;renderMultiPlayerScreen();goToScreen(state.isHost?'s-multi-imp-host':'s-multi-imp-player');
  const oldToggle=window.toggleMultiRole;window.toggleMultiRole=function(){const me=multiImpState.players[myIdx];me.role=priv.role;me.subject=priv.subject;oldToggle()};
  bindGameValue(state.roomRef.child('game/imp'),async s=>{
    const d=s.val();if(!d)return
    multiImpState.round=d.round||1;multiImpState.totalRounds=d.totalRounds||3;multiImpState.votes={}
    Object.keys(d.votes||{}).forEach(voterUid=>{const vi=playersByUid.findIndex(p=>p.uid===voterUid),ti=playersByUid.findIndex(p=>p.uid===d.votes[voterUid]);if(vi>=0&&ti>=0)multiImpState.votes[vi]=ti})
    if(d.phase!==lastPhase){
      lastPhase=d.phase;clearInterval(timer)
      if(d.phase==='roles'){
        const privateSnap=await state.db.ref('playerSecrets/'+state.roomCode+'/'+state.user.uid).once('value')
        priv=privateSnap.val()||priv
        multiImpState.impostorIdx=-1;multiImpState.subject=''
        const me=multiImpState.players[myIdx];if(me){me.role=priv.role;me.subject=priv.subject}
        multiImpState.myVote=null;renderMultiPlayerScreen();if(state.isHost)renderMultiHostScreen();goToScreen(state.isHost?'s-multi-imp-host':'s-multi-imp-player')
      }
      if(d.phase==='debate'){
        renderMultiImpostorDebateScreen(state.isHost);goToScreen('s-multi-imp-debate')
        timer=setInterval(()=>{
          multiImpState.timerSec=Math.max(0,(d.duration||60)-Math.floor((Date.now()-(d.startedAt||Date.now()))/1000));updateMultiTimer()
          if(multiImpState.timerSec<=0){clearInterval(timer);if(state.isHost)state.roomRef.child('game/imp/phase').set('vote')}
        },250)
      }
      if(d.phase==='vote'){multiImpState.myVote=d.votes?.[state.user.uid]||null;renderMultiSuspects();const list=document.getElementById('multi-suspects-list'),wait=document.getElementById('multi-voted-waiting');if(list)list.style.display=multiImpState.myVote?'none':'flex';if(wait)wait.style.display=multiImpState.myVote?'block':'none';goToScreen('s-multi-imp-vote')}
      if(d.phase==='reveal'||d.phase==='finished'){
        multiImpState.impostorIdx=playersByUid.findIndex(p=>p.uid===d.revealImpostorUid)
        multiImpState.subject=d.revealSubject||'';multiImpState.decoy=d.revealDecoy||''
        const imp=multiImpState.players[multiImpState.impostorIdx];if(imp){imp.role='impostor';imp.subject=d.revealDecoy||''}
        showMultiReveal()
        if(d.phase==='finished'){const next=document.getElementById('multi-next-round-btn');if(next)next.style.display='none'}
      }
    }
    const count=Object.keys(d.votes||{}).filter(uid=>playersByUid.some(p=>p.uid===uid)).length,total=playersByUid.length
    const counter=document.getElementById('multi-vote-count');if(counter)counter.textContent=count+' / '+total+' votes'
    if(state.isHost&&d.phase==='vote'&&count>=total){
      const secret=(await state.db.ref('hostSecrets/'+state.roomCode).once('value')).val()
      if(secret)await state.roomRef.child('game/imp').update({phase:'reveal',revealImpostorUid:secret.impostorUid,revealSubject:secret.subject,revealDecoy:secret.decoy})
    }
  })
  window.multiHostLaunchDebate=async function(){if(state.isHost)await state.roomRef.child('game/imp').update({phase:'debate',startedAt:now(),votes:{}})}
  window.multiHostSkipDebate=async function(){if(state.isHost)await state.roomRef.child('game/imp/phase').set('vote')}
  window.castMultiVote=async function(suspectIdx){
    if(multiImpState.myVote!=null)return
    const target=playersByUid[suspectIdx];if(!target||target.uid===state.user.uid)return
    multiImpState.myVote=suspectIdx;await state.roomRef.child('game/imp/votes/'+state.user.uid).set(target.uid)
  }
  window.multiNextRound=async function(){
    if(!state.isHost)return
    const snap=await state.roomRef.child('game/imp').once('value'),d=snap.val()||{}
    if((d.round||1)>=(d.totalRounds||3)){await state.roomRef.child('game/imp/phase').set('finished');return}
    const pair=deb8RandomImpostorPair(),impIdx=Math.floor(Math.random()*playersByUid.length),updates={}
    playersByUid.forEach((p,i)=>{updates[p.uid]={role:i===impIdx?'impostor':'normal',subject:i===impIdx?pair.decoy:pair.subject}})
    await Promise.all([
      state.db.ref('playerSecrets/'+state.roomCode).set(updates),
      state.db.ref('hostSecrets/'+state.roomCode).set({impostorUid:playersByUid[impIdx].uid,subject:pair.subject,decoy:pair.decoy}),
      state.roomRef.child('game/imp').set({round:(d.round||1)+1,totalRounds:d.totalRounds||3,phase:'roles',duration:d.duration||60,votes:{},finished:false})
    ])
  }
}

// Direct join via shared URL
window.addEventListener('DOMContentLoaded',async()=>{
  buildAvatarGrid();const p=loadProfile();if(p){state.profile=p;state.selectedAvatar=p.avatar;const name=document.getElementById('online-profile-name');if(name)name.value=p.name;const av=document.getElementById('online-avatar-preview');if(av)av.textContent=p.avatar}
  const params=new URLSearchParams(location.search),code=normalizeCode(params.get('room'));if(code){await ensureFirebase().catch(()=>{});if(p){showScreen('s15');const input=document.getElementById('online-join-code');if(input)input.value=code}}
});
})();
