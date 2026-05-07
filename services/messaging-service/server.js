const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const pool = require('./db');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 7100;
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://127.0.0.1:5173';

const io = new Server(server, {
  cors: {
    origin: clientOrigin,
    methods: ['GET', 'POST', 'PUT'],
  },
});

app.use(cors({ origin: clientOrigin }));
app.use(express.json());

function normalizeMessage(row) {
  return {
    id: row.id,
    bookingId: row.booking_id,
    senderId: row.sender_id,
    receiverId: row.receiver_id,
    senderName: row.sender_name,
    receiverName: row.receiver_name,
    message: row.message,
    sentAt: row.created_at,
    isRead: Boolean(row.read_at),
    readAt: row.read_at,
  };
}

async function getBookingParticipants(bookingId) {
  const [rows] = await pool.execute(
    `SELECT b.id, b.candidate_id, i.user_id AS interviewer_user_id
     FROM bookings b
     JOIN interviewers i ON i.id = b.interviewer_id
     WHERE b.id = ?`,
    [bookingId],
  );

  return rows[0] || null;
}

function isBookingParticipant(participants, userId) {
  return (
    participants &&
    (Number(participants.candidate_id) === Number(userId) ||
      Number(participants.interviewer_user_id) === Number(userId))
  );
}

function getReceiverId(participants, senderId) {
  if (Number(participants.candidate_id) === Number(senderId)) {
    return participants.interviewer_user_id;
  }

  return participants.candidate_id;
}

async function requireBookingParticipant(bookingId, userId) {
  if (!bookingId || !userId) {
    const error = new Error('bookingId and userId are required');
    error.status = 400;
    throw error;
  }

  const participants = await getBookingParticipants(bookingId);

  if (!participants) {
    const error = new Error('Booking not found');
    error.status = 404;
    throw error;
  }

  if (!isBookingParticipant(participants, userId)) {
    const error = new Error('You are not allowed to access this booking chat');
    error.status = 403;
    throw error;
  }

  return participants;
}

async function listMessages(bookingId, userId) {
  await requireBookingParticipant(bookingId, userId);

  const [rows] = await pool.execute(
    `SELECT m.*, sender.name AS sender_name, receiver.name AS receiver_name, mr.read_at
     FROM messages m
     JOIN users sender ON sender.id = m.sender_id
     JOIN users receiver ON receiver.id = m.receiver_id
     LEFT JOIN message_reads mr
       ON mr.message_id = m.id
      AND mr.user_id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE ? END
     WHERE m.booking_id = ?
     ORDER BY m.created_at ASC`,
    [userId, userId, bookingId],
  );

  return rows.map(normalizeMessage);
}

async function createMessage({ bookingId, senderId, message }) {
  if (!bookingId || !senderId || !message?.trim()) {
    const error = new Error('bookingId, senderId, and message are required');
    error.status = 400;
    throw error;
  }

  const participants = await requireBookingParticipant(bookingId, senderId);
  const receiverId = getReceiverId(participants, senderId);

  const [result] = await pool.execute(
    `INSERT INTO messages (booking_id, sender_id, receiver_id, message)
     VALUES (?, ?, ?, ?)`,
    [bookingId, senderId, receiverId, message.trim()],
  );

  const [rows] = await pool.execute(
    `SELECT m.*, sender.name AS sender_name, receiver.name AS receiver_name, NULL AS read_at
     FROM messages m
     JOIN users sender ON sender.id = m.sender_id
     JOIN users receiver ON receiver.id = m.receiver_id
     WHERE m.id = ?`,
    [result.insertId],
  );

  return normalizeMessage(rows[0]);
}

async function markMessageRead(messageId, userId) {
  if (!messageId || !userId) {
    const error = new Error('messageId and userId are required');
    error.status = 400;
    throw error;
  }

  const [messages] = await pool.execute('SELECT * FROM messages WHERE id = ?', [messageId]);
  const message = messages[0];

  if (!message) {
    const error = new Error('Message not found');
    error.status = 404;
    throw error;
  }

  await requireBookingParticipant(message.booking_id, userId);

  await pool.execute(
    `INSERT INTO message_reads (message_id, user_id, read_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON DUPLICATE KEY UPDATE read_at = CURRENT_TIMESTAMP`,
    [messageId, userId],
  );

  return { messageId: Number(messageId), userId: Number(userId), bookingId: message.booking_id, isRead: true };
}

async function getUnreadCount(userId) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS unreadCount
     FROM messages m
     LEFT JOIN message_reads mr ON mr.message_id = m.id AND mr.user_id = ?
     WHERE m.receiver_id = ? AND mr.id IS NULL`,
    [userId, userId],
  );

  return Number(rows[0]?.unreadCount || 0);
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'hiresphere-messaging-service' });
});

app.get('/messages/unread-count/:userId', async (req, res, next) => {
  try {
    res.json({ userId: Number(req.params.userId), unreadCount: await getUnreadCount(req.params.userId) });
  } catch (error) {
    next(error);
  }
});

app.get('/messages/:bookingId', async (req, res, next) => {
  try {
    const messages = await listMessages(req.params.bookingId, req.query.userId);
    res.json(messages);
  } catch (error) {
    next(error);
  }
});

app.post('/messages', async (req, res, next) => {
  try {
    const message = await createMessage(req.body);
    io.to(String(message.bookingId)).emit('receive-message', message);
    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
});

app.put('/messages/:messageId/read', async (req, res, next) => {
  try {
    const read = await markMessageRead(req.params.messageId, req.body.userId);
    io.to(String(read.bookingId)).emit('message-read', read);
    res.json(read);
  } catch (error) {
    next(error);
  }
});

io.on('connection', (socket) => {
  socket.on('join-chat', async ({ bookingId, userId, userName }) => {
    try {
      await requireBookingParticipant(bookingId, userId);
      socket.data.bookingId = String(bookingId);
      socket.data.userId = Number(userId);
      socket.data.userName = userName || 'User';
      socket.join(String(bookingId));
      socket.emit('chat-joined', { bookingId, userId });
    } catch (error) {
      socket.emit('chat-error', { message: error.message });
    }
  });

  socket.on('send-message', async (payload) => {
    try {
      const message = await createMessage(payload);
      io.to(String(message.bookingId)).emit('receive-message', message);
    } catch (error) {
      socket.emit('chat-error', { message: error.message });
    }
  });

  socket.on('typing', ({ bookingId, userId, userName }) => {
    socket.to(String(bookingId)).emit('typing', { bookingId, userId, userName });
  });

  socket.on('stop-typing', ({ bookingId, userId }) => {
    socket.to(String(bookingId)).emit('stop-typing', { bookingId, userId });
  });

  socket.on('message-read', async ({ messageId, userId }) => {
    try {
      const read = await markMessageRead(messageId, userId);
      io.to(String(read.bookingId)).emit('message-read', read);
    } catch (error) {
      socket.emit('chat-error', { message: error.message });
    }
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

server.listen(port, () => {
  console.log(`Messaging service running on http://localhost:${port}`);
});
