const pool = require('../config/db');
const { hashPassword, isHashedPassword, verifyPassword } = require('../utils/password');

async function ensureInterviewer(userId, name) {
  const [interviewers] = await pool.execute('SELECT id FROM interviewers WHERE user_id = ?', [userId]);
  const interviewerId = interviewers[0]?.id;

  if (interviewerId) {
    return interviewerId;
  }

  const [result] = await pool.execute(
    `INSERT INTO interviewers (user_id, name, domain, interview_type, skills, rating)
     VALUES (?, ?, 'Backend', 'System Design', 'Node.js, MySQL, REST APIs', 4.5)`,
    [userId, name],
  );

  return result.insertId;
}

async function loginOrSignup(req, res, next) {
  try {
    const { mode = 'login', name, email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: 'email, password, and role are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const [existingUsers] = await pool.execute('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
    let user = existingUsers[0];

    if (!user) {
      if (mode === 'login') {
        return res.status(404).json({ error: 'Account not found. Please sign up first.' });
      }

      const displayName = name?.trim() || normalizedEmail.split('@')[0];
      const passwordHash = await hashPassword(password);
      const [result] = await pool.execute(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [displayName, normalizedEmail, passwordHash, role],
      );

      user = {
        id: result.insertId,
        name: displayName,
        email: normalizedEmail,
        role,
      };
    } else if (user.role !== role) {
      return res.status(400).json({ error: `This email is registered as ${user.role}` });
    } else {
      const passwordMatches = await verifyPassword(password, user.password_hash);

      if (!passwordMatches) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      if (!isHashedPassword(user.password_hash)) {
        await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [await hashPassword(password), user.id]);
      }
    }

    const interviewerId = user.role === 'interviewer' ? await ensureInterviewer(user.id, user.name) : null;

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      profileType: user.role,
      interviewerId,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  loginOrSignup,
};
