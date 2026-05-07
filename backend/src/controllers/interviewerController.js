const pool = require('../config/db');

async function listInterviewers(req, res, next) {
  try {
    const [interviewers] = await pool.execute('SELECT * FROM interviewers ORDER BY rating DESC, name ASC');
    const [slots] = await pool.execute(
      `SELECT id, interviewer_id, DATE_FORMAT(start_time, '%Y-%m-%d %H:%i') AS startTime,
              DATE_FORMAT(end_time, '%Y-%m-%d %H:%i') AS endTime, status
       FROM availability_slots
       WHERE status = 'available'
       ORDER BY start_time ASC`,
    );

    res.json(
      interviewers.map((interviewer) => ({
        ...interviewer,
        slots: slots.filter((slot) => slot.interviewer_id === interviewer.id),
      })),
    );
  } catch (error) {
    next(error);
  }
}

async function searchInterviewers(req, res, next) {
  try {
    const { domain, type } = req.query;
    const conditions = [];
    const params = [];

    if (domain) {
      conditions.push('domain = ?');
      params.push(domain);
    }

    if (type) {
      conditions.push('interview_type = ?');
      params.push(type);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await pool.execute(`SELECT * FROM interviewers ${where} ORDER BY rating DESC`, params);

    res.json(rows);
  } catch (error) {
    next(error);
  }
}

async function createAvailabilitySlot(req, res, next) {
  try {
    const { interviewerId, startTime, endTime, status } = req.body;

    if (!interviewerId || !startTime || !endTime) {
      return res.status(400).json({ error: 'interviewerId, startTime, and endTime are required' });
    }

    const [result] = await pool.execute(
      `INSERT INTO availability_slots (interviewer_id, start_time, end_time, status)
       VALUES (?, ?, ?, ?)`,
      [interviewerId, startTime, endTime, status || 'available'],
    );

    res.status(201).json({ id: result.insertId, interviewerId, startTime, endTime, status: status || 'available' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createAvailabilitySlot,
  listInterviewers,
  searchInterviewers,
};
