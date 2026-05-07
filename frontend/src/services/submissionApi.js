const SUBMISSION_SERVICE_URL = import.meta.env.VITE_SUBMISSION_SERVICE_URL || 'http://localhost:7400';
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
    throw new Error(data?.error || 'Submission request failed');
  }

  return data;
}

function isNetworkError(error) {
  return error instanceof TypeError || error.message === 'Failed to fetch';
}

async function requestWithFallback(path, options) {
  try {
    return await request(SUBMISSION_SERVICE_URL, path, options);
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    return request(MAIN_API_URL, path, options);
  }
}

export const submissionApi = {
  getInterviewerSubmissions(interviewerId) {
    return requestWithFallback(`/submissions/interviewer/${interviewerId}`);
  },
  getCandidateSubmissions(candidateId) {
    return requestWithFallback(`/submissions/candidate/${candidateId}`);
  },
  getSubmission(submissionId) {
    return requestWithFallback(`/submissions/${submissionId}`);
  },
  updateStatus(submissionId, payload) {
    return requestWithFallback(`/submissions/${submissionId}/status`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  createAnnotation(submissionId, payload) {
    return requestWithFallback(`/submissions/${submissionId}/annotations`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  getAnnotations(submissionId) {
    return requestWithFallback(`/submissions/${submissionId}/annotations`);
  },
  updateAnnotation(annotationId, payload) {
    return requestWithFallback(`/annotations/${annotationId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  deleteAnnotation(annotationId, interviewerId) {
    return requestWithFallback(`/annotations/${annotationId}`, {
      method: 'DELETE',
      body: JSON.stringify({ interviewerId }),
    });
  },
};
