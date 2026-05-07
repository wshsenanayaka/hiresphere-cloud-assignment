const PACKAGE_SERVICE_URL = import.meta.env.VITE_PACKAGE_SERVICE_URL || 'http://localhost:7500';
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
  if (!response.ok) throw new Error(data?.error || 'Package request failed');
  return data;
}

function isNetworkError(error) {
  return error instanceof TypeError || error.message === 'Failed to fetch';
}

async function requestWithFallback(path, options) {
  try {
    return await request(PACKAGE_SERVICE_URL, path, options);
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    return request(MAIN_API_URL, path, options);
  }
}

export const packageApi = {
  createPackage(payload) {
    return requestWithFallback('/packages', { method: 'POST', body: JSON.stringify(payload) });
  },
  getInterviewerPackages(interviewerId) {
    return requestWithFallback(`/packages/interviewer/${interviewerId}`);
  },
  getActivePackages(filters = {}) {
    const params = new URLSearchParams();
    if (filters.domain) params.set('domain', filters.domain);
    if (filters.interviewType) params.set('interviewType', filters.interviewType);
    const query = params.toString();
    return requestWithFallback(`/packages/active${query ? `?${query}` : ''}`);
  },
  getPackage(packageId) {
    return requestWithFallback(`/packages/${packageId}`);
  },
  updatePackage(packageId, payload) {
    return requestWithFallback(`/packages/${packageId}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  deletePackage(packageId, interviewerId) {
    return requestWithFallback(`/packages/${packageId}`, { method: 'DELETE', body: JSON.stringify({ interviewerId }) });
  },
  bookPackage(packageId, candidateId) {
    return requestWithFallback(`/packages/${packageId}/book`, { method: 'POST', body: JSON.stringify({ candidateId }) });
  },
  getCandidateBookings(candidateId) {
    return requestWithFallback(`/packages/candidate/${candidateId}/bookings`);
  },
  useSession(bookingId) {
    return requestWithFallback(`/packages/bookings/${bookingId}/use-session`, { method: 'PUT', body: JSON.stringify({}) });
  },
};
