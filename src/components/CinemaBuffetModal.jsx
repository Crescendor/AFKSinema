import React from 'react';
import { ShoppingBag, Coins, X } from 'lucide-react';
import { sounds } from '../utils/soundUtils';

export function CinemaBuffetModal({
  isOpen,
  onClose,
  currentUser,
  userCredits,
  buffetItems,
  onBuySnack,
  isAdmin
}) {
  if (!isOpen) return null;

  const currentBalance = isAdmin ? Infinity : (userCredits[currentUser?.id] || 0);

  const handleBuy = (item) => {
    if (!isAdmin && currentBalance < item.price) {
      alert(`⚠️ YETERSİZ KREDİ:\nBu ürünü almak için ${item.price} Krediye ihtiyacınız var. Mevcut Krediniz: ${currentBalance}`);
      return;
    }

    sounds.playPopcornCrunch();
    onBuySnack(currentUser.id, item);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100000 }}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px', padding: '28px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--cinema-red), #9f1239)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px var(--cinema-red-glow)' }}>
              <ShoppingBag size={24} color="white" />
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: 900 }}>
                Sinema Büfesi
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Kredilerinizle ikramlık alın, koltuğunuzda avatarınızın yanında görünsün!
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {/* Credit Balance */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid var(--bg-card-border)',
          borderRadius: '14px',
          padding: '12px 16px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Coins size={20} color="var(--accent-gold)" />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Bakiyeniz:</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--accent-gold)' }}>
              {isAdmin ? '👑 ∞ Kredi (Admin)' : `${currentBalance} 🪙`}
            </span>
          </div>
        </div>

        {/* Buffet Items Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', maxHeight: '340px', overflowY: 'auto' }}>
          {buffetItems.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '14px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '2rem' }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{item.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', fontWeight: 700 }}>
                    {item.price} 🪙 Kredi
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleBuy(item)}
                className="btn-cinema primary"
                style={{ padding: '6px 12px', fontSize: '0.75rem' }}
              >
                Satın Al
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
