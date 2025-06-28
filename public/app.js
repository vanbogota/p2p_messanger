import { 
  displayMessage, 
  displayMyId,
  requestNotificationPermission, 
  showNotification } from './ui.js';

// === Настройки ===
const url = window.SIGNALING_SERVER_URL;
const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
};

// === Глобальные переменные ===
let myId = null;
let peers = {}; // id -> { pc, dc }

// === UI ===
requestNotificationPermission();
const sendButton = document.getElementById('send-button');
const messageInput = document.getElementById('message-input');

// === WebSocket-соединение с signaling-сервером ===
const ws = new WebSocket(url);

ws.onmessage = async (event) => {
  const msg = JSON.parse(event.data);
  console.log(msg.type);
  if (msg.type === 'init') {
    myId = msg.id;
    displayMyId(myId);
    // Подключаемся ко всем существующим пирами
    for (const peerId of msg.peers) {
      await connectToPeer(peerId);
    }
  } else if (msg.type === 'new-peer') {
    // Новый участник — инициируем соединение
    await connectToPeer(msg.id);
  } else if (msg.type === 'peer-left') {
    // Удаляем пира
    if (peers[msg.id]) {
      if (peers[msg.id].dc) peers[msg.id].dc.close();
      if (peers[msg.id].pc) peers[msg.id].pc.close();
      delete peers[msg.id];
      displayMessage(`User ${msg.id} left the chat`, 'received');
    }
  } else if (msg.type === 'offer' || msg.type === 'answer' || msg.type === 'ice') {
    await handleSignal(msg);
  }
};

// === Отправка сообщения всем ===
sendButton.onclick = () => {
  const input = messageInput.value; 
  if (!input) return;

  const text = `Get the book you need, delivered to your home for your half hour of scanning the book needed from a library near you: ${input}.\n 
  Video instructions:\n
  - https://bit.ly/oeBookLamp,\n
  - https://bit.ly/oeBookVideo4Library;\n
  Download DocScan app:\n
  - For Android https://play.google.com/store/apps/details;\n
  - For iPhone https://apps.apple.com/us/app/doc-scan-pdf-scanner/id453312964`;

  for (const peerId in peers) {
    const dc = peers[peerId].dc;
    if (dc && dc.readyState === 'open') {
      dc.send(text);
    }
  }
  displayMessage(text, 'sent');
  messageInput.value = '';
};

// === Работа с WebRTC ===
async function connectToPeer(peerId) {
  // console.log("connectToPeer - User Id: ", myId);
  // console.log("connectToPeer: ",peerId);
  // console.log(peers);
  if (peers[peerId]) {
    // console.log("connectToPeer returned: ", peers[peerId]);
    return;
  } // уже соединены
  const pc = new RTCPeerConnection(configuration);
  let dc;
  peers[peerId] = { pc, dc: null };

  // Определяем, кто инициатор: peer с меньшим id инициирует соединение
  const isInitiator = myId < peerId;

  if (isInitiator) {
    dc = pc.createDataChannel('chat');
    setupDataChannel(dc, peerId);
  } else {
    pc.ondatachannel = (event) => {
      dc = event.channel;
      setupDataChannel(dc, peerId);
    };
  }

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      ws.send(JSON.stringify({ type: 'ice', to: peerId, candidate: event.candidate }));
    }
  };


  if (isInitiator) {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    ws.send(JSON.stringify({ type: 'offer', to: peerId, sdp: offer }));
  }

  pc.onconnectionstatechange = () => {
    if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
      if (peers[peerId]) {
        if (peers[peerId].dc) peers[peerId].dc.close();
        pc.close();
        delete peers[peerId];
        displayMessage(`User ${peerId} disconnected`, 'received');
      }
    }
  };
}

async function handleSignal(msg) {
  const peerId = msg.from;
  // console.log("handleSignal: ", peerId);
  // console.log("handleSignal, peers:");
  // console.log(peers);
  let pc = peers[peerId] && peers[peerId].pc;
  if (!pc) {
    console.log("handleSignal: pc - false");
    await connectToPeer(peerId);
    pc = peers[peerId].pc;
  }
  if (msg.type === 'offer') {
    if (pc.signalingState === 'stable') {
      await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      ws.send(JSON.stringify({ type: 'answer', to: peerId, sdp: answer }));
    } else {
      // Игнорируем offer, если не в stable
    }
  } else if (msg.type === 'answer') {
    if (pc.signalingState === 'have-local-offer') {
      await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
    } else {
      // Игнорируем лишний answer
    }
  } else if (msg.type === 'ice') {
    try {
      await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
    } catch (e) {
      console.error("ice: ", e);
    }
  }
}

function setupDataChannel(dc, peerId) {
  // console.log("Calling setupDataChannel for: ", peerId);
  peers[peerId].dc = dc;
  dc.onopen = () => {
    displayMessage(`User ${peerId} connected!`, 'received');
  };
  dc.onmessage = (event) => {
    displayMessage(event.data, 'received');
    showNotification(event.data);
  };
  dc.onclose = () => {
    console.log(`Channel with ${peerId} closed`, 'received');
  };
} 