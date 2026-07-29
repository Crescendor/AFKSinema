import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import Peer from 'peerjs';
import { Maximize, Coffee, MessageSquare, X, Send, Trash2, Lightbulb, Play, Eye, Volume2, VolumeX } from 'lucide-react';
import { isAdminUser } from '../utils/discordAuth';

// ── WebRTC STUN Server Configuration for Reliable Cross-Network Connections ─────
const PEER_CONFIG = {
  debug: 1,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' }
    ]
  }
};

// Creates a tiny silent dummy stream so viewer can initiate a peer call
function createDummyStream() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const dst = ctx.createMediaStreamDestination();
    osc.connect(dst);
    osc.start();
    return dst.stream;
  } catch (e) {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.captureStream(1);
  }
}

// ── Converts a YouTube watch URL to an embed URL ──────────────────────────────
function toEmbedUrl(raw) {
  if (!raw) return null;
  const s = raw.trim();
  if (s.includes('youtube.com/embed/') || s.includes('player.twitch.tv')) return s;
  const ytMatch = s.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
  const twMatch = s.match(/twitch\.tv\/([A-Za-z0-9_]+)/);
  if (twMatch) return `https://player.twitch.tv/?channel=${twMatch[1]}&parent=${window.location.hostname}&autoplay=true`;
  return s;
}

