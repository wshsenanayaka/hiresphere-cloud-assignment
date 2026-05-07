const EVALUATION_SERVICE_URL = import.meta.env.VITE_EVALUATION_SERVICE_URL || 'http://localhost:7600';
const MAIN_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function request(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || 'Evaluation request failed');
  return data;
}

function isNetworkError(error) {
  return error instanceof TypeError || error.message === 'Failed to fetch';
}

async function requestWithFallback(path, options) {
  try {
    return await request(EVALUATION_SERVICE_URL, path, options);
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    return request(MAIN_API_URL, path, options);
  }
}

export const evaluationApi = {
  createReport(payload) {
    return requestWithFallback('/evaluations', { method: 'POST', body: JSON.stringify(payload) });
  },
  getCandidateReports(candidateId) {
    return requestWithFallback(`/evaluations/candidate/${candidateId}`);
  },
  getInterviewerReports(interviewerId) {
    return requestWithFallback(`/evaluations/interviewer/${interviewerId}`);
  },
  getBookingReport(bookingId) {
    return requestWithFallback(`/evaluations/booking/${bookingId}`);
  },
  updateReport(evaluationId, payload) {
    return requestWithFallback(`/evaluations/${evaluationId}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
};
