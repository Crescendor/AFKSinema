import React, { useState, useEffect } from 'react';
import { LogIn, ShieldCheck, User, ArrowRight, Check, Sparkles } from 'lucide-react';
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
        background: 'rgba(5, 7, 13, 0.94)',
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
          background: '#121624',
          border: '1px solid rgba(88, 101, 242, 0.4)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '420px',
          padding: '32px 24px',
          textAlign: 'center',
          boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 40px rgba(88, 101, 242, 0.25)'
        }}
      >
        {step === 1 ? (
          /* STEP 1: DISCORD OAUTH BUTTON */
          <>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '22px',
              background: 'linear-gradient(135deg, #5865F2 0%, #404EED 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px auto',
              boxShadow: '0 10px 24px rgba(88, 101, 242, 0.5)'
            }}>
              <LogIn size={36} color="white" />
            </div>

            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: '900', color: 'white', marginBottom: '8px' }}>
              AFKSinema'ya Hoş Geldiniz
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '28px', lineHeight: '1.4' }}>
              Sinema perdesini izlemek ve koltuğunuza oturmak için Discord hesabınızla giriş yapın.
            </p>

            <button
              onClick={handleRealDiscordOAuth}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #5865F2 0%, #4752C4 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '1.05rem',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 8px 24px rgba(88, 101, 242, 0.5)',
                transition: 'transform 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <ShieldCheck size={22} color="white" />
              Discord İle Giriş Yap
            </button>
          </>
        ) : (
          /* STEP 2: NICKNAME SELECTION (Pre-filled with Discord username) */
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
                    border: '3px solid var(--discord-blurple)',
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
              Salonda ve koltukta görünecek adınızı onaylayın veya özelleştirin:
            </p>

            <div style={{ marginBottom: '24px', textAlign: 'left' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Sinemada Görünecek İsminiz:
              </label>
              <input
                type="text"
                placeholder={tempDiscordUser?.username || 'Discord Kullanıcı Adınız'}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={25}
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid var(--discord-blurple)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  color: 'white',
                  fontSize: '0.95rem',
                  fontWeight: '700',
                  outline: 'none',
                  boxShadow: '0 0 12px rgba(88, 101, 242, 0.2)'
                }}
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                * Varsayılan olarak Discord adınız doldurulmuştur, istediğiniz adı yazabilirsiniz.
              </span>
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
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
                boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)'
              }}
            >
              <Check size={20} /> Sinemaya Katıl 🍿
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
