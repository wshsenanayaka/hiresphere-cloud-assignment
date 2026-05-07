const pool = require('../config/db');

async function createMessage(req, res, next) {
  try {
    const { bookingId, senderId, receiverId, message } = req.body;

    if (!bookingId || !senderId || !receiverId || !message) {
      return res.status(400).json({ error: 'bookingId, senderId, receiverId, and message are required' });
    }

    const [result] = await pool.execute(
      `INSERT INTO messages (booking_id, sender_id, receiver_id, message)
       VALUES (?, ?, ?, ?)`,
      [bookingId, senderId, receiverId, message],
    );

    res.status(201).json({ id: result.insertId, bookingId, senderId, receiverId, message });
  } catch (error) {
    next(error);
  }
}

async function listBookingMessages(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT m.*, sender.name AS sender_name, receiver.name AS receiver_name
       FROM messages m
       JOIN users sender ON sender.id = m.sender_id
       JOIN users receiver ON receiver.id = m.receiver_id
       WHERE m.booking_id = ?
       ORDER BY m.created_at ASC`,
      [req.params.bookingId],
    );

    res.json(rows);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createMessage,
  listBookingMessages,
};
