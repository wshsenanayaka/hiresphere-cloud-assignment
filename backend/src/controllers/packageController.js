const pool = require('../config/db');

const PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];
const BOOKING_STATUSES = ['ACTIVE', 'COMPLETED', 'CANCELLED'];

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function ensurePackageTables() {
  await pool.execute(
    `CREATE TABLE IF NOT EXISTS interview_packages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      interviewer_id INT NOT NULL,
      package_name VARCHAR(160) NOT NULL,
      description TEXT,
      domain VARCHAR(80) NOT NULL,
      interview_type VARCHAR(80) NOT NULL,
      session_count INT NOT NULL,
      duration_minutes_per_session INT NOT NULL,
      total_price DECIMAL(10,2) NOT NULL,
      currency VARCHAR(3) NOT NULL DEFAULT 'USD',
      discount_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_interview_packages_interviewer
        FOREIGN KEY (interviewer_id) REFERENCES interviewers(id) ON DELETE CASCADE
    )`,
  );

  await pool.execute(
    `CREATE TABLE IF NOT EXISTS candidate_package_bookings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      candidate_id INT NOT NULL,
      interviewer_id INT NOT NULL,
      package_id INT NOT NULL,
      total_sessions INT NOT NULL,
      used_sessions INT NOT NULL DEFAULT 0,
      remaining_sessions INT NOT NULL,
      payment_status ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
      booking_status ENUM('ACTIVE', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_candidate_package_candidate FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_candidate_package_interviewer FOREIGN KEY (interviewer_id) REFERENCES interviewers(id) ON DELETE CASCADE,
      CONSTRAINT fk_candidate_package_package FOREIGN KEY (package_id) REFERENCES interview_packages(id) ON DELETE CASCADE
    )`,
  );
}

