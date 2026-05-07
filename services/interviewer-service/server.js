const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 7300;
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://127.0.0.1:5173';

const INTERVIEW_TYPES = ['DSA', 'System Design', 'Behavioral'];
const DOMAINS = ['Backend', 'Frontend', 'DevOps', 'AI/ML', 'Mobile'];

app.use(cors({ origin: clientOrigin }));
app.use(express.json());

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function normalizePricing(row) {
  return {
    id: row.id,
    interviewerId: row.interviewer_id,
    interviewType: row.interview_type,
    domain: row.domain,
    durationMinutes: row.duration_minutes,
    price: Number(row.price),
    currency: row.currency,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validatePricingPayload(payload, { partial = false } = {}) {
  const errors = [];

  if (!partial && !payload.interviewerId) errors.push('interviewer_id is required.');
  if (!partial && !payload.interviewType) errors.push('interview_type is required.');
  if (!partial && !payload.domain) errors.push('domain is required.');

  if (payload.interviewType && !INTERVIEW_TYPES.includes(payload.interviewType)) {
    errors.push('interview_type must be DSA, System Design, or Behavioral.');
  }

  if (payload.domain && !DOMAINS.includes(payload.domain)) {
    errors.push('domain must be Backend, Frontend, DevOps, AI/ML, or Mobile.');
  }

  if (!partial || payload.durationMinutes !== undefined) {
    if (Number(payload.durationMinutes) <= 0) errors.push('duration_minutes must be greater than 0.');
  }

  if (!partial || payload.price !== undefined) {
    if (Number(payload.price) <= 0) errors.push('price must be greater than 0.');
  }

  if (errors.length) {
    throw createHttpError(400, errors.join(' '));
  }
}

async function getPricingById(pricingId) {
  const [rows] = await pool.execute('SELECT * FROM interviewer_pricing WHERE id = ?', [pricingId]);
  return rows[0] || null;
}

async function assertNoDuplicateActive({ interviewerId, interviewType, domain, durationMinutes, excludePricingId = null }) {
  const params = [interviewerId, interviewType, domain, durationMinutes];
  let excludeClause = '';

  if (excludePricingId) {
    excludeClause = 'AND id <> ?';
    params.push(excludePricingId);
  }

  const [rows] = await pool.execute(
    `SELECT id FROM interviewer_pricing
     WHERE interviewer_id = ?
       AND interview_type = ?
       AND domain = ?
       AND duration_minutes = ?
       AND is_active = 1
       ${excludeClause}
     LIMIT 1`,
    params,
  );

  if (rows.length) {
    throw createHttpError(409, 'Active pricing already exists for this interviewer, interview type, domain, and duration.');
  }
}

function readInterviewerId(req) {
  return req.body.interviewerId || req.body.interviewer_id || req.query.interviewerId || req.query.interviewer_id;
}

app.get('/health', (req, res) => {
  res.json({ success: true, service: 'hiresphere-interviewer-service' });
});

app.post('/pricing', async (req, res, next) => {
  try {
    const payload = {
      interviewerId: req.body.interviewerId || req.body.interviewer_id,
      interviewType: req.body.interviewType || req.body.interview_type,
      domain: req.body.domain,
      durationMinutes: req.body.durationMinutes || req.body.duration_minutes,
      price: req.body.price,
      currency: req.body.currency || 'USD',
      isActive: req.body.isActive ?? req.body.is_active ?? true,
    };

    validatePricingPayload(payload);

    if (Boolean(payload.isActive)) {
      await assertNoDuplicateActive(payload);
    }

    const [result] = await pool.execute(
      `INSERT INTO interviewer_pricing
       (interviewer_id, interview_type, domain, duration_minutes, price, currency, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.interviewerId,
        payload.interviewType,
        payload.domain,
        Number(payload.durationMinutes),
        Number(payload.price),
        payload.currency,
        Boolean(payload.isActive) ? 1 : 0,
      ],
    );

    const pricing = await getPricingById(result.insertId);
    res.status(201).json({ success: true, message: 'Pricing created successfully.', pricing: normalizePricing(pricing) });
  } catch (error) {
    next(error);
  }
});

app.get('/pricing/interviewer/:interviewerId', async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM interviewer_pricing WHERE interviewer_id = ? ORDER BY is_active DESC, updated_at DESC',
      [req.params.interviewerId],
    );

    res.json({ success: true, pricing: rows.map(normalizePricing) });
  } catch (error) {
    next(error);
  }
});

app.get('/pricing/interviewer/:interviewerId/active', async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM interviewer_pricing
       WHERE interviewer_id = ? AND is_active = 1
       ORDER BY interview_type ASC, domain ASC, duration_minutes ASC`,
      [req.params.interviewerId],
    );

    res.json({ success: true, pricing: rows.map(normalizePricing) });
  } catch (error) {
    next(error);
  }
});

app.put('/pricing/:pricingId', async (req, res, next) => {
  try {
    const pricing = await getPricingById(req.params.pricingId);

    if (!pricing) {
      throw createHttpError(404, 'Pricing record not found.');
    }

    const requesterInterviewerId = readInterviewerId(req);

    if (!requesterInterviewerId) {
      throw createHttpError(400, 'interviewer_id is required.');
    }

    if (Number(requesterInterviewerId) !== Number(pricing.interviewer_id)) {
      throw createHttpError(403, 'Only the related interviewer can update pricing.');
    }

    const payload = {
      interviewType: req.body.interviewType || req.body.interview_type || pricing.interview_type,
      domain: req.body.domain || pricing.domain,
      durationMinutes: req.body.durationMinutes || req.body.duration_minutes || pricing.duration_minutes,
      price: req.body.price ?? pricing.price,
      currency: req.body.currency || pricing.currency || 'USD',
      isActive: req.body.isActive ?? req.body.is_active ?? Boolean(pricing.is_active),
    };

    validatePricingPayload(payload, { partial: true });

    if (Boolean(payload.isActive)) {
      await assertNoDuplicateActive({
        interviewerId: pricing.interviewer_id,
        interviewType: payload.interviewType,
        domain: payload.domain,
        durationMinutes: payload.durationMinutes,
        excludePricingId: pricing.id,
      });
    }

    await pool.execute(
      `UPDATE interviewer_pricing
       SET interview_type = ?, domain = ?, duration_minutes = ?, price = ?, currency = ?, is_active = ?
       WHERE id = ?`,
      [
        payload.interviewType,
        payload.domain,
        Number(payload.durationMinutes),
        Number(payload.price),
        payload.currency,
        Boolean(payload.isActive) ? 1 : 0,
        pricing.id,
      ],
    );

    const updatedPricing = await getPricingById(pricing.id);
    res.json({ success: true, message: 'Pricing updated successfully.', pricing: normalizePricing(updatedPricing) });
  } catch (error) {
    next(error);
  }
});

app.delete('/pricing/:pricingId', async (req, res, next) => {
  try {
    const pricing = await getPricingById(req.params.pricingId);

    if (!pricing) {
      throw createHttpError(404, 'Pricing record not found.');
    }

    const requesterInterviewerId = readInterviewerId(req);

    if (!requesterInterviewerId) {
      throw createHttpError(400, 'interviewer_id is required.');
    }

    if (Number(requesterInterviewerId) !== Number(pricing.interviewer_id)) {
      throw createHttpError(403, 'Only the related interviewer can delete pricing.');
    }

    await pool.execute('UPDATE interviewer_pricing SET is_active = 0 WHERE id = ?', [pricing.id]);
    res.json({ success: true, message: 'Pricing deactivated successfully.' });
  } catch (error) {
    next(error);
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

app.listen(port, () => {
  console.log(`Interviewer service running on http://localhost:${port}`);
});
