const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 7500;
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://127.0.0.1:5173';

app.use(cors({ origin: clientOrigin }));
app.use(express.json());

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function ensureTables() {
  await pool.execute(`CREATE TABLE IF NOT EXISTS interview_packages (
    id INT AUTO_INCREMENT PRIMARY KEY, interviewer_id INT NOT NULL, package_name VARCHAR(160) NOT NULL,
    description TEXT, domain VARCHAR(80) NOT NULL, interview_type VARCHAR(80) NOT NULL,
    session_count INT NOT NULL, duration_minutes_per_session INT NOT NULL, total_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD', discount_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    is_active TINYINT(1) NOT NULL DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`);
  await pool.execute(`CREATE TABLE IF NOT EXISTS candidate_package_bookings (
    id INT AUTO_INCREMENT PRIMARY KEY, candidate_id INT NOT NULL, interviewer_id INT NOT NULL, package_id INT NOT NULL,
    total_sessions INT NOT NULL, used_sessions INT NOT NULL DEFAULT 0, remaining_sessions INT NOT NULL,
    payment_status ENUM('PENDING','PAID','FAILED','REFUNDED') NOT NULL DEFAULT 'PENDING',
    booking_status ENUM('ACTIVE','COMPLETED','CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`);
}

function normalizePackage(row) {
  return {
    id: row.id, interviewerId: row.interviewer_id, interviewerName: row.interviewer_name || '',
    packageName: row.package_name, description: row.description || '', domain: row.domain, interviewType: row.interview_type,
    sessionCount: row.session_count, durationMinutesPerSession: row.duration_minutes_per_session,
    totalPrice: Number(row.total_price), currency: row.currency, discountPercentage: Number(row.discount_percentage || 0),
    isActive: Boolean(row.is_active), createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

function normalizeBooking(row) {
  return {
    id: row.id, candidateId: row.candidate_id, interviewerId: row.interviewer_id, interviewerName: row.interviewer_name || '',
    packageId: row.package_id, packageName: row.package_name || '', totalSessions: row.total_sessions,
    usedSessions: row.used_sessions, remainingSessions: row.remaining_sessions, paymentStatus: row.payment_status,
    bookingStatus: row.booking_status, createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

function validatePackage(payload) {
  if (!payload.interviewerId) throw createHttpError(400, 'interviewer_id is required.');
  if (!payload.packageName?.trim()) throw createHttpError(400, 'package_name is required.');
  if (Number(payload.sessionCount) <= 1) throw createHttpError(400, 'session_count must be greater than 1.');
  if (Number(payload.durationMinutesPerSession) <= 0) throw createHttpError(400, 'duration_minutes_per_session must be greater than 0.');
  if (Number(payload.totalPrice) <= 0) throw createHttpError(400, 'total_price must be greater than 0.');
}

async function getPackage(packageId) {
  const [rows] = await pool.execute(`SELECT p.*, u.name AS interviewer_name FROM interview_packages p JOIN interviewers i ON i.id = p.interviewer_id JOIN users u ON u.id = i.user_id WHERE p.id = ?`, [packageId]);
  return rows[0] || null;
}

app.get('/health', (req, res) => res.json({ success: true, service: 'hiresphere-package-service' }));

app.post('/packages', async (req, res, next) => {
  try {
    await ensureTables();
    const payload = {
      interviewerId: req.body.interviewerId || req.body.interviewer_id,
      packageName: req.body.packageName || req.body.package_name,
      description: req.body.description || '',
      domain: req.body.domain,
      interviewType: req.body.interviewType || req.body.interview_type,
      sessionCount: req.body.sessionCount || req.body.session_count,
      durationMinutesPerSession: req.body.durationMinutesPerSession || req.body.duration_minutes_per_session,
      totalPrice: req.body.totalPrice || req.body.total_price,
      currency: req.body.currency || 'USD',
      discountPercentage: req.body.discountPercentage ?? req.body.discount_percentage ?? 0,
      isActive: req.body.isActive ?? req.body.is_active ?? true,
    };
    validatePackage(payload);
    const [result] = await pool.execute(
      `INSERT INTO interview_packages (interviewer_id, package_name, description, domain, interview_type, session_count, duration_minutes_per_session, total_price, currency, discount_percentage, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [payload.interviewerId, payload.packageName, payload.description, payload.domain, payload.interviewType, payload.sessionCount, payload.durationMinutesPerSession, payload.totalPrice, payload.currency, payload.discountPercentage, payload.isActive ? 1 : 0],
    );
    res.status(201).json({ success: true, message: 'Package created successfully.', package: normalizePackage(await getPackage(result.insertId)) });
  } catch (error) { next(error); }
});

app.get('/packages/interviewer/:interviewerId', async (req, res, next) => {
  try {
    await ensureTables();
    const [rows] = await pool.execute(`SELECT p.*, u.name AS interviewer_name FROM interview_packages p JOIN interviewers i ON i.id = p.interviewer_id JOIN users u ON u.id = i.user_id WHERE p.interviewer_id = ? ORDER BY p.is_active DESC, p.updated_at DESC`, [req.params.interviewerId]);
    res.json({ success: true, packages: rows.map(normalizePackage) });
  } catch (error) { next(error); }
});

app.get('/packages/active', async (req, res, next) => {
  try {
    await ensureTables();
    const params = [];
    const filters = ['p.is_active = 1'];
    if (req.query.domain) { filters.push('p.domain = ?'); params.push(req.query.domain); }
    if (req.query.interviewType) { filters.push('p.interview_type = ?'); params.push(req.query.interviewType); }
    const [rows] = await pool.execute(`SELECT p.*, u.name AS interviewer_name FROM interview_packages p JOIN interviewers i ON i.id = p.interviewer_id JOIN users u ON u.id = i.user_id WHERE ${filters.join(' AND ')} ORDER BY p.updated_at DESC`, params);
    res.json({ success: true, packages: rows.map(normalizePackage) });
  } catch (error) { next(error); }
});

app.get('/packages/:packageId', async (req, res, next) => {
  try {
    await ensureTables();
    const packageRow = await getPackage(req.params.packageId);
    if (!packageRow) throw createHttpError(404, 'Package not found.');
    res.json({ success: true, package: normalizePackage(packageRow) });
  } catch (error) { next(error); }
});

app.put('/packages/:packageId', async (req, res, next) => {
  try {
    await ensureTables();
    const packageRow = await getPackage(req.params.packageId);
    if (!packageRow) throw createHttpError(404, 'Package not found.');
    const interviewerId = req.body.interviewerId || req.body.interviewer_id;
    if (Number(interviewerId) !== Number(packageRow.interviewer_id)) throw createHttpError(403, 'Only the package owner interviewer can update this package.');
    await pool.execute(`UPDATE interview_packages SET package_name=?, description=?, domain=?, interview_type=?, session_count=?, duration_minutes_per_session=?, total_price=?, currency=?, discount_percentage=?, is_active=? WHERE id=?`, [
      req.body.packageName || req.body.package_name || packageRow.package_name,
      req.body.description ?? packageRow.description,
      req.body.domain || packageRow.domain,
      req.body.interviewType || req.body.interview_type || packageRow.interview_type,
      req.body.sessionCount || req.body.session_count || packageRow.session_count,
      req.body.durationMinutesPerSession || req.body.duration_minutes_per_session || packageRow.duration_minutes_per_session,
      req.body.totalPrice ?? req.body.total_price ?? packageRow.total_price,
      req.body.currency || packageRow.currency,
      req.body.discountPercentage ?? req.body.discount_percentage ?? packageRow.discount_percentage,
      (req.body.isActive ?? req.body.is_active ?? packageRow.is_active) ? 1 : 0,
      packageRow.id,
    ]);
    res.json({ success: true, message: 'Package updated successfully.', package: normalizePackage(await getPackage(packageRow.id)) });
  } catch (error) { next(error); }
});

app.delete('/packages/:packageId', async (req, res, next) => {
  try {
    await ensureTables();
    const packageRow = await getPackage(req.params.packageId);
    if (!packageRow) throw createHttpError(404, 'Package not found.');
    const interviewerId = req.body.interviewerId || req.query.interviewerId;
    if (Number(interviewerId) !== Number(packageRow.interviewer_id)) throw createHttpError(403, 'Only the package owner interviewer can delete this package.');
    await pool.execute('UPDATE interview_packages SET is_active = 0 WHERE id = ?', [packageRow.id]);
    res.json({ success: true, message: 'Package deactivated successfully.' });
  } catch (error) { next(error); }
});

app.post('/packages/:packageId/book', async (req, res, next) => {
  try {
    await ensureTables();
    const packageRow = await getPackage(req.params.packageId);
    if (!packageRow) throw createHttpError(404, 'Package not found.');
    if (!packageRow.is_active) throw createHttpError(409, 'Candidate can book only active packages.');
    const candidateId = req.body.candidateId || req.body.candidate_id;
    const [result] = await pool.execute(`INSERT INTO candidate_package_bookings (candidate_id, interviewer_id, package_id, total_sessions, used_sessions, remaining_sessions, payment_status, booking_status) VALUES (?, ?, ?, ?, 0, ?, 'PAID', 'ACTIVE')`, [candidateId, packageRow.interviewer_id, packageRow.id, packageRow.session_count, packageRow.session_count]);
    res.status(201).json({ success: true, message: 'Package booked successfully.', bookingId: result.insertId });
  } catch (error) { next(error); }
});

app.get('/packages/candidate/:candidateId/bookings', async (req, res, next) => {
  try {
    await ensureTables();
    const [rows] = await pool.execute(`SELECT b.*, p.package_name, u.name AS interviewer_name FROM candidate_package_bookings b JOIN interview_packages p ON p.id = b.package_id JOIN interviewers i ON i.id = b.interviewer_id JOIN users u ON u.id = i.user_id WHERE b.candidate_id = ? ORDER BY b.updated_at DESC`, [req.params.candidateId]);
    res.json({ success: true, bookings: rows.map(normalizeBooking) });
  } catch (error) { next(error); }
});

app.put('/packages/bookings/:bookingId/use-session', async (req, res, next) => {
  try {
    await ensureTables();
    const [rows] = await pool.execute('SELECT * FROM candidate_package_bookings WHERE id = ?', [req.params.bookingId]);
    const booking = rows[0];
    if (!booking) throw createHttpError(404, 'Package booking not found.');
    if (booking.remaining_sessions <= 0) throw createHttpError(409, 'No remaining sessions available.');
    const remaining = Number(booking.remaining_sessions) - 1;
    const used = Number(booking.used_sessions) + 1;
    const status = remaining === 0 ? 'COMPLETED' : booking.booking_status;
    await pool.execute('UPDATE candidate_package_bookings SET used_sessions=?, remaining_sessions=?, booking_status=? WHERE id=?', [used, remaining, status, booking.id]);
    res.json({ success: true, message: 'Package session used successfully.', remainingSessions: remaining, bookingStatus: status });
  } catch (error) { next(error); }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ success: false, error: err.message || 'Internal server error' });
});

app.listen(port, () => console.log(`Package service running on http://localhost:${port}`));
