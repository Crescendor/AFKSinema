import React, { useState } from 'react';
import { User, LogOut, Check, X, EyeOff, Coins } from 'lucide-react';

export function UserProfileModal({
  isOpen,
  onClose,
  currentUser,
  onUpdateNickname,
  onLogout,
  isAdmin,
  hiddenBadges = {},
  onToggleHideBadge,
  userCredits = {}
}) {
  const [nickname, setNickname] = useState(currentUser?.username || '');

  if (!isOpen || !currentUser) return null;

  const handleSave = (e) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    onUpdateNickname(nickname.trim());
    onClose();
  };

  const isBadgeHidden = !!hiddenBadges[currentUser.id];

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100000 }}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', padding: '28px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User size={22} color="var(--cinema-red)" />
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 800 }}>
              Profil Ayarları
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        {/* User Card Info */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid var(--bg-card-border)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <img
            src={currentUser.avatar}
            alt={currentUser.username}
            style={{ width: '72px', height: '72px', borderRadius: '50%', border: '3px solid var(--cinema-red)', objectFit: 'cover' }}
          />

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              {currentUser.username}
              {isAdmin && <span style={{ fontSize: '0.7rem', background: 'var(--accent-gold)', color: 'black', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>👑 ADMIN</span>}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {currentUser.role || 'Sinema İzleyicisi'}
            </div>

            <div style={{
              marginTop: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(251, 191, 36, 0.15)',
              border: '1px solid var(--accent-gold)',
              color: 'var(--accent-gold)',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.82rem',
              fontWeight: 800
            }}>
              <Coins size={15} /> Bakiyeniz: {isAdmin ? 'Sınırsız (∞)' : `${userCredits[currentUser.id] ?? 50} 🪙 Kredi`}
            </div>
          </div>
        </div>

        {/* Edit Nickname Form */}
        <form onSubmit={handleSave} style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
            Sinema İsmini Değiştir:
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={25}
              style={{
                flex: 1,
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid var(--bg-card-border)',
                borderRadius: '8px',
                padding: '10px 12px',
                color: 'white',
                fontSize: '0.88rem',
                fontWeight: 700,
                outline: 'none'
              }}
            />
            <button type="submit" className="btn-cinema primary" style={{ padding: '10px 14px', fontSize: '0.8rem' }}>
              <Check size={16} /> Kaydet
            </button>
          </div>
        </form>

        {/* Badge Privacy Toggle Option */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <EyeOff size={15} color="var(--accent-gold)" /> Rozetimi Sohbette Gizle
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Aktifleştirirseniz rozetiniz sohbet ve listede saklanır.
              </div>
            </div>
            <input
              type="checkbox"
              checked={isBadgeHidden}
              onChange={() => onToggleHideBadge && onToggleHideBadge(currentUser.id)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--cinema-red)', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          style={{
            width: '100%',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            color: '#ef4444',
            borderRadius: '10px',
            padding: '12px',
            fontSize: '0.9rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <LogOut size={16} /> Güvenli Çıkış Yap
        </button>
      </div>
    </div>
  );
}
