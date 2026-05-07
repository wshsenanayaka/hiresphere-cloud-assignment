const BOOKING_SERVICE_URL = import.meta.env.VITE_BOOKING_SERVICE_URL || 'http://localhost:7200';
const MAIN_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function request(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || 'Booking request failed');
  }

  return data;
}

function isNetworkError(error) {
  return error instanceof TypeError || error.message === 'Failed to fetch';
}

function splitDateTime(value) {
  const normalizedValue = String(value || '');
  const [date = '', time = ''] = normalizedValue.split(/[T ]/);

  return {
    scheduledDate: date,
    scheduledTime: time.slice(0, 8),
  };
}

function normalizeMainBooking(row) {
  const { scheduledDate, scheduledTime } = splitDateTime(row.booking_date || row.date);

  return {
    id: row.id,
    candidateId: row.candidate_id,
    candidateName: row.candidate_name || row.candidate,
    interviewerId: row.interviewer_id,
    interviewerName: row.interviewer_name || row.interviewer,
    scheduledDate,
    scheduledTime,
    interviewType: row.interview_type || row.challenge || row.domain || 'Interview session',
    domain: row.domain || row.challenge || 'General',
    price: Number(row.price || 45),
    status: String(row.status || '').toLowerCase() === 'booked' ? 'PENDING' : row.status,
    rejectionReason: row.rejection_reason || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isPendingBooking(booking) {
  const status = String(booking.status || '').toLowerCase();
  return status === 'pending' || status === 'booked';
}

async function serviceRequest(path, options) {
  return request(BOOKING_SERVICE_URL, path, options);
}

async function mainRequest(path, options) {
  return request(MAIN_API_URL, path, options);
}

export const bookingApi = {
  async getPendingInterviewerBookings(interviewerId) {
    try {
      return await serviceRequest(`/bookings/interviewer/${interviewerId}/pending`);
    } catch (error) {
      if (!isNetworkError(error)) throw error;

      const rows = await mainRequest(`/bookings/interviewer/${interviewerId}`);
      const bookings = rows.map(normalizeMainBooking).filter(isPendingBooking);
      return { success: true, bookings };
    }
  },
  async getInterviewerBookings(interviewerId) {
    try {
      return await serviceRequest(`/bookings/interviewer/${interviewerId}`);
    } catch (error) {
      if (!isNetworkError(error)) throw error;

      const rows = await mainRequest(`/bookings/interviewer/${interviewerId}`);
      return { success: true, bookings: rows.map(normalizeMainBooking) };
    }
  },
  async getCandidateBookings(candidateId) {
    try {
      return await serviceRequest(`/bookings/candidate/${candidateId}`);
    } catch (error) {
      if (!isNetworkError(error)) throw error;

      const rows = await mainRequest(`/bookings/candidate/${candidateId}`);
      return { success: true, bookings: rows.map(normalizeMainBooking) };
    }
  },
  async acceptBooking(bookingId, interviewerId) {
    try {
      return await serviceRequest(`/bookings/${bookingId}/accept`, {
        method: 'PUT',
        body: JSON.stringify({ interviewerId }),
      });
    } catch (error) {
      if (!isNetworkError(error)) throw error;

      const booking = await mainRequest(`/bookings/${bookingId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'ACCEPTED' }),
      });
      return { success: true, message: 'Booking accepted successfully.', booking };
    }
  },
  async rejectBooking(bookingId, interviewerId, rejectionReason) {
    try {
      return await serviceRequest(`/bookings/${bookingId}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ interviewerId, rejectionReason }),
      });
    } catch (error) {
      if (!isNetworkError(error)) throw error;

      const booking = await mainRequest(`/bookings/${bookingId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'REJECTED', rejectionReason }),
      });
      return { success: true, message: 'Booking rejected successfully.', booking };
    }
  },
};
