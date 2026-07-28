import React from 'react';
import { LogIn, ShieldCheck } from 'lucide-react';
import { getDiscordOAuthUrl } from '../utils/discordAuth';

export function DiscordLoginModal({ isOpen, onClose, currentUser }) {
  if (!isOpen) return null;

  const handleRealDiscordOAuth = () => {
    const url = getDiscordOAuthUrl();
    window.location.href = url;
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
      onClick={() => { if (currentUser) onClose(); }}
    >
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#121624',
          border: '1px solid rgba(88, 101, 242, 0.4)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '400px',
          padding: '32px 24px',
          textAlign: 'center',
          boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 40px rgba(88, 101, 242, 0.25)'
        }}
      >
        {/* Logo / Icon */}
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

        {/* Heading */}
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: '900', color: 'white', marginBottom: '8px' }}>
          AFKSinema'ya Hoş Geldiniz
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '28px', lineHeight: '1.4' }}>
          Sinema perdesini izlemek ve koltuğunuza oturmak için Discord hesabınızla giriş yapın.
        </p>

        {/* Single Discord OAuth Login Button */}
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
      </div>
    </div>
  );
}
