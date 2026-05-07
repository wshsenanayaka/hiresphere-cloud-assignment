const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 7000;
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://127.0.0.1:5173';

const io = new Server(server, {
  cors: {
    origin: clientOrigin,
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: clientOrigin }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'hiresphere-live-session-service' });
});

io.on('connection', (socket) => {
  socket.on('join-room', ({ roomId, userName }) => {
    if (!roomId) {
      socket.emit('live-error', { message: 'roomId is required' });
      return;
    }

    socket.data.roomId = roomId;
    socket.data.userName = userName || 'Guest';
    socket.join(roomId);

    const room = io.sockets.adapter.rooms.get(roomId);
    const participantCount = room?.size || 1;

    socket.emit('room-joined', { roomId, participantCount });
    socket.to(roomId).emit('user-joined', {
      socketId: socket.id,
      userName: socket.data.userName,
      participantCount,
    });
  });

  socket.on('offer', ({ roomId, offer }) => {
    socket.to(roomId).emit('offer', { offer, from: socket.id });
  });

  socket.on('answer', ({ roomId, answer }) => {
    socket.to(roomId).emit('answer', { answer, from: socket.id });
  });

  socket.on('ice-candidate', ({ roomId, candidate }) => {
    socket.to(roomId).emit('ice-candidate', { candidate, from: socket.id });
  });

  socket.on('disconnect', () => {
    const { roomId, userName } = socket.data;

    if (roomId) {
      socket.to(roomId).emit('user-left', {
        socketId: socket.id,
        userName: userName || 'Guest',
      });
    }
  });
});

server.listen(port, () => {
  console.log(`Live session service running on http://localhost:${port}`);
});
