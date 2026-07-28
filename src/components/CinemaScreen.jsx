import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Monitor, Sun, Moon, Maximize, Minimize, Radio, ShieldAlert, Crown } from 'lucide-react';
import { isAdminUser } from '../utils/discordAuth';

export function CinemaScreen({
  lightsDimmed,
  setLightsDimmed,
  broadcasterName,
  setBroadcasterName,
  currentUser
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const screenFrameRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);
  const [ambilightColor, setAmbilightColor] = useState('rgba(88, 101, 242, 0.5)');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isAdmin = isAdminUser(currentUser);

  // Screen share functionality - STRICTLY LIMITED TO ADMIN DISCORD IDs
  const startDiscordScreenShare = async () => {
    if (!isAdmin) {
      alert('⚠️ YAYIN YETKİSİ KISITLI:\nYayın açma yetkisi yalnızca kayıtlı Discord Admin kullanıcılarına verilmiştir.\n(Yetkili ID\'ler: 102225960337670144 & 269639754675519489)');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: true
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setMediaStream(stream);
      setIsScreenSharing(true);
      setBroadcasterName(`${currentUser ? currentUser.username : 'Admin'} Discord Canlı Ekranı`);
      setIsPlaying(true);

      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.warn('Ekran paylaşımı iptal edildi:', err);
    }
  };

  const stopScreenShare = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
    }
    setMediaStream(null);
    setIsScreenSharing(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setBroadcasterName('');
  };

  // Fullscreen Handler
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

  // Ambilight canvas color sampler
  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current && canvasRef.current && !videoRef.current.paused) {
        try {
          const ctx = canvasRef.current.getContext('2d');
          ctx.drawImage(videoRef.current, 0, 0, 10, 10);
          const pixelData = ctx.getImageData(5, 5, 1, 1).data;
          setAmbilightColor(`rgba(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]}, 0.55)`);
        } catch (e) {
          setAmbilightColor('rgba(88, 101, 242, 0.45)');
        }
      }
    }, 400);

    return () => clearInterval(interval);
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <canvas ref={canvasRef} width="10" height="10" style={{ display: 'none' }} />

      <div className="ambilight-wrapper">
        <div className="ambilight-glow" style={{ '--ambilight-color': ambilightColor }} />

        {/* Screen Frame */}
        <div className="screen-frame" ref={screenFrameRef}>
          <div className="screen-curtain-top" />

          {/* Broadcaster Badge */}
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '16px',
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(10, 12, 20, 0.85)',
            backdropFilter: 'blur(10px)',
            padding: '4px 12px',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '0.78rem'
          }}>
            <Radio size={14} color={isScreenSharing ? '#10b981' : 'var(--discord-blurple)'} style={{ animation: 'pulse 1.5s infinite' }} />
            <span style={{ fontWeight: 700, color: 'white' }}>
              {isScreenSharing ? broadcasterName : 'AFKSinema Perdesi (Yayın Bekleniyor...)'}
            </span>
            {isScreenSharing && (
              <span style={{ fontSize: '0.65rem', background: '#10b981', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 800 }}>
                CANLI DISCORD YAYINI
              </span>
            )}
          </div>

          {/* Screen Content */}
          <div className="screen-content">
            {isScreenSharing ? (
              <video
                ref={videoRef}
                className="screen-video"
                autoPlay
                playsInline
                muted={isMuted}
              />
            ) : (
              <div className="screen-standby">
                <div style={{ position: 'relative' }}>
                  <Monitor className="screen-standby-icon" />
                  <Crown size={24} color="var(--accent-gold)" style={{ position: 'absolute', top: '-10px', right: '-10px' }} />
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: 'white', marginBottom: '6px' }}>
                    Sinema Perdesi Hazır
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Yetkili Admin yayın başlattığında sinema perdesinde canlı Discord akışı görünecektir.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Screen Controls Overlay */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '12px 16px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 20
          }}>
            {/* Play/Pause & Volume */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {isScreenSharing && (
                <button onClick={togglePlay} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button onClick={toggleMute} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                  {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={handleVolumeChange}
                  style={{ width: '70px', accentColor: 'var(--discord-blurple)', cursor: 'pointer' }}
                />
              </div>
            </div>

            {/* Broadcast & Fullscreen Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isAdmin ? (
                isScreenSharing ? (
                  <button className="btn-cinema" onClick={stopScreenShare} style={{ background: '#ef4444', borderColor: '#ef4444', padding: '6px 12px', fontSize: '0.75rem' }}>
                    Yayını Durdur
                  </button>
                ) : (
                  <button className="btn-cinema primary" onClick={startDiscordScreenShare} style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'linear-gradient(135deg, var(--discord-blurple), #9146FF)' }}>
                    <Crown size={14} color="var(--accent-gold)" /> Discord / Ekran Yansıt (Admin)
                  </button>
                )
              ) : (
                <button
                  className="btn-cinema"
                  onClick={startDiscordScreenShare}
                  style={{ padding: '6px 12px', fontSize: '0.75rem', opacity: 0.6, cursor: 'not-allowed' }}
                  title="Yalnızca Discord Adminleri (ID: 102225960337670144 & 269639754675519489) yayın açabilir"
                >
                  <ShieldAlert size={14} color="#f59e0b" /> Yayın Yetkisi: Sadece Adminler
                </button>
              )}

              <button className="btn-cinema" onClick={() => setLightsDimmed(!lightsDimmed)} style={{ padding: '6px 10px', fontSize: '0.75rem' }}>
                {lightsDimmed ? <Sun size={14} color="var(--accent-gold)" /> : <Moon size={14} />}
              </button>

              {/* Fullscreen Button */}
              <button className="btn-cinema" onClick={toggleFullscreen} style={{ padding: '6px 10px', fontSize: '0.75rem' }} title="Yayını Tam Ekran Yap">
                {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
              </button>
            </div>
          </div>
        </div>

        <div className="screen-reflection-curve" />
      </div>
    </div>
  );
}
