import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Mic, MicOff, PhoneOff, Radio } from 'lucide-react';
import { io } from 'socket.io-client';

const SIGNALING_URL = import.meta.env.VITE_SIGNALING_URL || 'http://localhost:7000';
const rtcConfig = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

function VideoCall({ roomId, userName, onLeave }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);

  const [status, setStatus] = useState('Waiting');
  const [error, setError] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  function createPeerConnection() {
    const peerConnection = new RTCPeerConnection(rtcConfig);

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit('ice-candidate', {
          roomId,
          candidate: event.candidate,
        });
      }
    };

    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteVideoRef.current && remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    };

    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;

      if (state === 'connected') setStatus('Connected');
      if (state === 'connecting') setStatus('Connecting');
      if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        setStatus('Disconnected');
      }
    };

    localStreamRef.current?.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStreamRef.current);
    });

    peerConnectionRef.current = peerConnection;
    return peerConnection;
  }

  async function startLocalMedia() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (mediaError) {
      setStatus('Disconnected');
      setError('Camera or microphone permission was denied. Please allow access and refresh the page.');
      throw mediaError;
    }
  }

  async function sendOffer() {
    setStatus('Connecting');
    const peerConnection = peerConnectionRef.current || createPeerConnection();
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socketRef.current?.emit('offer', { roomId, offer });
  }

  async function handleOffer({ offer }) {
    setStatus('Connecting');
    const peerConnection = peerConnectionRef.current || createPeerConnection();
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socketRef.current?.emit('answer', { roomId, answer });
  }

  async function handleAnswer({ answer }) {
    const peerConnection = peerConnectionRef.current;
    if (peerConnection && !peerConnection.currentRemoteDescription) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }

  async function handleIceCandidate({ candidate }) {
    const peerConnection = peerConnectionRef.current;
    if (peerConnection && candidate) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  function toggleAudio() {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  }

  function toggleCamera() {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCameraOff(!videoTrack.enabled);
    }
  }

  function leaveCall({ redirect = false } = {}) {
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;

    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    socketRef.current?.disconnect();
    setStatus('Disconnected');

    if (redirect) {
      onLeave?.();
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function connect() {
      if (!roomId) {
        setError('roomId is required to join a live interview.');
        setStatus('Disconnected');
        return;
      }

      try {
        await startLocalMedia();

        if (!isMounted) return;

        const socket = io(SIGNALING_URL, {
          transports: ['websocket'],
        });

        socketRef.current = socket;

        socket.on('connect', () => {
          setStatus('Waiting');
          socket.emit('join-room', { roomId, userName });
        });

        socket.on('user-joined', sendOffer);
        socket.on('offer', handleOffer);
        socket.on('answer', handleAnswer);
        socket.on('ice-candidate', handleIceCandidate);
        socket.on('user-left', () => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
          peerConnectionRef.current?.close();
          peerConnectionRef.current = null;
          setStatus('Disconnected');
        });
        socket.on('live-error', ({ message }) => setError(message));
        socket.on('disconnect', () => setStatus('Disconnected'));
      } catch {
        // startLocalMedia already sets the user-facing error.
      }
    }

    connect();

    return () => {
      isMounted = false;
      leaveCall();
    };
  }, [roomId, userName]);

  return (
    <section className="live-call-panel">
      <div className="live-call-topbar">
        <div>
          <h2>Live Mock Interview</h2>
          <p className="muted">Room: {roomId || 'Not selected'}</p>
        </div>
        <span className={`call-status status-${status.toLowerCase()}`}>
          <Radio size={14} /> {status}
        </span>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="video-grid">
        <div className="video-tile">
          <video ref={localVideoRef} autoPlay playsInline muted />
          <span>{userName || 'You'}</span>
        </div>
        <div className="video-tile">
          <video ref={remoteVideoRef} autoPlay playsInline />
          <span>Remote participant</span>
        </div>
      </div>

      <div className="call-controls">
        <button className={isMuted ? 'call-control active' : 'call-control'} onClick={toggleAudio} type="button">
          {isMuted ? <MicOff size={17} /> : <Mic size={17} />}
          <span>{isMuted ? 'Unmute' : 'Mute'}</span>
        </button>
        <button className={isCameraOff ? 'call-control active' : 'call-control'} onClick={toggleCamera} type="button">
          {isCameraOff ? <CameraOff size={17} /> : <Camera size={17} />}
          <span>{isCameraOff ? 'Camera on' : 'Camera off'}</span>
        </button>
        <button className="call-control danger" onClick={() => leaveCall({ redirect: true })} type="button">
          <PhoneOff size={17} /> <span>Leave</span>
        </button>
      </div>
    </section>
  );
}

export default VideoCall;