function normalizePackage(row) {
  return {
    id: row.id,
    interviewerId: row.interviewer_id,
    interviewerName: row.interviewer_name || '',
    packageName: row.package_name,
    description: row.description || '',
    domain: row.domain,
    interviewType: row.interview_type,
    sessionCount: row.session_count,
    durationMinutesPerSession: row.duration_minutes_per_session,
    totalPrice: Number(row.total_price),
    currency: row.currency,
    discountPercentage: Number(row.discount_percentage || 0),
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeBooking(row) {
  return {
    id: row.id,
    candidateId: row.candidate_id,
    interviewerId: row.interviewer_id,
    interviewerName: row.interviewer_name || '',
    packageId: row.package_id,
    packageName: row.package_name || '',
    totalSessions: row.total_sessions,
    usedSessions: row.used_sessions,
    remainingSessions: row.remaining_sessions,
    paymentStatus: row.payment_status,
    bookingStatus: row.booking_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validatePackagePayload(payload, { partial = false } = {}) {
  const errors = [];
  if (!partial && !payload.interviewerId) errors.push('interviewer_id is required.');
  if (!partial && !payload.packageName?.trim()) errors.push('package_name is required.');
  if (!partial && !payload.domain?.trim()) errors.push('domain is required.');
  if (!partial && !payload.interviewType?.trim()) errors.push('interview_type is required.');
  if (!partial || payload.sessionCount !== undefined) {
    if (Number(payload.sessionCount) <= 1) errors.push('session_count must be greater than 1.');
  }
  if (!partial || payload.durationMinutesPerSession !== undefined) {
    if (Number(payload.durationMinutesPerSession) <= 0) errors.push('duration_minutes_per_session must be greater than 0.');
  }
  if (!partial || payload.totalPrice !== undefined) {
    if (Number(payload.totalPrice) <= 0) errors.push('total_price must be greater than 0.');
  }
  if (errors.length) throw createHttpError(400, errors.join(' '));
}

async function getPackageById(packageId) {
  await ensurePackageTables();
  const [rows] = await pool.execute(
    `SELECT p.*, u.name AS interviewer_name
     FROM interview_packages p
     JOIN interviewers i ON i.id = p.interviewer_id
     JOIN users u ON u.id = i.user_id
     WHERE p.id = ?`,
    [packageId],
  );
  return rows[0] || null;
}

async function createPackage(req, res, next) {
  try {
    await ensurePackageTables();
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
    validatePackagePayload(payload);
    const [result] = await pool.execute(
      `INSERT INTO interview_packages
       (interviewer_id, package_name, description, domain, interview_type, session_count,
        duration_minutes_per_session, total_price, currency, discount_percentage, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.interviewerId,
        payload.packageName.trim(),
        payload.description,
        payload.domain,
        payload.interviewType,
        Number(payload.sessionCount),
        Number(payload.durationMinutesPerSession),
        Number(payload.totalPrice),
        payload.currency,
        Number(payload.discountPercentage || 0),
        Boolean(payload.isActive) ? 1 : 0,
      ],
    );
    const createdPackage = await getPackageById(result.insertId);
    res.status(201).json({ success: true, message: 'Package created successfully.', package: normalizePackage(createdPackage) });
  } catch (error) {
    next(error);
  }
}

async function listInterviewerPackages(req, res, next) {
  try {
    await ensurePackageTables();
    const [rows] = await pool.execute(
      `SELECT p.*, u.name AS interviewer_name
       FROM interview_packages p
       JOIN interviewers i ON i.id = p.interviewer_id
       JOIN users u ON u.id = i.user_id
       WHERE p.interviewer_id = ?
       ORDER BY p.is_active DESC, p.updated_at DESC`,
      [req.params.interviewerId],
    );
    res.json({ success: true, packages: rows.map(normalizePackage) });
  } catch (error) {
    next(error);
  }
}

async function listActivePackages(req, res, next) {
  try {
    await ensurePackageTables();
    const params = [];
    const filters = ['p.is_active = 1'];
    if (req.query.domain) {
      filters.push('p.domain = ?');
      params.push(req.query.domain);
    }
    if (req.query.interviewType) {
      filters.push('p.interview_type = ?');
      params.push(req.query.interviewType);
    }
    const [rows] = await pool.execute(
      `SELECT p.*, u.name AS interviewer_name
       FROM interview_packages p
       JOIN interviewers i ON i.id = p.interviewer_id
       JOIN users u ON u.id = i.user_id
       WHERE ${filters.join(' AND ')}
       ORDER BY p.updated_at DESC`,
      params,
    );
    res.json({ success: true, packages: rows.map(normalizePackage) });
  } catch (error) {
    next(error);
  }
}

async function getPackage(req, res, next) {
  try {
    const packageRow = await getPackageById(req.params.packageId);
    if (!packageRow) throw createHttpError(404, 'Package not found.');
    res.json({ success: true, package: normalizePackage(packageRow) });
  } catch (error) {
    next(error);
  }
}

async function updatePackage(req, res, next) {
  try {
    const packageRow = await getPackageById(req.params.packageId);
    if (!packageRow) throw createHttpError(404, 'Package not found.');
    const requesterInterviewerId = req.body.interviewerId || req.body.interviewer_id;
    if (Number(requesterInterviewerId) !== Number(packageRow.interviewer_id)) {
      throw createHttpError(403, 'Only the package owner interviewer can update this package.');
    }
    const payload = {
      packageName: req.body.packageName || req.body.package_name || packageRow.package_name,
      description: req.body.description ?? packageRow.description,
      domain: req.body.domain || packageRow.domain,
      interviewType: req.body.interviewType || req.body.interview_type || packageRow.interview_type,
      sessionCount: req.body.sessionCount || req.body.session_count || packageRow.session_count,
      durationMinutesPerSession: req.body.durationMinutesPerSession || req.body.duration_minutes_per_session || packageRow.duration_minutes_per_session,
      totalPrice: req.body.totalPrice ?? req.body.total_price ?? packageRow.total_price,
      currency: req.body.currency || packageRow.currency || 'USD',
      discountPercentage: req.body.discountPercentage ?? req.body.discount_percentage ?? packageRow.discount_percentage ?? 0,
      isActive: req.body.isActive ?? req.body.is_active ?? Boolean(packageRow.is_active),
    };
    validatePackagePayload(payload, { partial: true });
    await pool.execute(
      `UPDATE interview_packages
       SET package_name = ?, description = ?, domain = ?, interview_type = ?, session_count = ?,
           duration_minutes_per_session = ?, total_price = ?, currency = ?, discount_percentage = ?, is_active = ?
       WHERE id = ?`,
      [
        payload.packageName.trim(),
        payload.description,
        payload.domain,
        payload.interviewType,
        Number(payload.sessionCount),
        Number(payload.durationMinutesPerSession),
        Number(payload.totalPrice),
        payload.currency,
        Number(payload.discountPercentage || 0),
        Boolean(payload.isActive) ? 1 : 0,
        packageRow.id,
      ],
    );
    const updatedPackage = await getPackageById(packageRow.id);
    res.json({ success: true, message: 'Package updated successfully.', package: normalizePackage(updatedPackage) });
  } catch (error) {
    next(error);
  }
}

async function deletePackage(req, res, next) {
  try {
    const packageRow = await getPackageById(req.params.packageId);
    if (!packageRow) throw createHttpError(404, 'Package not found.');
    const requesterInterviewerId = req.body.interviewerId || req.query.interviewerId;
    if (Number(requesterInterviewerId) !== Number(packageRow.interviewer_id)) {
      throw createHttpError(403, 'Only the package owner interviewer can delete this package.');
    }
    await pool.execute('UPDATE interview_packages SET is_active = 0 WHERE id = ?', [packageRow.id]);
    res.json({ success: true, message: 'Package deactivated successfully.' });
  } catch (error) {
    next(error);
  }
}

async function bookPackage(req, res, next) {
  try {
    const packageRow = await getPackageById(req.params.packageId);
    if (!packageRow) throw createHttpError(404, 'Package not found.');
    if (!packageRow.is_active) throw createHttpError(409, 'Candidate can book only active packages.');
    const candidateId = req.body.candidateId || req.body.candidate_id;
    if (!candidateId) throw createHttpError(400, 'candidate_id is required.');
    const [result] = await pool.execute(
      `INSERT INTO candidate_package_bookings
       (candidate_id, interviewer_id, package_id, total_sessions, used_sessions, remaining_sessions, payment_status, booking_status)
       VALUES (?, ?, ?, ?, 0, ?, 'PAID', 'ACTIVE')`,
      [candidateId, packageRow.interviewer_id, packageRow.id, packageRow.session_count, packageRow.session_count],
    );
    const [rows] = await pool.execute(
      `SELECT b.*, p.package_name, u.name AS interviewer_name
       FROM candidate_package_bookings b
       JOIN interview_packages p ON p.id = b.package_id
       JOIN interviewers i ON i.id = b.interviewer_id
       JOIN users u ON u.id = i.user_id
       WHERE b.id = ?`,
      [result.insertId],
    );
    res.status(201).json({ success: true, message: 'Package booked successfully.', booking: normalizeBooking(rows[0]) });
  } catch (error) {
    next(error);
  }
}

async function listCandidatePackageBookings(req, res, next) {
  try {
    await ensurePackageTables();
    const [rows] = await pool.execute(
      `SELECT b.*, p.package_name, u.name AS interviewer_name
       FROM candidate_package_bookings b
       JOIN interview_packages p ON p.id = b.package_id
       JOIN interviewers i ON i.id = b.interviewer_id
       JOIN users u ON u.id = i.user_id
       WHERE b.candidate_id = ?
       ORDER BY b.updated_at DESC`,
      [req.params.candidateId],
    );
    res.json({ success: true, bookings: rows.map(normalizeBooking) });
  } catch (error) {
    next(error);
  }
}

async function usePackageSession(req, res, next) {
  try {
    await ensurePackageTables();
    const [rows] = await pool.execute('SELECT * FROM candidate_package_bookings WHERE id = ?', [req.params.bookingId]);
    const booking = rows[0];
    if (!booking) throw createHttpError(404, 'Package booking not found.');
    if (booking.remaining_sessions <= 0) throw createHttpError(409, 'No remaining sessions available.');
    const remainingSessions = Number(booking.remaining_sessions) - 1;
    const usedSessions = Number(booking.used_sessions) + 1;
    const bookingStatus = remainingSessions === 0 ? 'COMPLETED' : booking.booking_status;
    await pool.execute(
      `UPDATE candidate_package_bookings
       SET used_sessions = ?, remaining_sessions = ?, booking_status = ?
       WHERE id = ?`,
      [usedSessions, remainingSessions, bookingStatus, booking.id],
    );
    res.json({ success: true, message: 'Package session used successfully.', remainingSessions, bookingStatus });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createPackage,
  listInterviewerPackages,
  listActivePackages,
  getPackage,
  updatePackage,
  deletePackage,
  bookPackage,
  listCandidatePackageBookings,
  usePackageSession,
};
