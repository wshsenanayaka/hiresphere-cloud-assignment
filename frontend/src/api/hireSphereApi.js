import { request } from './client';

export const api = {
  login(payload) {
    return request('/auth', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  getInterviewers() {
    return request('/interviewers');
  },
  getCandidateBookings(candidateId) {
    return request(`/bookings/candidate/${candidateId}`);
  },
  getInterviewerBookings(interviewerId) {
    return request(`/bookings/interviewer/${interviewerId}`);
  },
  createBooking(payload) {
    return request('/bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  createSlot(payload) {
    return request('/interviewers/availability', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  uploadSubmission(formData) {
    return request('/submissions/upload', {
      method: 'POST',
      body: formData,
    });
  },
  createEvaluation(payload) {
    return request('/evaluations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
