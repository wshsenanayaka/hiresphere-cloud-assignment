const MESSAGING_URL = import.meta.env.VITE_MESSAGING_URL || 'http://localhost:7100';

async function request(path, options = {}) {
  const response = await fetch(`${MESSAGING_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || 'Messaging request failed');
  }

  return data;
}

export const messageApi = {
  listMessages(bookingId, userId) {
    return request(`/messages/${bookingId}?userId=${userId}`);
  },
  sendMessage(payload) {
    return request('/messages', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  markRead(messageId, userId) {
    return request(`/messages/${messageId}/read`, {
      method: 'PUT',
      body: JSON.stringify({ userId }),
    });
  },
  unreadCount(userId) {
    return request(`/messages/unread-count/${userId}`);
  },
};

export { MESSAGING_URL };
