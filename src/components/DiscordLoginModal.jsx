import React, { useState, useEffect } from 'react';
import { LogIn, ShieldCheck, Check } from 'lucide-react';
import { getDiscordOAuthUrl } from '../utils/discordAuth';

export function DiscordLoginModal({ isOpen, onClose, onLogin, tempDiscordUser }) {
  const [step, setStep] = useState(1);
  const [nickname, setNickname] = useState('');

  useEffect(() => {
    if (tempDiscordUser) {
      setNickname(tempDiscordUser.username || '');
      setStep(2);
    }
  }, [tempDiscordUser]);

  if (!isOpen) return null;

  const handleRealDiscordOAuth = () => {
    const url = getDiscordOAuthUrl();
    window.location.href = url;
  };

  const handleQuickAdminLogin = () => {
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
  };

  const handleFinishLogin = (e) => {
    e?.preventDefault();
    const finalName = nickname.trim() || (tempDiscordUser ? tempDiscordUser.username : 'Sinema İzleyicisi');
    
    const finalUser = {
      ...tempDiscordUser,
      username: finalName
    };

    onLogin(finalUser);
  };

  return (
    <div 
      className="modal-overlay" 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(9, 4, 6, 0.94)',
        backdropFilter: 'blur(20px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1c1c1c',
          border: '1px solid var(--border-site)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '420px',
          padding: '36px 28px 24px 28px',
          textAlign: 'center',
          boxShadow: '0 25px 60px rgba(0,0,0,0.95)'
        }}
      >
        {step === 1 ? (
          <>
            <div style={{
              width: '90px',
              height: '90px',
              margin: '0 auto 20px auto',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 10px 30px var(--cinema-red-glow)',
              border: '2px solid rgba(255, 0, 0, 0.4)',
              background: '#000'
            }}>
              <img 
                src="/afk_logo.png" 
                alt="AFK Sinema Logo" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: '900', color: 'white', marginBottom: '20px', textTransform: 'lowercase' }}>
              afksinema'ya katıl
            </h2>

            <button
              onClick={handleRealDiscordOAuth}
              style={{
                width: '100%',
                background: '#FF0000',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '14px',
                fontSize: '1rem',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 6px 20px rgba(255, 0, 0, 0.45)',
                marginBottom: '12px',
                textTransform: 'lowercase'
              }}
            >
              <ShieldCheck size={20} color="white" />
              discord ile giriş yap
            </button>

            <button
              onClick={handleQuickAdminLogin}
              style={{
                width: '100%',
                background: 'rgba(255, 0, 0, 0.12)',
                color: 'var(--red-primary)',
                border: '1px solid rgba(255, 0, 0, 0.35)',
                borderRadius: '12px',
                padding: '12px',
                fontSize: '0.88rem',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '20px',
                textTransform: 'lowercase'
              }}
            >
              <ShieldCheck size={18} />
              👑 sistem admin girişi yap
            </button>
          </>
        ) : (
          <form onSubmit={handleFinishLogin}>
            {tempDiscordUser?.avatar && (
              <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 16px auto' }}>
                <img
                  src={tempDiscordUser.avatar}
                  alt="Discord Avatar"
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    border: '3px solid var(--cinema-red)',
                    objectFit: 'cover'
                  }}
                />
              </div>
            )}

            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: '900', color: 'white', marginBottom: '6px', textTransform: 'lowercase' }}>
              sinema isim tercihi
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
              salonda ve koltukta görünecek adınızı onaylayın:
            </p>

            <div style={{ marginBottom: '20px', textAlign: 'left' }}>
              <input
                type="text"
                placeholder={tempDiscordUser?.username || 'izleyici adın'}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={25}
                style={{
                  width: '100%',
                  background: '#121212',
                  border: '1px solid var(--border-site)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  color: 'white',
                  fontSize: '0.92rem',
                  fontWeight: '700',
                  outline: 'none'
                }}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', padding: '14px', justifyContent: 'center' }}
            >
              <Check size={18} /> sinemaya katıl 🍿
            </button>
          </form>
        )}

        <div style={{
          fontSize: '0.76rem',
          color: 'var(--text-subtle)',
          borderTop: '1px solid var(--border-site)',
          paddingTop: '14px',
          marginTop: '16px'
        }}>
          Dox tarafından AFK için Sevgiyle üretildi - 2026
        </div>
      </div>
    </div>
  );
}
