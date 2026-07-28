import React, { useState } from 'react';
import { LogIn, User, ShieldCheck, Crown, Check, ExternalLink } from 'lucide-react';
import { getDiscordOAuthUrl, ADMIN_DISCORD_IDS } from '../utils/discordAuth';

const ADMIN_PRESETS = [
  {
    id: '102225960337670144',
    username: 'Burak',
    discriminator: '0',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    role: 'Sistem Yöneticisi',
    badge: '👑 Admin'
  },
  {
    id: '269639754675519489',
    username: 'Yayıncı Admin',
    discriminator: '0',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
    role: 'Yayın Yetkilisi',
    badge: '👑 Admin'
  }
];

export function DiscordLoginModal({ isOpen, onClose, onLogin, currentUser }) {
  const [selectedPreset, setSelectedPreset] = useState(ADMIN_PRESETS[0]);
  const [customId, setCustomId] = useState('');
  const [customName, setCustomName] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [clientId, setClientId] = useState('1399863486375039016');

  if (!isOpen) return null;

  const handleRealDiscordOAuth = () => {
    const url = getDiscordOAuthUrl(clientId.trim());
    window.location.href = url;
  };

  const handleConfirmLogin = () => {
    if (isCustomMode) {
      const enteredId = customId.trim() || 'user_' + Date.now();
      const isAdmin = ADMIN_DISCORD_IDS.includes(enteredId);
      const newUser = {
        id: enteredId,
        username: customName.trim() || `DiscordUser_${enteredId.slice(-4)}`,
        discriminator: '0',
        avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80`,
        role: isAdmin ? 'VIP Admin Streamer' : 'Sinema İzleyicisi',
        badge: isAdmin ? '👑 Admin' : '🎬 İzleyici',
        isAdmin
      };
      onLogin(newUser);
    } else {
      onLogin({
        ...selectedPreset,
        isAdmin: true
      });
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--discord-blurple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LogIn size={24} color="white" />
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: '800' }}>Discord Girişi</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Gerçek Discord hesabınızla oturum açın</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
        </div>

        {/* Real Discord OAuth2 Primary Button */}
        <div style={{ background: 'linear-gradient(135deg, #5865F2 0%, #404EED 100%)', padding: '16px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center' }}>
          <button
            onClick={handleRealDiscordOAuth}
            style={{
              width: '100%',
              background: 'white',
              color: '#5865F2',
              border: 'none',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '0.95rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.3)'
            }}
          >
            <ShieldCheck size={20} color="#5865F2" />
            Discord İle Giriş Yap (Gerçek OAuth2)
          </button>
          <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.8)', marginTop: '8px' }}>
            Discord profil resminiz ve kullanıcı kimliğiniz otomatik çekilir.
          </p>
        </div>

        {/* Authorized Admin User IDs Section */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <Crown size={16} color="var(--accent-gold)" /> Yetkili Yayıncı Admin Hesapları (Özel ID'ler):
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {ADMIN_PRESETS.map((user) => {
              const isSelected = !isCustomMode && selectedPreset.id === user.id;
              return (
                <div
                  key={user.id}
                  onClick={() => { setSelectedPreset(user); setIsCustomMode(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: isSelected ? 'rgba(88, 101, 242, 0.25)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isSelected ? 'var(--discord-blurple)' : 'rgba(255,255,255,0.08)'}`,
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={user.avatar} alt={user.username} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{user.username}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>ID: {user.id}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', background: 'var(--accent-gold)', color: 'black', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>
                    👑 Yayın Yetkili Admin
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Discord User ID input */}
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '10px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div 
            onClick={() => setIsCustomMode(!isCustomMode)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
          >
            <span style={{ fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={16} color="var(--accent-pink)" /> Kendi Discord User ID'nizi Girin
            </span>
            <input type="checkbox" checked={isCustomMode} onChange={() => {}} />
          </div>

          {isCustomMode && (
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                type="text"
                placeholder="Discord User ID (Örn: 102225960337670144)"
                value={customId}
                onChange={(e) => setCustomId(e.target.value)}
                style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', color: 'white', fontSize: '0.85rem' }}
              />
              <input
                type="text"
                placeholder="Kullanıcı Adı"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', color: 'white', fontSize: '0.85rem' }}
              />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button className="btn-cinema" onClick={onClose}>İptal</button>
          <button className="btn-cinema primary" onClick={handleConfirmLogin}>
            <Check size={16} /> Devam Et
          </button>
        </div>
      </div>
    </div>
  );
}
