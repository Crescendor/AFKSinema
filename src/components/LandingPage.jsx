import React, { useState, useEffect } from 'react';
import { ArrowLeft, LogOut, ShieldCheck, Film, Users, Sparkles, Copy, Check } from 'lucide-react';
import { fetchDiscordUserProfile, initiateDiscordLogin, checkDiscordAuthCallback, logoutDiscord, isAdminUser } from '../utils/discordAuth';

// Discord SVG Logo Icon
function DiscordIcon() {
  return (
    <svg
      style={{ width: '22px', height: '22px', marginRight: '8px', flexShrink: 0 }}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -28.5 256 256"
      version="1.1"
      preserveAspectRatio="xMidYMid"
    >
      <g>
        <path
          d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031 Z M85.4738752,135.09489 C72.8290281,135.09489 62.4592217,123.290155 62.4592217,108.914901 C62.4592217,94.5396472 72.607595,82.7145587 85.4738752,82.7145587 C98.3405064,82.7145587 108.709962,94.5189427 108.488529,108.914901 C108.508531,123.290155 98.3405064,135.09489 85.4738752,135.09489 Z M170.525237,135.09489 C157.88039,135.09489 147.510584,123.290155 147.510584,108.914901 C147.510584,94.5396472 157.658606,82.7145587 170.525237,82.7145587 C183.391518,82.7145587 193.761324,94.5189427 193.539891,108.914901 C193.539891,123.290155 183.391518,135.09489 170.525237,135.09489 Z"
          fill="#5865F2"
          fillRule="nonzero"
        />
      </g>
    </svg>
  );
}

