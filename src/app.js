import { displayMessage, requestNotificationPermission, showNotification } from './ui.js';

// Запрашиваем разрешение на уведомления при загрузке
window.addEventListener('load', () => {
  requestNotificationPermission();
});

const configuration = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302' // Общедоступный STUN сервер Google
    }
  ]
};

let peerConnection = null;
let dataChannel = null;

const createOfferBtn = document.getElementById('create-offer-btn');
const processSignalBtn = document.getElementById('process-signal-btn');
const sendButton = document.getElementById('send-button');
const offerInput = document.getElementById('offer-input');
const offerOutput = document.getElementById('offer-output');
const messageInput = document.getElementById('message-input');


// --- Шаг 1: Один из пиров создает "предложение" ---
createOfferBtn.onclick = async () => {
  // Создаем соединение
  peerConnection = new RTCPeerConnection(configuration);
  
  // Создаем канал для передачи данных
  dataChannel = peerConnection.createDataChannel('chat');
  setupDataChannel();

  // Создаем "предложение" (offer)
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  // Ждем, пока соберутся все ICE-кандидаты
  peerConnection.onicecandidate = (event) => {
    if (event.candidate === null) {
      // Когда кандидаты собраны, показываем полное предложение
      offerOutput.value = JSON.stringify(peerConnection.localDescription);
    }
  };
  
  // Для второго пира - обработка входящего канала
  peerConnection.ondatachannel = (event) => {
    dataChannel = event.channel;
    setupDataChannel();
  };
};

// --- Шаг 2 и 3: Обработка "предложения" и "ответа" ---
processSignalBtn.onclick = async () => {
    const signal = JSON.parse(offerInput.value);

    // Если у нас еще нет peerConnection, значит мы - отвечающая сторона
    if (!peerConnection) {
        peerConnection = new RTCPeerConnection(configuration);
        peerConnection.ondatachannel = (event) => {
            dataChannel = event.channel;
            setupDataChannel();
        };
    }
    
    // Устанавливаем удаленное описание (это может быть offer или answer)
    await peerConnection.setRemoteDescription(new RTCSessionDescription(signal));

    // Если это было предложение (offer), создаем ответ (answer)
    if (signal.type === 'offer') {
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        peerConnection.onicecandidate = (event) => {
            if (event.candidate === null) {
                offerOutput.value = JSON.stringify(peerConnection.localDescription);
            }
        };
    }
};


// --- Отправка сообщения ---
sendButton.onclick = () => {
  const message = messageInput.value;
  if (message && dataChannel && dataChannel.readyState === 'open') {
    dataChannel.send(message);
    displayMessage(message, 'sent');
    messageInput.value = '';
  } else {
    console.log('Соединение не установлено или сообщение пустое.');
  }
};

/**
 * Настраивает обработчики для канала данных.
 */
function setupDataChannel() {
  dataChannel.onopen = () => {
    console.log('Канал данных открыт!');
    displayMessage('Соединение установлено!', 'received');
  };

  dataChannel.onmessage = (event) => {
    const receivedMessage = event.data;
    displayMessage(receivedMessage, 'received');
    showNotification(receivedMessage);
  };

  dataChannel.onclose = () => {
    console.log('Канал данных закрыт.');
  };
}