export const CinemaScreen = forwardRef(function CinemaScreen({
  lightsDimmed,
  setLightsDimmed,
  broadcasterName,
  setBroadcasterName,
  broadcasterPeerId,
  setBroadcasterPeerId,
  streamUrl,
  setStreamUrl,
  currentUser,
  messages = [],
  activeMola = null,
  onSendMessage,
  onDeleteMessage
}, ref) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFsChatOpen, setIsFsChatOpen] = useState(true);
  const [fsText, setFsText] = useState('');
  const [molaSeconds, setMolaSeconds] = useState(0);

  // Viewer Audio Controls State
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);

  const screenFrameRef = useRef(null);
  const chatScrollRef = useRef(null);
  const videoRef = useRef(null);

  // WebRTC Refs
  const localStreamRef = useRef(null);
  const hostPeerRef = useRef(null);
  const viewerPeerRef = useRef(null);
  const isHostRef = useRef(false);

  const isAdmin = isAdminUser(currentUser);
  const embedUrl = toEmbedUrl(streamUrl);
  const isBroadcasting = !!broadcasterPeerId || !!broadcasterName || !!embedUrl;

  // Expose startBroadcast and stopBroadcast to parent ref
  useImperativeHandle(ref, () => ({
    startBroadcast: handleStartBroadcast,
    stopBroadcast: handleStopBroadcast
  }));

  // Sync volume & mute to video element for viewers
  useEffect(() => {
    if (videoRef.current && !isHostRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // ── WebRTC BROADCASTER (HOST) LOGIC ───────────────────────────────────────
  async function handleStartBroadcast() {
    if (!isAdmin) {
      alert('🔒 Sadece VIP Adminler ekran paylaşımı başlatabilir!');
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: true
      });

      localStreamRef.current = mediaStream;
      isHostRef.current = true;

      // Show local video stream immediately for host (muted locally to avoid echo loop)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.muted = true;
        videoRef.current.play().catch(() => {});
      }

      // Initialize PeerJS Host
      const hostId = 'afksinema-host-' + Math.random().toString(36).substring(2, 8);
      const peer = new Peer(hostId, PEER_CONFIG);
      hostPeerRef.current = peer;

      peer.on('open', (id) => {
        setBroadcasterPeerId(id);
        setBroadcasterName(currentUser.username);

        // Sync Peer ID to D1 state for all viewers
        fetch('/api/room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'SYNC_STATE',
            data: {
              broadcasterPeerId: id,
              broadcasterName: currentUser.username,
              streamUrl: ''
            }
          })
        }).catch(() => {});
      });

      peer.on('connection', (conn) => {
        conn.on('data', (data) => {
          if (data?.type === 'REQUEST_STREAM' && localStreamRef.current) {
            peer.call(conn.peer, localStreamRef.current);
          }
        });
      });

      peer.on('call', (call) => {
        if (localStreamRef.current) {
          call.answer(localStreamRef.current);
        }
      });

      // Track end event (User clicks browser "Stop Sharing" button)
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          handleStopBroadcast();
        };
      }
    } catch (err) {
      console.error('Ekran paylaşımı başlatılamadı:', err);
    }
  }

  function handleStopBroadcast() {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (hostPeerRef.current) {
      hostPeerRef.current.destroy();
      hostPeerRef.current = null;
    }
    isHostRef.current = false;
    setBroadcasterPeerId('');
    setBroadcasterName('');

    fetch('/api/room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'SYNC_STATE',
        data: {
          broadcasterPeerId: '',
          broadcasterName: '',
          streamUrl: ''
        }
      })
    }).catch(() => {});
  }

  // ── WebRTC VIEWER LOGIC ───────────────────────────────────────────────────
  useEffect(() => {
    // If I'm the host, my video is attached directly from localStreamRef
    if (isHostRef.current) return;

    if (!broadcasterPeerId) {
      // Clean up viewer peer if broadcast stops
      if (viewerPeerRef.current) {
        viewerPeerRef.current.destroy();
        viewerPeerRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      return;
    }

    // Connect to host via PeerJS
    const viewerPeer = new Peer(PEER_CONFIG);
    viewerPeerRef.current = viewerPeer;

    const handleRemoteStream = (remoteStream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = remoteStream;
        videoRef.current.volume = volume;
        videoRef.current.muted = isMuted;
        videoRef.current.play().catch(() => {});
      }
    };

    viewerPeer.on('open', () => {
      // 1. Directly call host with dummy stream
      try {
        const dummy = createDummyStream();
        const call = viewerPeer.call(broadcasterPeerId, dummy);
        if (call) {
          call.on('stream', handleRemoteStream);
        }
      } catch (e) {}

      // 2. Also send data message as fallback
      try {
        const conn = viewerPeer.connect(broadcasterPeerId);
        conn.on('open', () => {
          conn.send({ type: 'REQUEST_STREAM' });
        });
      } catch (e) {}
    });

    viewerPeer.on('call', (call) => {
      call.answer(); // Answer incoming call from host
      call.on('stream', handleRemoteStream);
    });

    return () => {
      if (viewerPeerRef.current) {
        viewerPeerRef.current.destroy();
        viewerPeerRef.current = null;
      }
    };
  }, [broadcasterPeerId]);

  // ── FORCE UN-PAUSABLE LIVE PLAYBACK ────────────────────────────────────────
  const forceLivePlay = (e) => {
    const videoEl = e?.target || videoRef.current;
    if (videoEl && videoEl.paused) {
      videoEl.play().catch(() => {});
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current && videoRef.current.paused && (broadcasterPeerId || isHostRef.current)) {
        videoRef.current.play().catch(() => {});
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [broadcasterPeerId]);

  // Mola elapsed timer
  useEffect(() => {
    if (!activeMola) { setMolaSeconds(0); return; }
    const interval = setInterval(() => {
      setMolaSeconds(Math.max(0, Math.floor((Date.now() - activeMola.startTime) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeMola]);

  // Auto-scroll fullscreen chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isFsChatOpen]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!screenFrameRef.current) return;
    if (!document.fullscreenElement) {
      screenFrameRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };
  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  const formatTime = (sec) =>
    `${Math.floor(sec / 60).toString().padStart(2, '0')}:${(sec % 60).toString().padStart(2, '0')}`;

  const handleFsSubmit = (e) => {
    e.preventDefault();
    if (!fsText.trim() || !onSendMessage) return;
    onSendMessage({ text: fsText.trim() });
    setFsText('');
  };

  return (
    <div
      className="ambilight-wrapper"
      ref={screenFrameRef}
      style={{
        position: 'relative',
        background: isFullscreen ? (lightsDimmed ? '#020102' : '#090406') : 'transparent',
        width: '100%',
        height: isFullscreen ? '100vh' : 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {!isFullscreen && <div className="ambilight-glow" />}

      {/* CONTENT AREA */}
      <div style={{
        display: 'flex',
        flex: 1,
        width: '100%',
        height: isFullscreen ? 'calc(100vh - 50px)' : '100%',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Screen Frame */}
        <div className="screen-frame" style={{ flex: 1, height: '100%', position: 'relative' }}>
          <div className="screen-curtain-top" />

          {/* Fullscreen Sohbet Toggle */}
          {isFullscreen && (
            <button
              onClick={() => setIsFsChatOpen(!isFsChatOpen)}
              style={{
                position: 'absolute', top: '16px', right: '16px', zIndex: 999999,
                background: isFsChatOpen ? 'var(--cinema-red)' : 'rgba(15,6,10,0.88)',
                border: `1px solid ${isFsChatOpen ? 'var(--cinema-red)' : 'rgba(255,255,255,0.2)'}`,
                color: 'white', borderRadius: '20px', padding: '8px 16px',
                fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.8)', transition: 'all 0.2s'
              }}
            >
              <MessageSquare size={16} /> Sohbet
            </button>
          )}

          {/* Screen Content */}
          <div className="screen-content" style={{ height: '100%' }}>
            {activeMola ? (
              /* Mola Banner */
              <div style={{
                width: '100%', height: '100%',
                background: 'radial-gradient(circle at center, #310a16 0%, #090406 85%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: '16px', color: 'white', position: 'relative', zIndex: 20
              }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--cinema-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px var(--cinema-red-glow)' }}>
                  <Coffee size={44} color="white" />
                </div>
                <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', background: 'linear-gradient(135deg, #fff, #f43f5e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {activeMola.title}
                </h1>
                <div style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid var(--cinema-red)', padding: '10px 24px', borderRadius: '30px', fontSize: '1.8rem', fontFamily: 'monospace', fontWeight: 900, color: 'var(--accent-gold)', boxShadow: '0 0 20px var(--cinema-red-glow)' }}>
                  ⏱️ {formatTime(molaSeconds)}
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Yayın kısa bir süre içinde kaldığı yerden devam edecektir...</p>
              </div>

            ) : (broadcasterPeerId || isHostRef.current) ? (
              /* ── PeerJS WEBRTC LIVE STREAM SCREEN ── */
              <div style={{ width: '100%', height: '100%', position: 'relative', background: '#000' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted={isHostRef.current ? true : isMuted}
                  controls={false}
                  disablePictureInPicture
                  controlsList="nodownload no remoteplayback noplaybackrate"
                  onPause={forceLivePlay}
                  onWaiting={forceLivePlay}
                  onStalled={forceLivePlay}
                  onTimeUpdate={forceLivePlay}
                  onContextMenu={(e) => e.preventDefault()}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    background: '#000',
                    pointerEvents: 'auto'
                  }}
                />

                {/* Live Badge Overlay */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: 'rgba(0,0,0,0.75)',
                  border: '1px solid #10b981',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: '#34d399',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  zIndex: 10
                }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                  CANLI YAYIN • PeerJS WebRTC {isHostRef.current ? '(Yayıncı)' : ''}
                </div>
              </div>

            ) : embedUrl ? (
              /* ── IFRAME EMBED STREAM ── */
              <iframe
                src={embedUrl}
                title="AFK Sinema Yayını"
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                allowFullScreen
                style={{ width: '100%', height: '100%', border: 'none', display: 'block', background: '#000' }}
              />

            ) : (
              /* Standby Placeholder */
              <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#090406' }}>
                <img
                  src="/no_seance.png"
                  alt="Şu anda bir seans yok - AFK Sinema"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Fullscreen Chat Panel */}
        {isFullscreen && isFsChatOpen && (
          <div style={{
            width: '320px', height: '100%',
            background: lightsDimmed ? 'rgba(4,1,2,0.98)' : 'rgba(12,5,8,0.95)',
            borderLeft: '1px solid var(--bg-card-border)',
            display: 'flex', flexDirection: 'column', zIndex: 999998,
            boxShadow: '-10px 0 30px rgba(0,0,0,0.8)'
          }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 800, color: 'white' }}>
                <MessageSquare size={16} color="var(--cinema-red)" /> Sinema Sohbeti
              </div>
              <button onClick={() => setIsFsChatOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div ref={chatScrollRef} style={{ flex: 1, padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {messages.map((m) => {
                const canDelete = currentUser && (isAdmin || (m.user && m.user.id === currentUser.id));
                return (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', background: m.type === 'system' ? 'rgba(225,29,72,0.1)' : 'rgba(255,255,255,0.04)', padding: '6px 8px', borderRadius: '8px', position: 'relative' }}>
                    {m.user?.avatar && <img src={m.user.avatar} alt={m.user.username} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />}
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      {m.user && (
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--cinema-red)' }}>
                          {m.user.username} {m.seatCode ? `[${m.seatCode}]` : ''}
                        </div>
                      )}
                      <div style={{ fontSize: '0.78rem', color: m.type === 'system' ? 'var(--accent-gold)' : 'white', wordBreak: 'break-word' }}>
                        {m.text}
                      </div>
                    </div>
                    {canDelete && m.type !== 'system' && onDeleteMessage && (
                      <button onClick={() => onDeleteMessage(m.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.8, padding: '2px' }}>
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleFsSubmit} style={{ padding: '10px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.5)', display: 'flex', gap: '6px' }}>
              <input
                type="text"
                placeholder="Tam ekranda yazın..."
                value={fsText}
                onChange={(e) => setFsText(e.target.value)}
                style={{ flex: 1, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '8px 10px', color: 'white', fontSize: '0.78rem' }}
              />
              <button type="submit" className="btn-cinema primary" style={{ padding: '6px 12px' }}>
                <Send size={14} />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', padding: '8px 14px',
        background: isFullscreen ? (lightsDimmed ? '#030102' : '#0e0609') : 'transparent',
        borderTop: isFullscreen ? '1px solid rgba(255,255,255,0.08)' : 'none'
      }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isBroadcasting ? (
            <span style={{ color: 'var(--discord-green)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--discord-green)', animation: 'pulse 1.5s infinite' }} />
              Yayıncı: {broadcasterName || 'Admin'} (Canlı PeerJS)
            </span>
          ) : (
            <span>🎬 Sinema Standby Modunda</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Viewer Individual Audio Volume Control Bar */}
          {!isHostRef.current && (broadcasterPeerId || isBroadcasting) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.6)', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.12)' }}>
              <button
                onClick={() => setIsMuted(!isMuted)}
                style={{ background: 'none', border: 'none', color: isMuted ? '#ef4444' : '#34d399', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                title={isMuted ? "Sesi Aç" : "Sesi Kapat"}
              >
                {isMuted || volume === 0 ? <VolumeX size={16} color="#ef4444" /> : <Volume2 size={16} color="#34d399" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setVolume(v);
                  if (v > 0) setIsMuted(false);
                }}
                style={{ width: '80px', accentColor: 'var(--cinema-red)', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace', minWidth: '32px' }}>
                {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
              </span>
            </div>
          )}

          {isAdmin && (
            <button
              className="btn-cinema"
              onClick={() => setLightsDimmed(!lightsDimmed)}
              style={{
                padding: '6px 12px', fontSize: '0.75rem',
                background: lightsDimmed ? 'linear-gradient(135deg, #fbbf24, #d97706)' : 'rgba(255,255,255,0.06)',
                color: lightsDimmed ? 'black' : 'white', fontWeight: 700
              }}
            >
              <Lightbulb size={14} color={lightsDimmed ? 'black' : 'var(--accent-gold)'} />
              {lightsDimmed ? '💡 Işıkları Aç' : '🌙 Işıkları Kapat'}
            </button>
          )}

          <button className="btn-cinema primary" onClick={toggleFullscreen} style={{ padding: '6px 14px', fontSize: '0.78rem' }}>
            <Maximize size={14} /> {isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran Yap'}
          </button>
        </div>
      </div>
    </div>
  );
});