export function LandingPage({
  currentUser,
  onLogin,
  onLogout,
  onCreateRoom,
  onJoinRoom,
  onOpenAdmin,
  urlRoomCode,
  isLoading
}) {
  const [viewMode, setViewMode] = useState(urlRoomCode ? 'join' : 'menu'); // 'menu' | 'join'
  const [roomCodeInput, setRoomCodeInput] = useState(urlRoomCode ? urlRoomCode.toLowerCase() : '');
  const [guestName, setGuestName] = useState(currentUser?.username || '');
  const [errorMsg, setErrorMsg] = useState('');

  const isAdmin = isAdminUser(currentUser);
  const userAvatar = currentUser?.avatar || '/afk_logo.png';

  const handleCreateSubmit = () => {
    let finalUser = currentUser;
    if (!finalUser) {
      const nameToUse = guestName.trim() || `izleyici_${Math.floor(1000 + Math.random() * 9000)}`;
      finalUser = {
        id: 'usr_' + Math.random().toString(36).substring(2, 9),
        username: nameToUse,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${nameToUse}`,
        role: 'Sinema İzleyicisi'
      };
      onLogin(finalUser);
    }
    onCreateRoom(finalUser);
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    const cleanCode = roomCodeInput.trim().toLowerCase();
    if (cleanCode.length !== 5) {
      setErrorMsg('oda kodu tam 5 haneli olmalıdır.');
      return;
    }
    setErrorMsg('');

    let finalUser = currentUser;
    if (!finalUser) {
      const nameToUse = guestName.trim() || `izleyici_${Math.floor(1000 + Math.random() * 9000)}`;
      finalUser = {
        id: 'usr_' + Math.random().toString(36).substring(2, 9),
        username: nameToUse,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${nameToUse}`,
        role: 'Sinema İzleyicisi'
      };
      onLogin(finalUser);
    }

    onJoinRoom(cleanCode, finalUser);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-site)',
      padding: '24px',
      color: 'var(--text-main)',
      textTransform: 'lowercase'
    }}>
      {/* Sleek Centered Header Logo */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(255, 0, 0, 0.08)',
          border: '1px solid rgba(255, 0, 0, 0.25)',
          padding: '8px 20px',
          borderRadius: '30px',
          marginBottom: '16px'
        }}>
          <img src="/afk_logo.png" alt="AFK Logo" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
          <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--red-primary)', letterSpacing: '0.05em' }}>
            discord cinema rooms
          </span>
        </div>

        <h1 style={{
          fontSize: '2.8rem',
          fontWeight: 900,
          color: '#ffffff',
          letterSpacing: '-0.03em',
          lineHeight: 1.1,
          marginBottom: '8px'
        }}>
          afk<span style={{ color: 'var(--red-primary)' }}>sinema</span>
        </h1>
        <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto' }}>
          arkadaşlarınla birlikte sesli ve canlı sinema salonu deneyimi.
        </p>
      </div>

      {/* Main DoxCards Minimal Action Card */}
      <div className="minimal-card" style={{
        maxWidth: '440px',
        width: '100%',
        padding: '28px',
        background: '#1c1c1c',
        border: '1px solid var(--border-site)',
        borderRadius: '24px',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)'
      }}>
        {/* User Profile / Status Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'rgba(0, 0, 0, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={userAvatar}
              alt="avatar"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid rgba(255, 255, 255, 0.15)',
                background: '#000000'
              }}
            />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 800, fontSize: '0.94rem', color: '#ffffff' }}>
                {currentUser?.username || 'ziyaretçi'}
              </div>
              <div style={{ fontSize: '0.74rem', color: currentUser ? '#5865F2' : '#94a3b8', fontWeight: 600 }}>
                {currentUser ? (isAdmin ? '👑 VIP Admin' : 'discord kullanıcısı') : 'ziyaretçi girişi'}
              </div>
            </div>
          </div>

          {currentUser ? (
            <button
              onClick={onLogout}
              className="btn-icon"
              style={{ width: '32px', height: '32px' }}
              title="çıkış yap"
            >
              <LogOut size={15} color="#fca5a5" />
            </button>
          ) : null}
        </div>

        {/* Initial Menu View */}
        {viewMode === 'menu' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* If visitor, allow typing guest username */}
            {!currentUser && (
              <div style={{ marginBottom: '6px', textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '6px' }}>
                  oyuncu / izleyici adın
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value.toLowerCase())}
                  placeholder="bir isim yaz (örn: ahmet)..."
                  maxLength={19}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#121212',
                    border: '1px solid var(--border-site)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '0.92rem',
                    outline: 'none'
                  }}
                />
              </div>
            )}

            <button
              type="button"
              onClick={handleCreateSubmit}
              disabled={isLoading}
              className="btn-primary"
              style={{ width: '100%' }}
            >
              <Film size={18} />
              <span>{isLoading ? 'oda oluşturuluyor...' : 'yeni oda oluştur'}</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('join')}
              className="btn-secondary"
              style={{ width: '100%' }}
            >
              <Users size={18} />
              <span>odaya katıl</span>
            </button>

            {/* Admin Master Panel Direct Button */}
            {isAdmin && (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="btn-secondary"
                style={{
                  width: '100%',
                  background: 'rgba(255, 0, 0, 0.12)',
                  border: '1px solid rgba(255, 0, 0, 0.35)',
                  color: 'var(--red-primary)',
                  fontWeight: 800
                }}
              >
                <ShieldCheck size={18} />
                <span>admin paneli</span>
              </button>
            )}

            {/* Discord OAuth Login Button */}
            {!currentUser && (
              <>
                <button
                  type="button"
                  onClick={initiateDiscordLogin}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
                    padding: '12px 20px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: '#1e293b',
                    cursor: 'pointer',
                    marginTop: '6px'
                  }}
                >
                  <DiscordIcon />
                  <span>continue with discord</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const adminProfile = {
                      id: '269639754675519489',
                      username: 'Burak (Admin)',
                      discriminator: '0',
                      avatar: 'https://cdn.discordapp.com/embed/avatars/0.png',
                      role: 'VIP Admin Streamer',
                      badge: '👑 Admin',
                      isAdmin: true
                    };
                    onLogin(adminProfile);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255, 0, 0, 0.12)',
                    border: '1px solid rgba(255, 0, 0, 0.35)',
                    borderRadius: '12px',
                    padding: '10px 16px',
                    fontSize: '0.86rem',
                    fontWeight: 800,
                    color: 'var(--red-primary)',
                    cursor: 'pointer',
                    gap: '6px'
                  }}
                >
                  <ShieldCheck size={16} />
                  <span>👑 sistem admin girişi yap</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* Join Room Form */}
        {viewMode === 'join' && (
          <form onSubmit={handleJoinSubmit} className="animate-pop">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <button
                type="button"
                onClick={() => setViewMode('menu')}
                className="btn-icon"
                style={{ width: '34px', height: '34px' }}
                title="geri dön"
              >
                <ArrowLeft size={16} />
              </button>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>sinema salonuna katıl</h3>
            </div>

            {/* Room Invite Banner if code in URL */}
            {urlRoomCode && (
              <div style={{
                background: 'rgba(255, 0, 0, 0.14)',
                border: '1px solid rgba(255, 0, 0, 0.35)',
                borderRadius: '14px',
                padding: '12px 16px',
                marginBottom: '18px',
                textAlign: 'left'
              }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#ff6666' }}>
                  oda daveti: <span style={{ fontFamily: 'monospace', fontSize: '1rem', color: '#ffffff', background: '#000', padding: '2px 8px', borderRadius: '6px' }}>{urlRoomCode.toUpperCase()}</span>
                </div>
                <div style={{ fontSize: '0.74rem', color: '#cbd5e1', marginTop: '4px' }}>
                  doğrudan bu sinema salonuna katılarak izlemeye başlayabilirsin.
                </div>
              </div>
            )}

            {!currentUser && (
              <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '6px' }}>
                  oyuncu / izleyici adın
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value.toLowerCase())}
                  placeholder="bir isim yaz..."
                  maxLength={19}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#121212',
                    border: '1px solid var(--border-site)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '0.92rem',
                    outline: 'none'
                  }}
                  required
                />
              </div>
            )}

            <div style={{ marginBottom: '20px', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '6px' }}>
                5 haneli oda kodu
              </label>
              <input
                type="text"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toLowerCase().trim())}
                placeholder="örn: c7k8x"
                maxLength={5}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: '#121212',
                  border: '2px solid var(--border-site)',
                  borderRadius: '14px',
                  color: 'var(--red-primary)',
                  fontSize: '1.25rem',
                  fontWeight: 900,
                  letterSpacing: '0.2em',
                  textAlign: 'center',
                  fontFamily: 'monospace',
                  textTransform: 'lowercase',
                  outline: 'none'
                }}
                autoFocus
                required
              />
            </div>

            {errorMsg && (
              <div style={{ color: '#ef4444', fontSize: '0.84rem', marginBottom: '14px', fontWeight: 700 }}>
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || roomCodeInput.trim().length !== 5}
              className="btn-primary"
              style={{ width: '100%' }}
            >
              {isLoading ? 'bağlanılıyor...' : 'odaya bağlan'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
