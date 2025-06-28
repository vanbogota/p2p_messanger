// Функции для взаимодействия с DOM

/**
 * Отображает ID текущего пользователя на странице.
 * @param {string} id 
 */
export function displayMyId(id) {
  const myIdElement = document.getElementById('my-id');
  if (myIdElement) {
    myIdElement.textContent = id;
  }
}

/**
 * Отображает сообщение на странице.
 * @param {string} text - Текст сообщения.
 * @param {'sent' | 'received'} type - Тип сообщения.
 */
export function displayMessage(text, type) {
  const messagesContainer = document.getElementById('messages');
  if (messagesContainer) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', type);
    messageElement.textContent = text;
    messagesContainer.appendChild(messageElement);
    // Прокручиваем вниз
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

/**
 * Запрашивает разрешение на отправку уведомлений.
 */
export function requestNotificationPermission() {
  // alert('Requesting requestNotificationPermission...');
  // alert('Notification' in window);
  if ('Notification' in window) {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        alert('Permission for notifications has been granted.');
        console.log('Permission for notifications has been granted.');
      } else {
        alert('The user has denied permission for notifications.');
        console.log('The user has denied permission for notifications.');
      }
    });
  } else{
    console.log('Notification is not supported in this browser');
  }
}

/**
 * Показывает системное уведомление.
 * @param {string} text 
 */
export function showNotification(text) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('New massage', {
      body: text,
      icon: '/icons/icon-192.png'
    });
  }
}
