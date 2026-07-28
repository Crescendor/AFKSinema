import React, { useState } from 'react';
import { Shield, UserX, ArrowRightLeft, Coins, Ban, Check, X } from 'lucide-react';

export function AdminControlsModal({
  isOpen,
  onClose,
  targetUser,
  currentSeatCode,
  availableSeats,
  onMoveUser,
  onKickUser,
  onGrantCredits
}) {
  const [selectedNewSeat, setSelectedNewSeat] = useState('');
  const [kickDuration, setKickDuration] = useState('5');
  const [grantAmount, setGrantAmount] = useState(50);

  if (!isOpen || !targetUser) return null;

  const handleMoveSubmit = (e) => {
    e.preventDefault();
    if (!selectedNewSeat) return;
    onMoveUser(targetUser.id, currentSeatCode, selectedNewSeat);
    onClose();
  };

  const handleKickSubmit = () => {
    const isPerm = kickDuration === 'perm';
    const durationMinutes = isPerm ? 0 : parseInt(kickDuration);
    onKickUser(targetUser, durationMinutes, isPerm);
    onClose();
  };

  const handleGrantCreditsSubmit = (e) => {
    e.preventDefault();
    const amount = parseInt(grantAmount);
    if (!amount || amount <= 0) return;
    onGrantCredits(targetUser.id, amount);
    alert(`✅ ${targetUser.username} kullanıcısına ${amount} 🪙 Kredi tanımlandı!`);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100000 }}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={targetUser.avatar} alt={targetUser.username} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--accent-gold)' }} />
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 800 }}>
                {targetUser.username}
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--cinema-red)' }}>
                Koltuk: {currentSeatCode} • {targetUser.role || 'İzleyici'}
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        {/* Section 1: Relocate User */}
        <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px', marginBottom: '12px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <ArrowRightLeft size={16} /> Koltuk Değiştir
          </div>

          <form onSubmit={handleMoveSubmit} style={{ display: 'flex', gap: '8px' }}>
            <select
              value={selectedNewSeat}
              onChange={(e) => setSelectedNewSeat(e.target.value)}
              style={{
                flex: 1,
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: 'white',
                fontSize: '0.85rem'
              }}
            >
              <option value="">Hedef Boş Koltuk...</option>
              {availableSeats.map(seat => (
                <option key={seat} value={seat}>Koltuk {seat}</option>
              ))}
            </select>
            <button type="submit" className="btn-cinema primary" style={{ padding: '8px 14px', fontSize: '0.8rem' }} disabled={!selectedNewSeat}>
              Taşı
            </button>
          </form>
        </div>

        {/* Section 2: Grant Credits */}
        <div style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '12px', padding: '14px', marginBottom: '12px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <Coins size={16} /> Kullanıcıya Kredi Ver
          </div>

          <form onSubmit={handleGrantCreditsSubmit} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="number"
              placeholder="Miktar"
              value={grantAmount}
              onChange={(e) => setGrantAmount(e.target.value)}
              style={{
                flex: 1,
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: 'white',
                fontSize: '0.85rem'
              }}
            />
            <button type="submit" className="btn-cinema primary" style={{ padding: '8px 14px', fontSize: '0.8rem', background: 'linear-gradient(135deg, #d97706, #b45309)' }}>
              Kredi Tanımla
            </button>
          </form>
        </div>

        {/* Section 3: Kick / Ban User */}
        <div style={{ background: 'rgba(242,63,67,0.1)', border: '1px solid rgba(242,63,67,0.3)', borderRadius: '12px', padding: '14px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--discord-red)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <UserX size={16} /> Kullanıcıyı Odadan At / Banla
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '6px' }}>
              {[
                { label: '5 Dk', val: '5' },
                { label: '15 Dk', val: '15' },
                { label: '1 Saat', val: '60' },
                { label: 'Sınırsız', val: 'perm' }
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setKickDuration(opt.val)}
                  style={{
                    background: kickDuration === opt.val ? 'var(--discord-red)' : 'rgba(0,0,0,0.4)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    padding: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleKickSubmit}
            style={{
              width: '100%',
              background: 'var(--discord-red)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Ban size={16} /> {kickDuration === 'perm' ? 'Sınırsız Banla' : `${kickDuration} Dakikalığına At`}
          </button>
        </div>
      </div>
    </div>
  );
}
