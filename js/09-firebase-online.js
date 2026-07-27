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
const state={app:null,auth:null,db:null,user:null,profile:null,roomCode:null,room:null,isHost:false,roomRef:null,playerRef:null,roomListener:null,selectedAvatar:'🦊',launching:false};

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
    const ref=state.db.ref('rooms/'+code),snap=await ref.once('value');if(!snap.exists())throw new Error('Cette partie est introuvable.');
    const room=snap.val();if(room.status!=='lobby')throw new Error('Cette partie a déjà commencé.');
    state.roomCode=code;state.roomRef=ref;state.isHost=room.hostId===state.user.uid;
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
window.leaveOnlineRoom=async function(){try{if(state.playerRef)await state.playerRef.remove();if(state.isHost&&state.roomRef)await state.roomRef.remove()}catch(e){}cleanupRoomState();showScreen('s2')};
function cleanupRoomState(){if(state.roomRef&&state.roomListener)state.roomRef.off('value',state.roomListener);Object.assign(state,{roomCode:null,room:null,isHost:false,roomRef:null,playerRef:null,roomListener:null,launching:false})}

window.startOnlineGame=async function(){
  if(!state.isHost||!state.room?.mode)return;const ps=players(),meta=MODE_META[state.room.mode];if(ps.length<meta.min||!ps.every(p=>p.ready))return;
  const ordered=ps.sort((a,b)=>(a.joinedAt||0)-(b.joinedAt||0));
  const game={status:'starting',mode:state.room.mode,startedAt:now(),hostId:state.user.uid,round:1,questionIndex:0,players:ordered.map(p=>({uid:p.uid,name:p.name,avatar:p.avatar})),revision:Date.now()};
  if(state.room.mode==='duel'){game.roles={[ordered[0].uid]:'pour',[ordered[1].uid]:'contre',[ordered[2].uid]:'arbitre'}}
  if(state.room.mode==='imp'){
    const impIdx=Math.floor(Math.random()*ordered.length),subject=IMP_SUBJECTS[Math.floor(Math.random()*IMP_SUBJECTS.length)],decoy=IMP_DECOYS[Math.floor(Math.random()*IMP_DECOYS.length)];game.impostorUid=ordered[impIdx].uid;game.subject=subject;
    const updates={};ordered.forEach((p,i)=>updates['private/'+p.uid]={role:i===impIdx?'impostor':'normal',subject:i===impIdx?decoy:subject,avatar:p.avatar,name:p.name});await state.roomRef.update(updates);
  }
  await state.roomRef.update({status:'playing',game,updatedAt:now()});
};
function handleRoomState(){if(state.room?.status==='playing'&&state.room.game&&!state.launching){state.launching=true;launchOnlineMode(state.room.game).catch(e=>{state.launching=false;alert('Lancement : '+e.message)})}}
async function launchOnlineMode(game){
  const ps=game.players||[],myIdx=Math.max(0,ps.findIndex(p=>p.uid===state.user.uid));pcount=ps.length;playerNames=ps.map(p=>p.name);devMode='multi';gameMode=game.mode;
  if(game.mode==='debate'){previewMultiDebate(state.isHost);syncDebate(game)}
  else if(game.mode==='tf'){previewMultiTF(myIdx);syncTF(game)}
  else if(game.mode==='duel'){const role=game.roles?.[state.user.uid]||'pour';multiDuelState.players={pour:toPlayer(ps.find(p=>game.roles?.[p.uid]==='pour')),contre:toPlayer(ps.find(p=>game.roles?.[p.uid]==='contre')),arbitre:toPlayer(ps.find(p=>game.roles?.[p.uid]==='arbitre'))};previewMultiDuel(role);syncDuel(game)}
  else if(game.mode==='imp'){const priv=(await state.roomRef.child('private/'+state.user.uid).once('value')).val();launchFirebaseImpostor(game,priv,myIdx)}
}
function toPlayer(p){return {name:p?.name||'Joueur',av:p?.avatar||'🙂'}}

