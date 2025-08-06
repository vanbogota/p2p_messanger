/**
 * Displays the ID of the current user on the page.
 * @param {string} id 
 */
export function displayMyId(id) {
  const myIdElement = document.getElementById('my-id');
  if (myIdElement) {
    myIdElement.textContent += id;
  }
}

/**
 * Displays a message on the page.
 * @param {string} text - The message text.
 * @param {'sent' | 'received' | 'service'} type - The message type.
 */
export function displayMessage(text, type) {
  const messagesContainer = document.getElementById('messages');
  if (messagesContainer) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', type);
    messageElement.textContent = text;
    messagesContainer.appendChild(messageElement);
    // Scroll to the bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

/**
 * Requests permission to send notifications.
 */
export function requestNotificationPermission() {
  // alert('Requesting requestNotificationPermission...');
  // alert('Notification' in window);
  if ('Notification' in window) {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        // alert('Permission for notifications has been granted.');
        console.log('Permission for notifications has been granted.');
      } else {
        // alert('The user has denied permission for notifications.');
        console.log('The user has denied permission for notifications.');
      }
    });
  } else{
    console.log('Notification is not supported in this browser');
  }
}

/**
 * Shows a system notification.
 * @param {string} text 
 */
export function showNotification(text) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('New message', {
      body: text,
      icon: '/icons/icon-192.png'
    });
  }
}
