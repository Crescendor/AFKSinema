import React, { useState } from 'react';
import { LogIn, ShieldCheck, Check, UserCheck, Crown } from 'lucide-react';
import { getDiscordOAuthUrl, ADMIN_DISCORD_IDS } from '../utils/discordAuth';

export function DiscordLoginModal({ isOpen, onClose, onLogin, currentUser }) {
  const [discordId, setDiscordId] = useState('');
  const [username, setUsername] = useState('');
  const [clientId, setClientId] = useState('1399863486375039016');

  if (!isOpen) return null;

  const handleRealDiscordOAuth = () => {
    const url = getDiscordOAuthUrl(clientId.trim());
    window.location.href = url;
  };

  const handleIdLogin = (e) => {
    e.preventDefault();
    if (!discordId.trim()) {
      alert('Lütfen geçerli bir Discord User ID girin veya Discord ile giriş yapın!');
      return;
    }
    const enteredId = discordId.trim();
    const isAdmin = ADMIN_DISCORD_IDS.includes(enteredId);
    
    const userObj = {
      id: enteredId,
      username: username.trim() || `DiscordUser_${enteredId.slice(-4)}`,
      discriminator: '0',
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80`,
      role: isAdmin ? 'VIP Admin Streamer' : 'Sinema İzleyicisi',
      badge: isAdmin ? '👑 Admin' : '🎬 İzleyici',
      isAdmin
    };

    onLogin(userObj);
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
          borderRadius: '20px',
          width: '100%',
          maxWidth: '440px',
          padding: '28px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 30px rgba(88, 101, 242, 0.25)'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #5865F2 0%, #404EED 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px auto',
            boxShadow: '0 8px 20px rgba(88, 101, 242, 0.5)'
          }}>
            <LogIn size={32} color="white" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: '900', color: 'white' }}>
            AFKSinema'ya Giriş Yapın
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Sinema perdesini izlemek ve koltuğa oturmak için Discord hesabınızı bağlayın.
          </p>
        </div>

        {/* Primary Discord OAuth2 Button */}
        <button
          onClick={handleRealDiscordOAuth}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #5865F2 0%, #4752C4 100%)',
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
            boxShadow: '0 6px 20px rgba(88, 101, 242, 0.4)',
            marginBottom: '20px',
            transition: 'transform 0.15s ease'
          }}
        >
          <ShieldCheck size={22} color="white" />
          Discord İle Oturum Aç (OAuth2)
        </button>

        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', gap: '10px' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>VEYA DISCORD ID İLE GİRİŞ</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
        </div>

        {/* Discord User ID form */}
        <form onSubmit={handleIdLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Discord User ID:
            </label>
            <input
              type="text"
              placeholder="Örn: 102225960337670144"
              value={discordId}
              onChange={(e) => setDiscordId(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: 'white',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Kullanıcı Adınız (Opsiyonel):
            </label>
            <input
              type="text"
              placeholder="Kullanıcı Adı"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: 'white',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
          </div>

          <button
            type="submit"
            className="btn-cinema primary"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '0.9rem',
              marginTop: '6px',
              justifyContent: 'center'
            }}
          >
            <UserCheck size={18} /> Giriş Yap & Salona Geç
          </button>
        </form>

        <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textAlign: 'center', marginTop: '16px' }}>
          * 102225960337670144 ve 269639754675519489 ID'leri Yayıncı Admin olarak yetkilendirilir.
        </p>
      </div>
    </div>
  );
}
