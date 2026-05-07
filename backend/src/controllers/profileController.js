const pool = require('../config/db');

async function upsertProfile(req, res, next) {
  try {
    const { userId, fullName, phone, domain, experienceYears, bio, resumeUrl } = req.body;

    if (!userId || !fullName) {
      return res.status(400).json({ error: 'userId and fullName are required' });
    }

    const [result] = await pool.execute(
      `INSERT INTO profiles (user_id, full_name, phone, domain, experience_years, bio, resume_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         full_name = VALUES(full_name),
         phone = VALUES(phone),
         domain = VALUES(domain),
         experience_years = VALUES(experience_years),
         bio = VALUES(bio),
         resume_url = VALUES(resume_url)`,
      [userId, fullName, phone || null, domain || null, experienceYears || 0, bio || null, resumeUrl || null],
    );

    res.status(201).json({ id: result.insertId || userId, userId, fullName });
  } catch (error) {
    next(error);
  }
}

async function getProfile(req, res, next) {
  try {
    const [rows] = await pool.execute('SELECT * FROM profiles WHERE user_id = ?', [req.params.userId]);

    if (!rows.length) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProfile,
  upsertProfile,
};
