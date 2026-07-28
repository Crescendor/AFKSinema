import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Monitor, Maximize, Shield, Sparkles, Coffee, MessageSquareOff, MessageSquare } from 'lucide-react';
import { sounds } from '../utils/soundUtils';
import { isAdminUser } from '../utils/discordAuth';

export function CinemaScreen({
  lightsDimmed,
  setLightsDimmed,
  broadcasterName,
  setBroadcasterName,
  currentUser,
  messages = [],
  activeMola = null
}) {
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [stream, setStream] = useState(null);
  const [colorGlow, setColorGlow] = useState('rgba(225, 29, 72, 0.4)');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Fullscreen Floating Top-Right Chat Toast
  const [showFullscreenChat, setShowFullscreenChat] = useState(true);
  const [activeToastMsg, setActiveToastMsg] = useState(null);

  // Mola Elapsed Forward Counter
  const [molaSeconds, setMolaSeconds] = useState(0);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const screenFrameRef = useRef(null);

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

  // Handle Fullscreen Floating Chat 3-Second Toast Trigger
  useEffect(() => {
    if (!isFullscreen || !showFullscreenChat || messages.length === 0) return;

    const latestMsg = messages[messages.length - 1];
    if (latestMsg && latestMsg.type !== 'system') {
      setActiveToastMsg(latestMsg);

      const hideTimer = setTimeout(() => {
        setActiveToastMsg(null);
      }, 3000);

      return () => clearTimeout(hideTimer);
    }
  }, [messages, isFullscreen, showFullscreenChat]);

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

  // Format Elapsed Mola Seconds to MM:SS
  const formatMolaTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="ambilight-wrapper" ref={screenFrameRef}>
      {/* Dynamic Ambilight Background Glow */}
      <div
        className="ambilight-glow"
        style={{ '--ambilight-color': colorGlow }}
      />

      <canvas ref={canvasRef} style={{ display: 'none' }} width={32} height={18} />

      {/* Screen Frame */}
      <div className="screen-frame">
        <div className="screen-curtain-top" />

        {/* Fullscreen Top-Right Floating Chat (3-Second Duration) */}
        {isFullscreen && showFullscreenChat && activeToastMsg && (
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 100,
            background: 'rgba(15, 6, 10, 0.88)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--bg-card-border)',
            borderRadius: '12px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            maxWidth: '320px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.8)',
            animation: 'fadeIn 0.3s ease'
          }}>
            <img src={activeToastMsg.user?.avatar} alt={activeToastMsg.user?.username} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--cinema-red)' }}>
                {activeToastMsg.user?.username}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeToastMsg.text || '📷 Görsel/Medya'}
              </div>
            </div>
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
          {/* Fullscreen Chat Toggle */}
          {isFullscreen && (
            <button
              className="btn-cinema"
              onClick={() => setShowFullscreenChat(!showFullscreenChat)}
              style={{ padding: '6px 12px', fontSize: '0.75rem' }}
            >
              {showFullscreenChat ? <MessageSquare size={14} /> : <MessageSquareOff size={14} />}
              {showFullscreenChat ? 'Sohbet Açık' : 'Sohbet Kapalı'}
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
