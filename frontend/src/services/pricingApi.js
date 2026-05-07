const PRICING_SERVICE_URL = import.meta.env.VITE_INTERVIEWER_SERVICE_URL || 'http://localhost:7300';
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
    throw new Error(data?.error || 'Pricing request failed');
  }

  return data;
}

function isNetworkError(error) {
  return error instanceof TypeError || error.message === 'Failed to fetch';
}

async function serviceRequest(path, options) {
  return request(PRICING_SERVICE_URL, path, options);
}

async function fallbackRequest(path, options) {
  return request(MAIN_API_URL, path, options);
}

async function requestWithFallback(path, options) {
  try {
    return await serviceRequest(path, options);
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    return fallbackRequest(path, options);
  }
}

export const pricingApi = {
  createPricing(payload) {
    return requestWithFallback('/pricing', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  getInterviewerPricing(interviewerId) {
    return requestWithFallback(`/pricing/interviewer/${interviewerId}`);
  },
  getActiveInterviewerPricing(interviewerId) {
    return requestWithFallback(`/pricing/interviewer/${interviewerId}/active`);
  },
  updatePricing(pricingId, payload) {
    return requestWithFallback(`/pricing/${pricingId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  deletePricing(pricingId, interviewerId) {
    return requestWithFallback(`/pricing/${pricingId}`, {
      method: 'DELETE',
      body: JSON.stringify({ interviewerId }),
    });
  },
};