function syncDebate(game){
  multiDebState.players=(game.players||[]).map(p=>({name:p.name,av:p.avatar}));multiDebState.totalQ=multiDebState.questions.length;
  state.roomRef.child('game/questionIndex').on('value',s=>{const i=s.val()||0;if(i!==multiDebState.qIdx){multiDebState.qIdx=i;renderMultiDebateScreen()}});
  const original=window.multiDebateNext;window.multiDebateNext=function(){if(!state.isHost)return;state.roomRef.child('game/questionIndex').transaction(v=>((v||0)+1)%multiDebState.questions.length)};window.multiDebateSkip=window.multiDebateNext;
}
function syncTF(game){
  clearInterval(multiTFState.timerInt)
  state.roomRef.child('game/tf').on('value',s=>{
    const v=s.val()||{}
    if(v.finished){clearInterval(multiTFState.timerInt);goToScreen('s-tf-end');return}
    if(v.questionIndex!=null&&v.questionIndex!==multiTFState.qIdx){
      multiTFState.qIdx=v.questionIndex
      renderMultiTFScreen()
      goToScreen('s-multi-tf')
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
    if(state.isHost&&Object.keys(snap.val()||{}).length>=players().length){
      setTimeout(()=>state.roomRef.child('game/tf/showResult').set(true),400)
    }
  }
  window.multiTFNext=async function(){
    if(!state.isHost)return
    const next=multiTFState.qIdx+1
    if(next>=multiTFState.questions.length){
      await state.roomRef.child('game/tf').set({questionIndex:multiTFState.qIdx,votes:{},showResult:false,finished:true})
    }else{
      await state.roomRef.child('game/tf').set({questionIndex:next,votes:{},showResult:false,finished:false})
    }
  }
  if(state.isHost)state.roomRef.child('game/tf').set({questionIndex:0,votes:{},showResult:false,finished:false});
}
function syncDuel(game){
  const pool=typeof getDuelQuestionPool==='function'?getDuelQuestionPool():[]
  state.roomRef.child('game/duel').on('value',s=>{
    const d=s.val();if(!d)return
    multiDuelState.tour=d.tour||1
    multiDuelState.scores=d.scores||{pour:0,contre:0}
    multiDuelState.question=d.question||multiDuelState.question
    if(d.finished){showMultiDuelPodium();return}
    renderMultiDuelScreen()
    if(multiDuelState.role==='arbitre')renderMultiArbScreen()
  });
  if(state.isHost)state.roomRef.child('game/duel').set({tour:1,totalTours:multiDuelState.totalTours,scores:{pour:0,contre:0},speaker:'pour',question:pool[0]||multiDuelState.question,finished:false});
  window.multiArbVote=async function(winner){
    if(multiDuelState.role!=='arbitre')return
    const ref=state.roomRef.child('game/duel')
    const snap=await ref.once('value'),d=snap.val()||{}
    if(d.finished)return
    d.scores=d.scores||{pour:0,contre:0}
    d.scores[winner]=(d.scores[winner]||0)+1
    d.tour=(d.tour||1)+1
    d.finished=d.tour>(d.totalTours||multiDuelState.totalTours)
    if(!d.finished&&pool.length)d.question=pool[(d.tour-1)%pool.length]
    await ref.set(d)
    const popup=document.getElementById('mda-vote-popup')
    if(popup)popup.style.display='none'
  };
}
function launchFirebaseImpostor(game,priv,myIdx){
  multiImpState.isHost=state.isHost;multiImpState.myPlayerIdx=myIdx;multiImpState.players=(game.players||[]).map((p,i)=>({name:p.name,av:p.avatar,role:i===myIdx?priv.role:'hidden',subject:i===myIdx?priv.subject:''}));multiImpState.round=game.round||1;multiImpState.totalRounds=3;renderMultiPlayerScreen();goToScreen('s-multi-imp-player');
  const oldToggle=window.toggleMultiRole;window.toggleMultiRole=function(){const me=multiImpState.players[myIdx];me.role=priv.role;me.subject=priv.subject;oldToggle()};
}

// Direct join via shared URL
window.addEventListener('DOMContentLoaded',async()=>{
  buildAvatarGrid();const p=loadProfile();if(p){state.profile=p;state.selectedAvatar=p.avatar;const name=document.getElementById('online-profile-name');if(name)name.value=p.name;const av=document.getElementById('online-avatar-preview');if(av)av.textContent=p.avatar}
  const params=new URLSearchParams(location.search),code=normalizeCode(params.get('room'));if(code){await ensureFirebase().catch(()=>{});if(p){showScreen('s15');const input=document.getElementById('online-join-code');if(input)input.value=code}}
});
})();
