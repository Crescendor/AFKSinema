import React, { useState, useEffect } from 'react';
import { LogIn, ShieldCheck, Check } from 'lucide-react';
import { getDiscordOAuthUrl } from '../utils/discordAuth';

export function DiscordLoginModal({ isOpen, onClose, onLogin, tempDiscordUser }) {
  const [step, setStep] = useState(1); // 1 = OAuth Login, 2 = Nickname Customization
  const [nickname, setNickname] = useState('');

  // When a Discord profile is returned from OAuth, advance to Step 2 automatically
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
          background: '#170a0e',
          border: '1px solid var(--bg-card-border)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '420px',
          padding: '36px 28px 24px 28px',
          textAlign: 'center',
          boxShadow: '0 25px 60px rgba(0,0,0,0.95), 0 0 45px var(--cinema-red-glow)'
        }}
      >
        {step === 1 ? (
          /* STEP 1: DISCORD OAUTH BUTTON WITH CUSTOM LOGO */
          <>
            {/* Custom AFKSinema Logo with slightly rounded corners */}
            <div style={{
              width: '100px',
              height: '100px',
              margin: '0 auto 20px auto',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 10px 30px var(--cinema-red-glow)',
              border: '2px solid rgba(225, 29, 72, 0.4)',
              background: '#000'
            }}>
              <img 
                src="/afk_logo.png" 
                alt="AFK Sinema Logo" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.65rem', fontWeight: '900', color: 'white', marginBottom: '24px' }}>
              AFKSinema'ya hoş geldiniz.
            </h2>

            <button
              onClick={handleRealDiscordOAuth}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, var(--cinema-red) 0%, #be123c 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '14px',
                padding: '16px',
                fontSize: '1.05rem',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 8px 24px var(--cinema-red-glow)',
                transition: 'transform 0.15s ease',
                marginBottom: '28px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <ShieldCheck size={22} color="white" />
              Discord İle Giriş Yap
            </button>
          </>
        ) : (
          /* STEP 2: NICKNAME SELECTION */
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
                    objectFit: 'cover',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.6)'
                  }}
                />
                {tempDiscordUser.isAdmin && (
                  <span style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: 'var(--accent-gold)', borderRadius: '50%', padding: '4px', fontSize: '0.8rem' }}>
                    👑
                  </span>
                )}
              </div>
            )}

            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: '900', color: 'white', marginBottom: '6px' }}>
              Sinema İsim Tercihi
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Salonda ve koltukta görünecek adınızı onaylayın:
            </p>

            <div style={{ marginBottom: '20px', textAlign: 'left' }}>
              <input
                type="text"
                placeholder={tempDiscordUser?.username || 'Discord Kullanıcı Adınız'}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={25}
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid var(--cinema-red)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  color: 'white',
                  fontSize: '0.95rem',
                  fontWeight: '700',
                  outline: 'none',
                  boxShadow: '0 0 12px var(--cinema-red-glow)'
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, var(--cinema-red) 0%, #be123c 100%)',
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
                gap: '8px',
                boxShadow: '0 6px 20px var(--cinema-red-glow)',
                marginBottom: '24px'
              }}
            >
              <Check size={20} /> Sinemaya Katıl 🍿
            </button>
          </form>
        )}

        {/* Footer Text inside Login Modal */}
        <div style={{
          fontSize: '0.78rem',
          color: 'var(--text-dim)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: '16px'
        }}>
          Dox tarafından AFK için Sevgiyle üretildi - 2026
        </div>
      </div>
    </div>
  );
}
