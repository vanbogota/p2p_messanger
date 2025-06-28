const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 3001 });
let clients = new Map();

wss.on('connection', (ws) => {
  // Присваиваем уникальный ID каждому клиенту
  const id = Math.random().toString(36).substring(2, 9);
  console.log('New client connected:', id);
  clients.set(id, ws);

  // Отправляем клиенту его ID и список других участников
  ws.send(JSON.stringify({ type: 'init', id, peers: Array.from(clients.keys()).filter(pid => pid !== id) }));

  // Сообщаем остальным о новом участнике
  broadcast({ type: 'new-peer', id }, id);

  ws.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) {
      return;
    }
    // Пересылаем сигнал нужному участнику
    if (data.to && clients.has(data.to)) {
      clients.get(data.to).send(JSON.stringify({ ...data, from: id }));
    }
  });

  ws.on('close', () => {
    console.log("Client closed: ", id);
    clients.delete(id);
    broadcast({ type: 'peer-left', id }, id);
  });
});

function broadcast(msg, exceptId) {
  const str = JSON.stringify(msg);
  for (const [id, ws] of clients.entries()) {
    if (id !== exceptId) ws.send(str);
  }
}

console.log(`Signaling server started on ${wss.options.host}:${wss.options.port}`);