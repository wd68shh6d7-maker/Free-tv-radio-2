
(function(){
  var CDN='https://source.zoom.us/videosdk/zoom-video-2.3.15.min.js';
  var z={client:null,stream:null,chat:null,command:null,joined:false,topic:'',name:'',host:false,roomName:'',status:'',messages:[],videos:{}};

  function style(){
    if(document.getElementById('zoom-lounge-style'))return;
    var s=document.createElement('style');s.id='zoom-lounge-style';
    s.textContent='.zoom-panel{border:1px solid #315174;border-radius:20px;background:linear-gradient(180deg,#102039,#0b1526);padding:16px;margin:12px 0}.zoom-form{display:grid;gap:10px;max-width:720px}.zoom-form label{display:grid;gap:5px;color:#cbd6e9;font-weight:700}.zoom-form input{padding:12px;border:1px solid var(--line);border-radius:11px;background:#081221;color:#fff}.zoom-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.zoom-actions button{min-height:46px}.zoom-status{margin-top:10px;padding:10px 12px;border-radius:12px;background:#091425;border:1px solid var(--line);color:#cbd6e9}.zoom-people{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.zoom-person{border:1px solid var(--line);border-radius:14px;background:#081221;overflow:hidden}.zoom-person video-player{display:block;width:100%;aspect-ratio:16/9}.zoom-name{display:block;padding:7px 9px;font-weight:800;font-size:.86rem}.zoom-chat{border:1px solid var(--line);border-radius:14px;background:#081221;overflow:hidden}.zoom-chat-log{max-height:220px;overflow:auto;padding:10px}.zoom-chat-msg{padding:7px 0;border-bottom:1px solid #182840}.zoom-chat-form{display:flex;gap:7px;padding:9px;border-top:1px solid var(--line)}.zoom-chat-form input{flex:1;min-width:0;padding:10px;border:1px solid var(--line);border-radius:9px;background:#0b1627;color:#fff}.zoom-note{padding:12px;border:1px solid #29415d;border-radius:14px;background:#0a1423;color:#cbd6e9;line-height:1.5;margin-top:12px}@media(max-width:820px){.zoom-people{grid-template-columns:1fr 1fr}}';
    document.head.appendChild(s);
  }
  function escz(v){return typeof esc==='function'?esc(v):String(v||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function code(){var c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',o='';for(var i=0;i<8;i++)o+=c[Math.floor(Math.random()*c.length)];return o}
  function setStatus(m){z.status=m;var e=document.querySelector('[data-zoom-status]');if(e)e.textContent=m}
  function invite(){return location.origin+location.pathname+'#rooms='+encodeURIComponent(z.topic)}
  function view(){
    style();
    if(!z.joined)return '<div class="section"><div><h2>👥 Lounge Rooms</h2><span class="muted">Stay inside the lounge while you watch, talk and see each other.</span></div><span class="badge">ZOOM VIDEO SDK</span></div>'+
      '<div class="zoom-panel"><h3>🏠 Create a lounge room</h3><p class="muted">Create it here. Guests join here. Nobody leaves the lounge and guests do not need Zoom accounts.</p><div class="zoom-form"><label>Room name<input id="zoomCreateName" placeholder="Saturday Night Watch Room"></label><label>Your name<input id="zoomCreateUser" placeholder="Robert"></label><div class="zoom-actions"><button class="primary" data-zcreate>➕ Create Lounge Room</button></div></div></div>'+
      '<div class="zoom-panel"><h3>🚪 Join a lounge room</h3><p class="muted">Use the 8-character room code from the host.</p><div class="zoom-form"><label>Room code<input id="zoomJoinCode" placeholder="ABCDEFGH"></label><label>Your name<input id="zoomJoinUser" placeholder="Your name"></label><div class="zoom-actions"><button class="primary" data-zjoin>🚪 Join Lounge Room</button></div></div></div>'+
      '<div class="zoom-note"><b>TV stays in the lounge.</b> The room handles people, camera, microphone and chat. The host controls the lounge TV; guests follow the host\'s current lounge player when that source can be played in their browser.</div>'+
      (z.status?'<div class="notice">'+escz(z.status)+'</div>':'');
    return '<div class="section"><div><h2>👥 '+escz(z.roomName||'Lounge Room')+'</h2><span class="muted">'+(z.host?'You are the host/controller.':'You are a guest.')+'</span></div><span class="badge">ROOM '+escz(z.topic)+'</span></div>'+
      '<div class="zoom-panel"><div class="zoom-actions"><button class="primary" data-zcopy>🔗 Copy invite</button><button class="secondary" data-zaudio>🎙️ Join / toggle audio</button><button class="secondary" data-zvideo>📷 Turn camera on/off</button>'+(z.host?'<button class="secondary" data-zshare>🖥️ Share screen (desktop)</button>':'')+'<button class="secondary" data-zleave>Leave room</button></div><div class="zoom-status" data-zoom-status>'+escz(z.status||'Room connected. Tap audio when you want to talk.')+'</div></div>'+
      '<div class="zoom-panel"><h3>👥 People in the living room</h3><div class="zoom-people" data-zpeople><div class="zoom-note">Waiting for everyone to arrive…</div></div></div>'+
      '<div class="zoom-chat"><div style="padding:10px 12px"><b>💬 Room chat</b></div><div class="zoom-chat-log" data-zchat></div><div class="zoom-chat-form"><input id="zoomChatInput" placeholder="Say something…"><button class="primary" data-zsend>Send</button></div></div>'+
      '<div class="zoom-note"><b>Shared TV:</b> '+(z.host?'You control what everyone follows.':'The host controls the shared lounge TV. You can still talk and use your camera.')+'</div>';
  }
  function rerender(){if(typeof render==='function')render();setTimeout(function(){people();chat()},0)}
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
      z.stream=z.client.getMediaStream();z.chat=z.client.getChatClient&&z.client.getChatClient();z.command=z.client.getCommandClient&&z.client.getCommandClient();
      wire();z.joined=true;setStatus(z.host?'Room ready. You are the host.':'You are in the room. Start audio/camera when you want.');rerender();
      if(z.host)broadcast();else requestState();
    }catch(e){console.error('Zoom room:',e);z.joined=false;z.client=null;z.stream=null;z.chat=null;z.command=null;setStatus(e.message||'The lounge room could not connect.');rerender()}
  }
  function wire(){
    z.client.on('user-added',function(){people();if(z.host)setTimeout(broadcast,200)});
    z.client.on('user-updated',people);z.client.on('user-removed',people);
    z.client.on('peer-video-state-change',async function(p){if(p.action==='Start')await attach(p.userId);else remove(p.userId);people()});
    z.client.on('chat-on-message',function(p){if(p&&p.message)z.messages.push({name:p.sender&&p.sender.name||'Guest',text:p.message});chat()});
    z.client.on('command-channel-message',function(p){var m;try{m=JSON.parse(p.text||'')}catch(_){return}if(m.type==='room-state'&&!z.host)apply(m.state);if(m.type==='room-state-request'&&z.host)broadcast()});
    z.client.on('auto-play-audio-failed',function(){setStatus('Room joined. Tap the audio button once to enable room sound.')});
  }
  async function attach(id){
    if(!z.stream||z.videos[id])return;
    try{var v=await z.stream.attachVideo(id,3),u=document.createElement('div');u.className='zoom-person';u.dataset.zuser=id;u.innerHTML='<span class="zoom-name">Guest</span>';u.prepend(v);document.querySelector('[data-zpeople]')?.appendChild(u);z.videos[id]=1;people()}catch(e){console.warn(e)}
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
    if(!z.stream)return;try{await z.stream.startAudio();setStatus('Room audio is connected. Use the audio button to mute/unmute.')}catch(e){try{await z.stream.unmuteAudio();setStatus('Room microphone is on.')}catch(_){setStatus('Please tap audio again and allow microphone access.')}}rerender()
  }
  async function video(){
    if(!z.stream)return;
    try{var me=z.client.getAllUser().find(function(u){return u.userId===z.client.getCurrentUserInfo().userId});if(me&&me.bVideoOn){await z.stream.stopVideo()}else{await z.stream.startVideo()}people()}catch(e){setStatus('Camera could not start. Please allow camera access for the lounge and try again.')}
  }
  function snapshot(){return typeof roomWatchSnapshot==='function'?roomWatchSnapshot():(typeof current!=='undefined'&&current?{mode:'player',current:current}:{mode:'closed'})}
  function broadcast(){if(z.host&&z.command)try{z.command.send(JSON.stringify({type:'room-state',state:snapshot()}))}catch(e){}}
  function requestState(){if(z.command)try{z.command.send(JSON.stringify({type:'room-state-request'}))}catch(e){}}
  function apply(s){if(!s)return;if(s.mode==='closed'){if(typeof closePlayer==='function'){roomApplyingRemote=true;try{closePlayer()}finally{roomApplyingRemote=false}}}else if(s.mode==='player'&&s.current&&typeof showPlayer==='function'){roomApplyingRemote=true;try{showPlayer(Object.assign({},s.current))}finally{roomApplyingRemote=false}}}
  function tvChanged(){if(z.joined&&z.host)setTimeout(broadcast,80)}
  function share(){if(!z.stream)return;if(!z.stream.startShareScreen){setStatus('Screen sharing is not available in this browser. iPhone/iPad web browsers cannot send screen share through Zoom Video SDK; the lounge therefore uses TV-state syncing instead.');return}var v=document.createElement('video');v.autoplay=true;v.playsInline=true;v.style.display='none';document.body.appendChild(v);z.stream.startShareScreen(v,{controls:{systemAudio:'include'}}).then(function(){setStatus('Screen sharing is on. This desktop option is a backup; the lounge TV stays the main screen.')}).catch(function(){setStatus('Screen sharing could not start. The lounge TV remains available.')})}
  async function copy(){try{await navigator.clipboard.writeText(invite());setStatus('Invite link copied. Send it to your guests.')}catch(_){setStatus('Room code: '+z.topic)}}
  async function send(){var i=document.getElementById('zoomChatInput'),v=(i&&i.value||'').trim();if(!v||!z.chat)return;try{await z.chat.sendToAll(v.slice(0,1000));z.messages.push({name:z.name,text:v.slice(0,1000)});i.value='';chat()}catch(_){setStatus('Room chat is temporarily unavailable.')}}
  async function leave(show){
    try{if(z.client)await z.client.leave(!!show)}catch(_){}
    try{z.client&&z.client.destroy&&z.client.destroy()}catch(_){}
    z.client=null;z.stream=null;z.chat=null;z.command=null;z.joined=false;z.topic='';z.name='';z.host=false;z.videos={};z.messages=[];
    if(show){setStatus('You left the lounge room.');rerender()}
  }
  window.zoomRoomsCreate=function(){connect(code(),(document.getElementById('zoomCreateUser')?.value||'Host').trim()||'Host',1,(document.getElementById('zoomCreateName')?.value||'').trim()||'Lounge Watch Room')};
  window.zoomRoomsJoin=function(){var t=(document.getElementById('zoomJoinCode')?.value||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'');if(!t){setStatus('Enter the room code first.');rerender();return}connect(t,(document.getElementById('zoomJoinUser')?.value||'Guest').trim()||'Guest',0,'Lounge Watch Room')};
  window.zoomRoomsLeave=leave;window.zoomRoomsView=view;
  window.roomsView=view;window.createRoom=window.zoomRoomsCreate;window.joinRoom=window.zoomRoomsJoin;window.leaveRoom=window.zoomRoomsLeave;window.toggleRoomMedia=video;
  document.addEventListener('click',function(e){if(e.target.closest?.('[data-zcreate]'))return window.zoomRoomsCreate();if(e.target.closest?.('[data-zjoin]'))return window.zoomRoomsJoin();if(e.target.closest?.('[data-zcopy]'))return copy();if(e.target.closest?.('[data-zaudio]'))return audio();if(e.target.closest?.('[data-zvideo]'))return video();if(e.target.closest?.('[data-zshare]'))return share();if(e.target.closest?.('[data-zleave]'))return leave(true);if(e.target.closest?.('[data-zsend]'))return send()},{capture:true});
  var os=window.showPlayer;if(typeof os==='function'&&!os.__zoom){var ws=function(){var r=os.apply(this,arguments);tvChanged();return r};ws.__zoom=true;window.showPlayer=ws}
  var oc=window.closePlayer;if(typeof oc==='function'&&!oc.__zoom){var wc=function(){var r=oc.apply(this,arguments);tvChanged();return r};wc.__zoom=true;window.closePlayer=wc}
  style();if(typeof render==='function')render();
})();