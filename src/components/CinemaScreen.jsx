import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Monitor, Maximize, Coffee, MessageSquare, X, Send, Smile } from 'lucide-react';
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
  onSendMessage
}) {
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [stream, setStream] = useState(null);
  const [colorGlow, setColorGlow] = useState('rgba(225, 29, 72, 0.4)');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Fullscreen Floating Chat Panel State
  const [isFsChatOpen, setIsFsChatOpen] = useState(true);
  const [fsText, setFsText] = useState('');

  // Mola Elapsed Forward Counter
  const [molaSeconds, setMolaSeconds] = useState(0);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const screenFrameRef = useRef(null);
  const chatScrollRef = useRef(null);

  const isAdmin = isAdminUser(currentUser);

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
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsBroadcasting(true);
      setBroadcasterName(currentUser.username);
      sounds.playApplause();

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
    setIsBroadcasting(false);
    setBroadcasterName('');
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
      sounds.playPopcornCrunch();
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
    <div className="ambilight-wrapper" ref={screenFrameRef} style={{ position: 'relative' }}>
      {/* Dynamic Ambilight Background Glow */}
      <div
        className="ambilight-glow"
        style={{ '--ambilight-color': colorGlow }}
      />

      <canvas ref={canvasRef} style={{ display: 'none' }} width={32} height={18} />

      {/* Screen Frame */}
      <div className="screen-frame" style={{ position: 'relative' }}>
        <div className="screen-curtain-top" />

        {/* FULLSCREEN FLOATING CHAT DRAWER */}
        {isFullscreen && isFsChatOpen && (
          <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            bottom: '16px',
            width: '320px',
            background: 'rgba(12, 5, 8, 0.92)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--bg-card-border)',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 999,
            boxShadow: '0 10px 40px rgba(0,0,0,0.95)',
            overflow: 'hidden'
          }}>
            {/* Fullscreen Chat Header */}
            <div style={{
              padding: '12px 14px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(0,0,0,0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 800, color: 'white' }}>
                <MessageSquare size={16} color="var(--cinema-red)" />
                Sinema Sohbeti
              </div>
              <button
                onClick={() => setIsFsChatOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages Feed */}
            <div ref={chatScrollRef} style={{ flex: 1, padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {messages.map((m) => (
                <div key={m.id} style={{ display: 'flex', gap: '8px', background: m.type === 'system' ? 'rgba(225,29,72,0.1)' : 'rgba(255,255,255,0.03)', padding: '6px 8px', borderRadius: '8px' }}>
                  {m.user?.avatar && (
                    <img src={m.user.avatar} alt={m.user.username} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                  )}
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
                </div>
              ))}
            </div>

            {/* Input Form inside Fullscreen Mode */}
            <form onSubmit={handleFsSendSubmit} style={{ padding: '10px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.4)', display: 'flex', gap: '6px' }}>
              <input
                type="text"
                placeholder="Tam ekranda yazın..."
                value={fsText}
                onChange={(e) => setFsText(e.target.value)}
                style={{ flex: 1, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '6px 10px', color: 'white', fontSize: '0.78rem' }}
              />
              <button type="submit" className="btn-cinema primary" style={{ padding: '6px 10px' }}>
                <Send size={14} />
              </button>
            </form>
          </div>
        )}

        {/* Screen Content: Broadcast Video OR Intermission Mola OR Standby */}
        <div className="screen-content">
          {activeMola ? (
            /* Animated Mola / Intermission Banner */
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

              {/* Forward Counter (00:01, 00:02...) */}
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
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="screen-video"
            />
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

      {/* Screen Reflection Stage */}
      <div className="screen-reflection-curve" />

      {/* Control Bar Overlay under screen */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '0 8px',
        marginTop: '-10px',
        marginBottom: '10px'
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
          {/* Fullscreen Floating Chat Drawer Toggle */}
          {isFullscreen && (
            <button
              className="btn-cinema"
              onClick={() => setIsFsChatOpen(!isFsChatOpen)}
              style={{ padding: '6px 12px', fontSize: '0.75rem', background: isFsChatOpen ? 'var(--cinema-red)' : 'rgba(0,0,0,0.4)', color: 'white' }}
            >
              <MessageSquare size={14} />
              {isFsChatOpen ? 'Sohbeti Gizle' : '💬 Sohbeti Aç'}
            </button>
          )}

          {isAdmin && isBroadcasting && (
            <button className="btn-cinema" onClick={handleStopBroadcast} style={{ padding: '6px 12px', fontSize: '0.75rem', color: '#ef4444' }}>
              <Pause size={14} /> Yayını Durdur
            </button>
          )}

          <button
            className="btn-cinema"
            onClick={() => setLightsDimmed(!lightsDimmed)}
            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
          >
            {lightsDimmed ? '💡 Işıkları Aç' : '🌙 Işıkları Kapat'}
          </button>

          <button
            className="btn-cinema primary"
            onClick={toggleFullscreen}
            style={{ padding: '6px 14px', fontSize: '0.78rem' }}
          >
            <Maximize size={14} /> Tam Ekran Yap
          </button>
        </div>
      </div>
    </div>
  );
}
