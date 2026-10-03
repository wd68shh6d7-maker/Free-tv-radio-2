/* Rooms realtime transport + room controls.
   The lounge already loads Supabase in index.html and declares the room state variables/helpers.
   This file supplies the missing channel lifecycle and UI actions. */

function roomWireChannel(){
  if(!supabaseClient || !roomCode) {
    roomSetStatus('Rooms could not connect to the lounge service.', false);
    return false;
  }
  if(roomChannel) {
    try { supabaseClient.removeChannel(roomChannel); } catch(_) {}
    roomChannel = null;
  }

  const channelName = 'watch-room:' + roomCode;
  roomChannel = supabaseClient.channel(channelName, {
    config: {
      broadcast: { self: false },
      presence: { key: roomClientId }
    }
  });

  roomChannel
    .on('broadcast', { event: 'signal' }, ({ payload }) => roomSignal(payload))
    .on('broadcast', { event: 'room-state' }, ({ payload }) => {
      if(payload?.roomCode !== roomCode) return;
      if(roomRole !== 'host') roomApplyWatchState(payload);
    })
    .on('broadcast', { event: 'room-state-request' }, ({ payload }) => {
      if(payload?.roomCode !== roomCode || !roomIsHost()) return;
      roomBroadcastCurrentState();
    })
    .on('broadcast', { event: 'room-navigation' }, ({ payload }) => {
      if(payload?.roomCode !== roomCode || roomRole === 'host') return;
      const target = String(payload?.target || '');
      if(!target) return;
      roomApplyingRemote = true;
      try { setTab(target); } finally { roomApplyingRemote = false; }
    })
    .on('broadcast', { event: 'chat' }, ({ payload }) => {
      if(payload?.roomCode !== roomCode || payload?.from === roomClientId) return;
      roomMessages.push({name: payload.name || 'Guest', text: payload.text || ''});
      roomRenderChat();
    })
    .on('presence', { event: 'sync' }, () => roomHandlePresenceSync())
    .on('presence', { event: 'join' }, () => roomHandlePresenceSync())
    .on('presence', { event: 'leave' }, () => roomHandlePresenceSync());

  roomChannel.subscribe(async status => {
    if(status === 'SUBSCRIBED'){
      try {
        await roomChannel.track({
          clientId: roomClientId,
          name: roomDisplayName || 'Guest',
          role: roomRole || 'member',
          joinedAt: Date.now()
        });
      } catch(err) {
        console.error('Room presence track failed', err);
      }
      roomPeopleFromPresence();
      if(roomRole === 'host'){
        setTimeout(() => roomBroadcastCurrentState(), 120);
      } else {
        roomSend('room-state-request', {
          roomCode,
          from: roomClientId,
          requestedAt: Date.now()
        });
      }
      roomSetStatus('Room connected. TV watching is shared with everyone in this room.', true);
    } else if(status === 'CHANNEL_ERROR' || status === 'TIMED_OUT'){
      roomSetStatus('Room connection failed. Please try the room again.', false);
    }
  });
  return true;
}

async function createRoom(){
  const name = (document.getElementById('roomCreateName')?.value || '').trim();
  const display = (document.getElementById('roomDisplayName')?.value || '').trim() || 'Host';
  roomName = name || 'Watch Room';
  roomDisplayName = display;
  roomCode = makeRoomCode();
  roomJoinCode = roomCode;
  roomRole = 'host';
  roomJoined = true;
  roomMessages = [];
  roomWatchState = null;
  roomStatus = 'Connecting room…';

  if(!roomWireChannel()){
    roomJoined = false;
    return;
  }
  render();
  window.scrollTo({top:0,behavior:'smooth'});
}

async function joinRoom(){
  const code = (document.getElementById('roomJoinCode')?.value || roomJoinCode || '').trim().toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,12);
  const display = (document.getElementById('roomJoinName')?.value || '').trim() || 'Guest';
  if(!code){
    roomStatus = 'Enter the room code first.';
    render();
    return;
  }

  roomName = 'Watch Room';
  roomDisplayName = display;
  roomCode = code;
  roomJoinCode = code;
  roomRole = 'member';
  roomJoined = true;
  roomMessages = [];
  roomWatchState = null;
  roomStatus = 'Connecting room…';

  if(!roomWireChannel()){
    roomJoined = false;
    return;
  }
  render();
  window.scrollTo({top:0,behavior:'smooth'});
}

async function leaveRoom(showMessage){
  try {
    if(roomChannel) await roomChannel.untrack();
  } catch(_) {}
  try {
    if(roomChannel && supabaseClient) await supabaseClient.removeChannel(roomChannel);
  } catch(_) {}
  roomChannel = null;
  Object.values(roomPeers).forEach(pc => { try { pc.close(); } catch(_) {} });
  roomPeers = {};
  document.querySelectorAll('[data-room-peer]').forEach(el => el.remove());
  if(roomLocalStream){
    roomLocalStream.getTracks().forEach(t => { try { t.stop(); } catch(_) {} });
  }
  roomLocalStream = null;
  roomParticipants = {};
  roomMessages = [];
  roomJoined = false;
  roomRole = '';
  roomCode = '';
  roomJoinCode = '';
  roomName = '';
  roomDisplayName = '';
  roomWatchState = null;
  roomMicOn = false;
  roomCamOn = false;
  roomStatus = showMessage ? 'You left the room.' : '';
  setTab('rooms');
  if(showMessage) roomSetStatus(roomStatus, true);
}

async function toggleRoomMedia(kind){
  if(!roomLocalStream){
    const ok = await roomEnsureMedia();
    if(!ok) return;
  }
  const tracks = roomLocalStream.getTracks().filter(t => kind === 'mic' ? t.kind === 'audio' : t.kind === 'video');
  if(!tracks.length) return;
  const next = !tracks[0].enabled;
  tracks.forEach(t => t.enabled = next);
  if(kind === 'mic'){
    roomMicOn = next;
    const b = document.querySelector('[data-room-mic]');
    if(b) b.textContent = next ? '🎙️ Mute microphone' : '🎙️ Unmute microphone';
  } else {
    roomCamOn = next;
    const b = document.querySelector('[data-room-cam]');
    if(b) b.textContent = next ? '📷 Turn camera off' : '📷 Turn camera on';
  }
}

window.addEventListener('beforeunload', () => {
  try { roomChannel?.untrack(); } catch(_) {}
});
