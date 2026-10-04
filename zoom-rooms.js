
(function(){
  var CDN='https://source.zoom.us/videosdk/zoom-video-2.3.15.min.js';
  var MAX_ROOM_PARTICIPANTS=8;
  var z={client:null,stream:null,chat:null,command:null,signal:null,signalReady:false,joined:false,topic:'',name:'',host:false,roomName:'',status:'',messages:[],videos:{},selfVideo:false,playbackTimer:null};

  function style(){
    if(document.getElementById('zoom-lounge-style'))return;
    var s=document.createElement('style');s.id='zoom-lounge-style';
    s.textContent='.zoom-panel{border:1px solid #315174;border-radius:20px;background:linear-gradient(180deg,#102039,#0b1526);padding:16px;margin:12px 0}.zoom-living{position:relative;border:1px solid #315174;border-radius:22px;background:#050b14;padding:12px;overflow:hidden}.zoom-living-center{position:relative;z-index:2;max-width:760px;margin:38px auto 26px;border:2px solid #35577e;border-radius:20px;background:#02060c;box-shadow:0 18px 45px rgba(0,0,0,.35);overflow:hidden}.zoom-living-center .zoom-tv-label{padding:8px 11px;background:#0b1424;color:#cbd6e9;font-weight:800;font-size:.82rem}.zoom-cams{display:grid;grid-template-columns:repeat(4,minmax(90px,1fr));gap:8px;position:absolute;inset:8px;z-index:3;pointer-events:none}.zoom-cam-slot{align-self:start;justify-self:start;width:min(22vw,150px);min-height:84px;border:2px solid #365a81;border-radius:14px;background:#07101d;overflow:hidden;box-shadow:0 8px 22px rgba(0,0,0,.35);pointer-events:auto}.zoom-cam-slot:nth-child(2){justify-self:end}.zoom-cam-slot:nth-child(3){align-self:end}.zoom-cam-slot:nth-child(4){align-self:end;justify-self:end}.zoom-cam-slot video,.zoom-cam-slot video-player{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;background:#000}.zoom-cam-name{display:block;padding:4px 6px;font-size:.72rem;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.zoom-living-empty{min-height:150px;display:grid;place-items:center;padding:24px;text-align:center;color:#9eabc1}@media(max-width:760px){.zoom-living{padding:7px}.zoom-living-center{margin:32px auto 18px}.zoom-cams{inset:5px;grid-template-columns:repeat(2,minmax(78px,1fr));gap:6px}.zoom-cam-slot{width:min(28vw,120px);min-height:70px;border-radius:11px}.zoom-cam-name{font-size:.66rem;padding:3px 5px}}.zoom-form{display:grid;gap:10px;max-width:720px}.zoom-form label{display:grid;gap:5px;color:#cbd6e9;font-weight:700}.zoom-form input{padding:12px;border:1px solid var(--line);border-radius:11px;background:#081221;color:#fff}.zoom-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.zoom-actions button{min-height:46px}.zoom-status{margin-top:10px;padding:10px 12px;border-radius:12px;background:#091425;border:1px solid var(--line);color:#cbd6e9}.zoom-people{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.zoom-person{border:1px solid var(--line);border-radius:14px;background:#081221;overflow:hidden}.zoom-person video-player{display:block;width:100%;aspect-ratio:16/9}.zoom-name{display:block;padding:7px 9px;font-weight:800;font-size:.86rem}.zoom-chat{border:1px solid var(--line);border-radius:14px;background:#081221;overflow:hidden}.zoom-chat-log{max-height:220px;overflow:auto;padding:10px}.zoom-chat-msg{padding:7px 0;border-bottom:1px solid #182840}.zoom-chat-form{display:flex;gap:7px;padding:9px;border-top:1px solid var(--line)}.zoom-chat-form input{flex:1;min-width:0;padding:10px;border:1px solid var(--line);border-radius:9px;background:#0b1627;color:#fff}.zoom-note{padding:12px;border:1px solid #29415d;border-radius:14px;background:#0a1423;color:#cbd6e9;line-height:1.5;margin-top:12px}@media(max-width:820px){.zoom-people{grid-template-columns:1fr 1fr}}';
    document.head.appendChild(s);
  }
  function escz(v){return typeof esc==='function'?esc(v):String(v||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function code(){var c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',o='';for(var i=0;i<8;i++)o+=c[Math.floor(Math.random()*c.length)];return o}
  function setStatus(m){z.status=m;var e=document.querySelector('[data-zoom-status]');if(e)e.textContent=m}
  function invite(){return location.origin+location.pathname+'?room='+encodeURIComponent(z.topic)}
  function view(){
    style();
    if(!z.joined)return '<div class="section"><div><h2>👥 Lounge Rooms</h2><span class="muted">Stay inside the lounge while you watch, talk and see each other.</span></div><span class="badge">ZOOM VIDEO SDK</span></div>'+
      '<div class="zoom-panel"><h3>🏠 Create a lounge room</h3><p class="muted">Create it here. Guests join here. Nobody leaves the lounge and guests do not need Zoom accounts.</p><div class="zoom-form"><label>Room name<input id="zoomCreateName" placeholder="Saturday Night Watch Room"></label><label>Your name<input id="zoomCreateUser" placeholder="Robert"></label><div class="zoom-actions"><button class="primary" data-zcreate>➕ Create Lounge Room</button></div></div></div>'+
      '<div class="zoom-panel"><h3>🚪 Join a lounge room</h3><p class="muted">Use the 8-character room code from the host.</p><div class="zoom-form"><label>Room code<input id="zoomJoinCode" placeholder="ABCDEFGH"></label><label>Your name<input id="zoomJoinUser" placeholder="Your name"></label><div class="zoom-actions"><button class="primary" data-zjoin>🚪 Join Lounge Room</button></div></div></div>'+
      '<div class="zoom-note"><b>TV stays in the lounge.</b> The room handles people, camera, microphone and chat. The host controls the lounge TV; guests follow the host\'s current lounge player when that source can be played in their browser.</div>'+
      (z.status?'<div class="notice">'+escz(z.status)+'</div>':'');
    return '<div class="section"><div><h2>👥 '+escz(z.roomName||'Lounge Room')+'</h2><span class="muted">'+(z.host?'You are the host/controller.':'You are a guest.')+'</span></div><span class="badge">ROOM '+escz(z.topic)+'</span></div>'+
      '<div class="zoom-panel"><div class="zoom-actions"><button class="primary" data-zcopy>🔗 Copy invite</button><button class="secondary" data-zaudio>🎙️ Join / toggle audio</button><button class="secondary" data-zvideo>📷 Turn camera on/off</button>'+(z.host?'<button class="secondary" data-zshare>🖥️ Share screen</button>':'')+'<button class="secondary" data-zleave>Leave room</button></div><div class="zoom-status" data-zoom-status>'+escz(z.status||'Room connected. Tap audio and camera when you are ready.')+'</div></div>'+
      '<div class="zoom-living"><div class="zoom-cams" data-zcams><div class="zoom-cam-slot" data-zself><div class="zoom-living-empty">Your camera is off</div></div></div><div class="zoom-living-center"><div class="zoom-tv-label">📺 Shared Lounge TV • '+(z.host?'You control the room':'Following the host')+'</div><div data-zoom-watch-center class="zoom-living-empty">The shared lounge player stays in this center stage when a channel is playing.</div></div></div>'+
      '<div class="zoom-panel"><h3 style="margin-top:0">👥 People in the living room</h3><div class="zoom-people" data-zpeople><div class="zoom-note">Waiting for everyone to arrive…</div></div></div>'+
      '<div class="zoom-chat"><div style="padding:10px 12px"><b>💬 Room chat</b></div><div class="zoom-chat-log" data-zchat></div><div class="zoom-chat-form"><input id="zoomChatInput" placeholder="Say something…"><button class="primary" data-zsend>Send</button></div></div>'+
      '<div class="zoom-note"><b>Shared TV:</b> '+(z.host?'You control what everyone follows.':'The host controls what everyone follows. You can still talk and use your camera.')+'</div>';
  }
  function syncRoomStage(){var center=document.querySelector('[data-zoom-watch-center]');var main=document.getElementById('mainPlayer');if(z.joined&&typeof tab!=='undefined'&&tab==='rooms'&&center&&main){center.innerHTML='';center.appendChild(main);return}if(main&&document.getElementById('playerDock')&&!document.getElementById('playerDock').contains(main))document.getElementById('playerDock').appendChild(main);if(center&&!main)center.innerHTML='<div class="zoom-living-empty">The shared lounge TV will appear here when the host starts a program.</div>'}
function rerender(){if(typeof render==='function')render();setTimeout(function(){people();chat();syncRoomStage()},0)}
  function load(){
    if(window.WebVideoSDK&&window.WebVideoSDK.default)return Promise.resolve(window.WebVideoSDK.default);
    return new Promise(function(ok,no){var s=document.createElement('script');s.src=CDN;s.onload=function(){ok(window.WebVideoSDK.default)};s.onerror=function(){no(new Error('Zoom Video SDK could not load.'))};document.head.appendChild(s)})
  }
  function token(topic,name,role){
    return fetch('/api/zoom-room-token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({topic:topic,userName:name,role:role})}).then(function(r){return r.json().then(function(d){if(!r.ok)throw new Error(d.error||'Zoom room setup is not connected yet.');return d.token})})
  }
  async function connect(topic,name,role,roomName){
    if(z.joined)await leave(false);
    z.topic=topic;z.name=name;z.host=role===1;z.roomName=roomName||'Lounge Room';setStatus('Connecting the lounge room…');
    try{
      var ZoomVideo=await load(), req=ZoomVideo.checkSystemRequirements?ZoomVideo.checkSystemRequirements():null;
      if(req&&!req.audio)throw new Error('This browser does not support the room audio needed here.');
      z.client=ZoomVideo.createClient();await z.client.init('en-US','Global',{patchJsMedia:true,stayAwake:true,leaveOnPageUnload:true});
      await z.client.join(topic,await token(topic,name,role),name,'');
      var joinedUsers=z.client.getAllUser?z.client.getAllUser():[];
      if(joinedUsers.length>MAX_ROOM_PARTICIPANTS){try{await z.client.leave(true)}catch(_){}throw new Error('This lounge room is full. The maximum is 8 people.');}
      z.stream=z.client.getMediaStream();z.chat=z.client.getChatClient&&z.client.getChatClient();z.command=z.client.getCommandClient&&z.client.getCommandClient();
      await connectSignal();
      wire();z.joined=true;setStatus(z.host?'Room ready. You are the host.':'You are in the room. Start audio/camera when you want.');rerender();setTimeout(function(){if(z.selfVideo)attachSelf();people()},80);
      if(z.host){broadcast();startPlaybackSync()}else requestState();
    }catch(e){console.error('Zoom room:',e);z.joined=false;z.client=null;z.stream=null;z.chat=null;z.command=null;setStatus(e.message||'The lounge room could not connect.');rerender()}
  }
  function wire(){
    z.client.on('active-share-change',async function(p){try{var holder=document.querySelector('[data-zshare-remote]');if(!holder){holder=document.createElement('div');holder.setAttribute('data-zshare-remote','');holder.style.marginTop='12px';holder.style.border='1px solid var(--line)';holder.style.borderRadius='14px';holder.style.overflow='hidden';var title=document.createElement('div');title.textContent='🖥️ Host shared Lounge screen';title.style.padding='8px 10px';title.style.background='#0b1424';title.style.color='#cbd6e9';holder.appendChild(title);var box=document.createElement('div');box.setAttribute('data-zshare-remote-box','');holder.appendChild(box);document.querySelector('.zoom-panel')?.appendChild(holder)}var box=document.querySelector('[data-zshare-remote-box]');if(p.state==='Active'){box.innerHTML='';var el=await z.stream.attachShareView(p.userId);box.appendChild(el)}else{box.innerHTML='';holder.remove()}}catch(e){console.warn(e)}});
    z.client.on('peer-share-state-change',async function(p){try{if(p.action==='Start'){var holder=document.querySelector('[data-zshare-remote]');if(!holder){holder=document.createElement('div');holder.setAttribute('data-zshare-remote','');holder.style.marginTop='12px';holder.style.border='1px solid var(--line)';holder.style.borderRadius='14px';holder.style.overflow='hidden';var title=document.createElement('div');title.textContent='🖥️ Host shared Lounge screen';title.style.padding='8px 10px';title.style.background='#0b1424';title.style.color='#cbd6e9';holder.appendChild(title);var box=document.createElement('div');box.setAttribute('data-zshare-remote-box','');holder.appendChild(box);document.querySelector('.zoom-panel')?.appendChild(holder)}var box=document.querySelector('[data-zshare-remote-box]');box.innerHTML='';var el=await z.stream.attachShareView(p.userId);box.appendChild(el)}else if(p.action==='Stop'){var holder=document.querySelector('[data-zshare-remote]');if(holder)holder.remove()}}catch(e){console.warn(e)}});
    z.client.on('user-added',function(){var all=z.client.getAllUser?z.client.getAllUser():[];if(all.length>MAX_ROOM_PARTICIPANTS){setStatus('This room is full (8 people maximum).');return}people();if(z.host)setTimeout(broadcast,200)});
    z.client.on('user-updated',people);z.client.on('user-removed',people);
    z.client.on('peer-video-state-change',async function(p){if(p.action==='Start')await attach(p.userId);else remove(p.userId);people()});
    z.client.on('chat-on-message',function(p){if(p&&p.message)z.messages.push({name:p.sender&&p.sender.name||'Guest',text:p.message});chat()});
    z.client.on('command-channel-message',function(p){var m;try{m=JSON.parse(p.text||'')}catch(_){return}if(m.type==='room-state'&&!z.host)apply(m.state);if(m.type==='room-state-request'&&z.host)broadcast();if(m.type==='room-navigation'&&!z.host)applyNavigation(m.target,m.app)});
    z.client.on('auto-play-audio-failed',function(){setStatus('Room joined. Tap the audio button once to enable room sound.')});
    z.client.on('active-media-failed',function(p){console.warn('room media failed:',p);if(p&&p.type&&String(p.type).toLowerCase().indexOf('audio')>=0)setStatus('Room audio needs attention. Tap the audio button again and allow microphone access.');else if(p&&p.type&&String(p.type).toLowerCase().indexOf('video')>=0)setStatus('Room camera needs attention. Tap the camera button again and allow camera access.')});
  }
  async function attachSelf(){if(!z.stream||!z.client)return;var box=document.querySelector('[data-zself]');if(!box)return;try{var me=z.client.getCurrentUserInfo().userId;if(!z.selfVideo){var v=await z.stream.attachVideo(me,3);box.innerHTML='';box.appendChild(v);var n=document.createElement('span');n.className='zoom-cam-name';n.textContent=z.name+' • You';box.appendChild(n);z.selfVideo=true}}catch(e){console.warn('self video:',e);box.innerHTML='<div class="zoom-living-empty">Camera is on, but this phone could not render the self-view.</div>'}}
  function detachSelf(){if(!z.stream||!z.client)return;try{z.stream.detachVideo(z.client.getCurrentUserInfo().userId)}catch(_){}z.selfVideo=false;var box=document.querySelector('[data-zself]');if(box)box.innerHTML='<div class="zoom-living-empty">Your camera is off</div>'}
  async function attach(id){
    if(!z.stream||z.videos[id])return;
    try{var v=await z.stream.attachVideo(id,3),u=document.createElement('div');u.className='zoom-cam-slot';u.dataset.zuser=id;u.innerHTML='<span class="zoom-name zoom-cam-name">Guest</span>';u.prepend(v);document.querySelector('[data-zcams]')?.appendChild(u);z.videos[id]=1;people()}catch(e){console.warn(e)}
  }
  function remove(id){var e=document.querySelector('[data-zuser="'+id+'"]');if(e)e.remove();delete z.videos[id]}
  function people(){
    var box=document.querySelector('[data-zpeople]');if(!box||!z.client)return;
    var all=z.client.getAllUser?z.client.getAllUser():[],me=z.client.getCurrentUserInfo().userId;
    if(!all.filter(function(u){return u.userId!==me}).length){box.innerHTML='<div class="zoom-note">You are here. Waiting for the other guests…</div>';return}
    all.forEach(function(u){if(u.userId!==me&&u.bVideoOn&&!z.videos[u.userId])attach(u.userId)});
    Object.keys(z.videos).forEach(function(id){if(!all.some(function(u){return String(u.userId)===String(id)}))remove(id)});
    Object.keys(z.videos).forEach(function(id){var u=all.find(function(x){return String(x.userId)===String(id)}),n=document.querySelector('[data-zuser="'+id+'"] .zoom-name');if(n)n.textContent=(u&&u.displayName||'Guest')+(u&&u.bAudioOn?' • 🎙️':' • 🔇')});
  }
  function chat(){
    var b=document.querySelector('[data-zchat]');if(!b)return;
    b.innerHTML=z.messages.map(function(m){return '<div class="zoom-chat-msg"><b>'+escz(m.name)+'</b>: '+escz(m.text)+'</div>'}).join('')||'<span class="muted">Room chat is ready.</span>';b.scrollTop=b.scrollHeight;
  }
  async function audio(){
    if(!z.stream)return;try{var me=z.client.getCurrentUserInfo();if(!me.audio){await z.stream.startAudio();setStatus('Room audio is connected. Your microphone is on.')}else if(me.muted){await z.stream.unmuteAudio();setStatus('Your microphone is on.')}else{await z.stream.muteAudio();setStatus('Your microphone is muted.')}}catch(e){setStatus('Please tap audio again and allow microphone access.')}
  }
  async function video(){
    if(!z.stream)return;
    try{var me=z.client.getAllUser().find(function(u){return u.userId===z.client.getCurrentUserInfo().userId});if(me&&me.bVideoOn){await z.stream.stopVideo();detachSelf();setStatus('Your camera is off.')}else{await z.stream.startVideo();await attachSelf();setStatus('Your camera is on. Guests can see you when their video view is active.')}people()}catch(e){console.warn('camera:',e);setStatus('Camera could not start. Please allow camera access for the lounge and try again.')}
  }
  function signalTopic(){return 'zoom-lounge-sync:'+String(z.topic||'').replace(/[^A-Z0-9_-]/gi,'').slice(0,80)}
async function connectSignal(){
  if(!(typeof supabaseClient!=='undefined'?supabaseClient:window.supabaseClient)||!z.topic)return;
  try{
    if(z.signal&&window.supabaseClient.removeChannel)try{await window.supabaseClient.removeChannel(z.signal)}catch(_){}
    z.signal=window.supabaseClient.channel(signalTopic(),{config:{broadcast:{self:false,ack:true}}});
    z.signal.on('broadcast',{event:'room-state'},function(p){if(!z.host&&p&&p.payload)apply(p.payload.state||p.payload)});
    z.signal.on('broadcast',{event:'room-state-request'},function(p){if(z.host)broadcast()});
    z.signal.on('broadcast',{event:'room-navigation'},function(p){if(!z.host&&p&&p.payload)applyNavigation(p.payload.target,p.payload.app)});
    await new Promise(function(resolve){z.signal.subscribe(function(status){if(status==='SUBSCRIBED'){z.signalReady=true;resolve(true)}else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'){resolve(false)}})});
  }catch(e){z.signalReady=false;console.warn('Room sync channel:',e)}
}
function disconnectSignal(){if(z.signal&&window.supabaseClient)try{window.supabaseClient.removeChannel(z.signal)}catch(_){}z.signal=null;z.signalReady=false}
async function signalSend(event,payload){
  if(!z.signal||!z.signalReady)return false;
  try{var r=await z.signal.send({type:'broadcast',event:event,payload:payload});return !r||r==='ok'||r==='OK'||r===true}catch(e){console.warn('Room sync send failed:',event,e);return false}
}
function playbackInfo(){try{var v=document.getElementById('liveVideo'),a=document.getElementById('radioAudio'),el=v||a;if(!el||!Number.isFinite(el.currentTime))return null;var info={time:el.currentTime,sentAt:Date.now(),paused:!!el.paused};try{if(el.seekable&&el.seekable.length){info.seekStart=el.seekable.start(0);info.seekEnd=el.seekable.end(el.seekable.length-1)}}catch(_){}return info}catch(_){return null}}
function snapshot(){var s=typeof roomWatchSnapshot==='function'?roomWatchSnapshot():(typeof current!=='undefined'&&current?{mode:'player',current:current}:{mode:'closed'});if(s&&s.mode==='player'){var p=playbackInfo();if(p)s.playback=p}return s}
function playbackElement(){return document.getElementById('liveVideo')||document.getElementById('radioAudio')}
function applyPlayback(p){if(!p)return;var el=playbackElement();if(!el)return;var target=p.time+(Date.now()-Number(p.sentAt||Date.now()))/1000;var correct=function(){try{if(!Number.isFinite(el.currentTime))return false;var drift=target-el.currentTime;if(Math.abs(drift)<0.9)return true;if(el.seekable&&el.seekable.length){var start=el.seekable.start(0),end=el.seekable.end(el.seekable.length-1);target=Math.max(start+0.25,Math.min(end-0.25,target));el.currentTime=target}else{el.playbackRate=Math.max(0.9,Math.min(1.1,1+Math.max(-0.08,Math.min(0.08,drift*0.04))));setTimeout(function(){try{el.playbackRate=1}catch(_){}},2200)}if(!p.paused)el.play?.().catch(()=>{});return true}catch(_){return false}};if(!correct()){var tries=0,t=setInterval(function(){tries++;if(correct()||tries>=10)clearInterval(t)},500)}}
  function broadcast(){if(!z.host)return;signalSend('room-state',{state:snapshot(),from:z.name,sentAt:Date.now()});}
function startPlaybackSync(){if(z.playbackTimer)clearInterval(z.playbackTimer);z.playbackTimer=setInterval(function(){if(z.host&&z.joined)broadcast()},1500)}
function stopPlaybackSync(){if(z.playbackTimer)clearInterval(z.playbackTimer);z.playbackTimer=null}
  function requestState(){signalSend('room-state-request',{from:z.name,requestedAt:Date.now()});}
  function apply(s){if(!s)return;var stayInRooms=(typeof tab!=='undefined'&&tab==='rooms');if(s.mode==='closed'){if(typeof closePlayer==='function'){roomApplyingRemote=true;try{closePlayer()}finally{roomApplyingRemote=false}if(stayInRooms){tab='rooms';if(typeof render==='function')render();syncRoomStage()}}return}if(s.mode==='player'&&s.current&&typeof showPlayer==='function'){roomApplyingRemote=true;try{showPlayer(Object.assign({},s.current))}finally{roomApplyingRemote=false}if(stayInRooms){tab='rooms';if(typeof render==='function')render();setTimeout(syncRoomStage,0)}if(s.playback)setTimeout(function(){applyPlayback(s.playback)},450)}}
  function applyNavigation(target,app){if(!target)return;roomApplyingRemote=true;try{if(target==='apps'&&app&&app.url){if(typeof openAppInHub==='function')openAppInHub(app.url,app.title||'Streaming App');else if(typeof setTab==='function')setTab('apps')}else if(typeof setTab==='function')setTab(target)}finally{roomApplyingRemote=false}}
function navigationChanged(target,app){if(z.host&&z.joined&&!roomApplyingRemote)signalSend('room-navigation',{target:String(target||''),app:app||null,from:z.name,sentAt:Date.now()});}
function tvChanged(){if(z.joined&&z.host)setTimeout(broadcast,80)}
  async function share(){if(!z.stream)return;try{if(!z.stream.startShareScreen){setStatus('Screen sharing is not available in this browser. The lounge TV will use synchronized player state instead.');return}var holder=document.querySelector('[data-zshare-view]');if(!holder){holder=document.createElement('div');holder.setAttribute('data-zshare-view','');holder.style.marginTop='12px';holder.style.border='1px solid var(--line)';holder.style.borderRadius='14px';holder.style.overflow='hidden';var title=document.createElement('div');title.textContent='🖥️ Shared Lounge Screen';title.style.padding='8px 10px';title.style.background='#0b1424';title.style.color='#cbd6e9';holder.appendChild(title);var video=document.createElement('video');video.id='zoomHostShareVideo';video.autoplay=true;video.playsInline=true;video.style.width='100%';video.style.display='block';holder.appendChild(video);document.querySelector('.zoom-panel')?.appendChild(holder)}var target=document.getElementById('zoomHostShareVideo');if(z.stream.isStartShareScreenWithVideoElement&&!z.stream.isStartShareScreenWithVideoElement()){setStatus('This browser needs the canvas screen-share path; the lounge will use synchronized TV state instead.');return}await z.stream.startShareScreen(target,{controls:{systemAudio:'include'}});setStatus('Your Lounge screen is being shared. Guests can now see the screen you selected, including content that cannot be synchronized as a player.');}catch(e){console.warn(e);setStatus('Screen sharing could not start. The lounge TV remains available through synchronized state.')}}
  async function copy(){try{await navigator.clipboard.writeText(invite());setStatus('Invite link copied. Send it to your guests.')}catch(_){setStatus('Room code: '+z.topic)}}
  async function send(){var i=document.getElementById('zoomChatInput'),v=(i&&i.value||'').trim();if(!v||!z.chat)return;try{await z.chat.sendToAll(v.slice(0,1000));z.messages.push({name:z.name,text:v.slice(0,1000)});i.value='';chat()}catch(_){setStatus('Room chat is temporarily unavailable.')}}
  async function leave(show){
    try{if(z.client)await z.client.leave(!!show)}catch(_){}
    try{z.client&&z.client.destroy&&z.client.destroy()}catch(_){}
    stopPlaybackSync();disconnectSignal();z.client=null;z.stream=null;z.chat=null;z.command=null;z.signal=null;z.signalReady=false;z.joined=false;z.topic='';z.name='';z.host=false;z.videos={};z.selfVideo=false;z.messages=[];
    if(show){setStatus('You left the lounge room.');rerender()}
  }
  window.zoomRoomsCreate=function(){connect(code(),(document.getElementById('zoomCreateUser')?.value||'Host').trim()||'Host',1,(document.getElementById('zoomCreateName')?.value||'').trim()||'Lounge Watch Room')};
  window.zoomRoomsJoin=function(){var t=(document.getElementById('zoomJoinCode')?.value||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'');if(!t){setStatus('Enter the room code first.');rerender();return}connect(t,(document.getElementById('zoomJoinUser')?.value||'Guest').trim()||'Guest',0,'Lounge Watch Room')};
  window.zoomRoomsLeave=leave;window.zoomRoomsView=view;
  window.roomsView=view;window.createRoom=window.zoomRoomsCreate;window.joinRoom=window.zoomRoomsJoin;window.leaveRoom=window.zoomRoomsLeave;window.toggleRoomMedia=video;
  document.addEventListener('click',function(e){if(e.target.closest?.('[data-zcreate]'))return window.zoomRoomsCreate();if(e.target.closest?.('[data-zjoin]'))return window.zoomRoomsJoin();if(e.target.closest?.('[data-zcopy]'))return copy();if(e.target.closest?.('[data-zaudio]'))return audio();if(e.target.closest?.('[data-zvideo]'))return video();if(e.target.closest?.('[data-zshare]'))return share();if(e.target.closest?.('[data-zleave]'))return leave(true);if(e.target.closest?.('[data-zsend]'))return send()},{capture:true});
  function handleRoomRoute(){var m=new URLSearchParams(location.search).get('room');if(m){z.topic=String(m).toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,12)}}
  handleRoomRoute();
  var os=window.showPlayer;if(typeof os==='function'&&!os.__zoom){var ws=function(){var r=os.apply(this,arguments);tvChanged();setTimeout(syncRoomStage,0);return r};ws.__zoom=true;window.showPlayer=ws}
  var oc=window.closePlayer;if(typeof oc==='function'&&!oc.__zoom){var wc=function(){var r=oc.apply(this,arguments);tvChanged();setTimeout(syncRoomStage,0);return r};wc.__zoom=true;window.closePlayer=wc}
  var ot=window.setTab;if(typeof ot==='function'&&!ot.__zoom){var wt=function(t){var r=ot.apply(this,arguments);navigationChanged(t,null);setTimeout(syncRoomStage,0);return r};wt.__zoom=true;window.setTab=wt}
  var oa=window.openAppInHub;if(typeof oa==='function'&&!oa.__zoom){var wa=function(url,title){var r=oa.apply(this,arguments);navigationChanged('apps',{url:String(url||''),title:String(title||'Streaming App')});return r};wa.__zoom=true;window.openAppInHub=wa}
  style();if(typeof render==='function')render();
})();