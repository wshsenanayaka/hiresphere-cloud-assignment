import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { io } from 'socket.io-client';
import { messageApi, MESSAGING_URL } from '../services/messageApi';

function formatSentTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(new Date(value));
}

function ChatWindow({ bookingId, userId, userName }) {
  const socketRef = useRef(null);
  const typingTimerRef = useRef(null);
  const bottomRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typingUser, setTypingUser] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Connecting');

  useEffect(() => {
    if (!bookingId || !userId) {
      setError('bookingId and userId are required to open chat.');
      setStatus('Disconnected');
      return;
    }

    messageApi
      .listMessages(bookingId, userId)
      .then((items) => {
        setMessages(items);
        items
          .filter((message) => Number(message.receiverId) === Number(userId) && !message.isRead)
          .forEach((message) => messageApi.markRead(message.id, userId).catch(() => {}));
      })
      .catch((apiError) => setError(apiError.message));

    const socket = io(MESSAGING_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setStatus('Connected');
      socket.emit('join-chat', { bookingId, userId, userName });
    });

    socket.on('disconnect', () => setStatus('Disconnected'));
    socket.on('chat-error', ({ message }) => setError(message));
    socket.on('receive-message', (message) => {
      setMessages((current) => {
        if (current.some((item) => item.id === message.id)) return current;
        return [...current, message];
      });

      if (Number(message.receiverId) === Number(userId)) {
        socket.emit('message-read', { messageId: message.id, userId });
      }
    });
    socket.on('typing', ({ userId: typingUserId, userName: senderName }) => {
      if (Number(typingUserId) !== Number(userId)) {
        setTypingUser(senderName || 'Other user');
      }
    });
    socket.on('stop-typing', ({ userId: typingUserId }) => {
      if (Number(typingUserId) !== Number(userId)) {
        setTypingUser('');
      }
    });
    socket.on('message-read', ({ messageId }) => {
      setMessages((current) =>
        current.map((message) => (message.id === Number(messageId) ? { ...message, isRead: true } : message)),
      );
    });

    return () => {
      socket.disconnect();
      clearTimeout(typingTimerRef.current);
    };
  }, [bookingId, userId, userName]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleTyping(value) {
    setText(value);

    socketRef.current?.emit('typing', { bookingId, userId, userName });
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socketRef.current?.emit('stop-typing', { bookingId, userId });
    }, 900);
  }

  function sendMessage(event) {
    event.preventDefault();
    const message = text.trim();

    if (!message) return;

    socketRef.current?.emit('send-message', { bookingId, senderId: userId, message });
    socketRef.current?.emit('stop-typing', { bookingId, userId });
    setText('');
  }

  return (
    <section className="panel wide chat-panel">
      <div className="panel-title">
        <div>
          <h2>Booking Chat</h2>
          <p className="muted">Room: {bookingId || 'Not selected'}</p>
        </div>
        <span className="call-status">{status}</span>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="chat-messages">
        {messages.length === 0 && <div className="empty-state">No messages yet.</div>}
        {messages.map((message) => {
          const isMine = Number(message.senderId) === Number(userId);

          return (
            <article className={isMine ? 'chat-message mine' : 'chat-message'} key={message.id}>
              <div>
                <strong>{message.senderName}</strong>
                <span>{formatSentTime(message.sentAt)}</span>
              </div>
              <p>{message.message}</p>
              {isMine && <small>{message.isRead ? 'Read' : 'Unread'}</small>}
            </article>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="typing-line">{typingUser ? `${typingUser} is typing...` : ''}</div>

      <form className="chat-form" onSubmit={sendMessage}>
        <input
          value={text}
          onChange={(event) => handleTyping(event.target.value)}
          placeholder="Type your message"
          aria-label="Message text"
        />
        <button className="primary-button" disabled={!text.trim()}>
          <Send size={17} /> Send
        </button>
      </form>
    </section>
  );
}

export default ChatWindow;
