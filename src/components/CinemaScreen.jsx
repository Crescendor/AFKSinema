import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Monitor, Maximize, Coffee, MessageSquare, X, Send, Eye, Trash2, Lightbulb } from 'lucide-react';
import { sounds } from '../utils/soundUtils';
import { isAdminUser } from '../utils/discordAuth';

export function CinemaScreen({
  lightsDimmed,
  setLightsDimmed,
  broadcasterName,
  setBroadcasterName,
  currentUser,
  messages = [],
  activeMola = null,
  onSendMessage,
  onDeleteMessage
}) {
  const [stream, setStream] = useState(null);
  const [colorGlow, setColorGlow] = useState('rgba(225, 29, 72, 0.4)');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Fullscreen Chat Drawer State
  const [isFsChatOpen, setIsFsChatOpen] = useState(true);
  const [fsText, setFsText] = useState('');

  // Mola Elapsed Forward Counter
  const [molaSeconds, setMolaSeconds] = useState(0);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const screenFrameRef = useRef(null);
  const chatScrollRef = useRef(null);

  const isAdmin = isAdminUser(currentUser);
  const isBroadcasting = !!broadcasterName || !!stream;

  // Bind WebRTC Stream to Video Element whenever stream changes or videoRef is mounted
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => console.error('Video Oynatma Hatası:', err));
    }
  }, [stream, isBroadcasting]);

  // Mola Forward Timer Interval
  useEffect(() => {
    if (!activeMola) {
      setMolaSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - activeMola.startTime) / 1000);
      setMolaSeconds(elapsed > 0 ? elapsed : 0);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeMola]);

  // Auto-scroll chat feed in fullscreen
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isFsChatOpen]);

  // WebRTC Screen Share
  const handleStartBroadcast = async () => {
    if (!isAdmin) {
      alert('🔒 Sadece yetkili VIP Adminler (Burak & Yayıncı Admin) ekran paylaşımı başlatabilir!');
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: true
      });

      setStream(mediaStream);
      setBroadcasterName(currentUser.username);

      // Edge API sync broadcaster name
      fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SYNC_STATE', data: { broadcasterName: currentUser.username } })
      }).catch(() => {});

      mediaStream.getVideoTracks()[0].onended = () => {
        handleStopBroadcast();
      };
    } catch (err) {
      console.error('Ekran paylaşımı iptal edildi veya hata:', err);
    }
  };

  const handleStopBroadcast = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setBroadcasterName('');

    fetch('/api/room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SYNC_STATE', data: { broadcasterName: '' } })
    }).catch(() => {});
  };

  // Fullscreen Mode Toggle
  const toggleFullscreen = () => {
    if (!screenFrameRef.current) return;

    if (!document.fullscreenElement) {
      screenFrameRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(err => console.error(err));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(err => console.error(err));
    }
  };

  useEffect(() => {
    const handleFSChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, []);

  const handleFsSendSubmit = (e) => {
    e.preventDefault();
    if (!fsText.trim()) return;

    if (onSendMessage) {
      onSendMessage({ text: fsText.trim() });
    }
    setFsText('');
  };

  // Format Elapsed Mola Seconds to MM:SS
  const formatMolaTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
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
      {/* Dynamic Ambilight Background Glow */}
      {!isFullscreen && (
        <div
          className="ambilight-glow"
          style={{ '--ambilight-color': colorGlow }}
        />
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} width={32} height={18} />

      {/* FULLSCREEN WRAPPER: Side-by-side flex layout when chat is open in Fullscreen */}
      <div style={{
        display: 'flex',
        flex: 1,
        width: '100%',
        height: isFullscreen ? 'calc(100vh - 50px)' : '100%',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Screen Frame (Video & Perde) */}
        <div className="screen-frame" style={{ flex: 1, height: '100%', position: 'relative' }}>
          <div className="screen-curtain-top" />

          {/* Clean Single Toggle 'Sohbet' Button */}
          {isFullscreen && (
            <button
              onClick={() => setIsFsChatOpen(!isFsChatOpen)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                zIndex: 999999,
                background: isFsChatOpen ? 'var(--cinema-red)' : 'rgba(15, 6, 10, 0.88)',
                border: `1px solid ${isFsChatOpen ? 'var(--cinema-red)' : 'rgba(255,255,255,0.2)'}`,
                color: 'white',
                borderRadius: '20px',
                padding: '8px 16px',
                fontSize: '0.85rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.8)',
                transition: 'all 0.2s ease'
              }}
              title="Sohbeti Aç / Kapat"
            >
              <MessageSquare size={16} color="white" />
              Sohbet
            </button>
          )}

          {/* Screen Content */}
          <div className="screen-content" style={{ height: '100%' }}>
            {activeMola ? (
              /* Animated Mola Banner */
              <div style={{
                width: '100%',
                height: '100%',
                background: 'radial-gradient(circle at center, #310a16 0%, #090406 85%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                color: 'white',
                position: 'relative',
                zIndex: 20
              }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--cinema-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px var(--cinema-red-glow)' }}>
                  <Coffee size={44} color="white" />
                </div>

                <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', background: 'linear-gradient(135deg, #fff, #f43f5e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {activeMola.title}
                </h1>

                <div style={{
                  background: 'rgba(0,0,0,0.6)',
                  border: '1px solid var(--cinema-red)',
                  padding: '10px 24px',
                  borderRadius: '30px',
                  fontSize: '1.8rem',
                  fontFamily: 'monospace',
                  fontWeight: 900,
                  color: 'var(--accent-gold)',
                  boxShadow: '0 0 20px var(--cinema-red-glow)'
                }}>
                  ⏱️ {formatMolaTime(molaSeconds)}
                </div>

                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  Yayın kısa bir süre içinde kaldığı yerden devam edecektir...
                </p>
              </div>
            ) : isBroadcasting ? (
              stream ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted={isAdmin}
                  className="screen-video"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                /* Multi-User Viewer Screen Indicator */
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: 'radial-gradient(circle at center, #1c0910 0%, #090406 85%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '14px',
                  color: 'white'
                }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 25px rgba(16,185,129,0.5)' }}>
                    <Eye size={32} color="white" />
                  </div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399' }}>
                    🎥 CANLI YAYIN: {broadcasterName}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Yayıncı Discord üzerinden yayını yansıtıyor.
                  </p>
                </div>
              )
            ) : (
              <div className="screen-standby">
                <Monitor className="screen-standby-icon" />
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>
                    AFK Sinema Ekranı Hazır
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                    {isAdmin
                      ? 'Yayıncı Admin: Discord ekran paylaşımını başlatıp filmi/yayını sinemaya yansıtabilirsiniz.'
                      : 'Yayın henüz başlamadı. Koltuğunuza kurulun ve yayının başlamasını bekleyin! 🍿'}
                  </p>
                </div>

                {isAdmin && (
                  <button
                    className="btn-cinema primary"
                    onClick={handleStartBroadcast}
                    style={{ marginTop: '12px' }}
                  >
                    <Play size={16} /> Discord Ekran Paylaşımını Başlat
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* FULLSCREEN CHAT SIDE PANEL */}
        {isFullscreen && isFsChatOpen && (
          <div style={{
            width: '320px',
            height: '100%',
            background: lightsDimmed ? 'rgba(4, 1, 2, 0.98)' : 'rgba(12, 5, 8, 0.95)',
            borderLeft: '1px solid var(--bg-card-border)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 999998,
            boxShadow: '-10px 0 30px rgba(0,0,0,0.8)'
          }}>
            {/* Header */}
            <div style={{
              padding: '12px 14px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(0,0,0,0.4)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 800, color: 'white' }}>
                <MessageSquare size={16} color="var(--cinema-red)" />
                Sinema Sohbeti
              </div>
              <button
                onClick={() => setIsFsChatOpen(false)}
                title="Sohbeti Gizle"
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat Messages Feed with Delete Button */}
            <div ref={chatScrollRef} style={{ flex: 1, padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {messages.map((m) => {
                const canDelete = currentUser && (isAdmin || (m.user && m.user.id === currentUser.id));

                return (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', background: m.type === 'system' ? 'rgba(225,29,72,0.1)' : 'rgba(255,255,255,0.04)', padding: '6px 8px', borderRadius: '8px', position: 'relative' }}>
                    {m.user?.avatar && (
                      <img src={m.user.avatar} alt={m.user.username} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                    )}
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      {m.user && (
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--cinema-red)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>{m.user.username} {m.seatCode ? `[${m.seatCode}]` : ''}</span>
                        </div>
                      )}
                      <div style={{ fontSize: '0.78rem', color: m.type === 'system' ? 'var(--accent-gold)' : 'white', wordBreak: 'break-word' }}>
                        {m.text}
                      </div>
                    </div>

                    {/* Delete Message Button */}
                    {canDelete && m.type !== 'system' && onDeleteMessage && (
                      <button
                        onClick={() => onDeleteMessage(m.id)}
                        title="Mesajı Sil"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          opacity: 0.8,
                          padding: '2px'
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Input Form */}
            <form onSubmit={handleFsSendSubmit} style={{ padding: '10px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.5)', display: 'flex', gap: '6px' }}>
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

      {/* Control Bar Overlay under screen */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '8px 14px',
        background: isFullscreen ? (lightsDimmed ? '#030102' : '#0e0609') : 'transparent',
        borderTop: isFullscreen ? '1px solid rgba(255,255,255,0.08)' : 'none'
      }}>
        {/* Left: Broadcaster Info */}
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isBroadcasting ? (
            <span style={{ color: 'var(--discord-green)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--discord-green)' }} />
              Yayıncı: {broadcasterName} (Canlı)
            </span>
          ) : (
            <span>🎬 Sinema Standby Modunda</span>
          )}
        </div>

        {/* Right: Controls & Fullscreen Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isAdmin && isBroadcasting && (
            <button className="btn-cinema" onClick={handleStopBroadcast} style={{ padding: '6px 12px', fontSize: '0.75rem', color: '#ef4444' }}>
              <Pause size={14} /> Yayını Durdur
            </button>
          )}

          {/* Lights Control Button — Exclusively for Admin Users */}
          {isAdmin && (
            <button
              className="btn-cinema"
              onClick={() => setLightsDimmed(!lightsDimmed)}
              style={{
                padding: '6px 12px',
                fontSize: '0.75rem',
                background: lightsDimmed ? 'linear-gradient(135deg, #fbbf24, #d97706)' : 'rgba(255,255,255,0.06)',
                color: lightsDimmed ? 'black' : 'white',
                fontWeight: 700
              }}
              title="Sadece VIP Adminler Kullanabilir"
            >
              <Lightbulb size={14} color={lightsDimmed ? 'black' : 'var(--accent-gold)'} />
              {lightsDimmed ? '💡 Işıkları Aç' : '🌙 Işıkları Kapat'}
            </button>
          )}

          <button
            className="btn-cinema primary"
            onClick={toggleFullscreen}
            style={{ padding: '6px 14px', fontSize: '0.78rem' }}
          >
            <Maximize size={14} /> {isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran Yap'}
          </button>
        </div>
      </div>
    </div>
  );
}
