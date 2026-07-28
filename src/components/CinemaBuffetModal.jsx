import React, { useState } from 'react';
import { ShoppingBag, Coins, Plus, Trash2, Edit3, Check, X, Sparkles, Popcorn } from 'lucide-react';
import { sounds } from '../utils/soundUtils';

export function CinemaBuffetModal({
  isOpen,
  onClose,
  currentUser,
  userCredits,
  userSnacks,
  buffetItems,
  onBuySnack,
  onAddBuffetItem,
  onDeleteBuffetItem,
  isAdmin
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState(30);
  const [newItemIcon, setNewItemIcon] = useState('🍿');
  const [selectedSlot, setSelectedSlot] = useState('left'); // 'left' or 'right' side of avatar

  if (!isOpen) return null;

  const currentBalance = isAdmin ? Infinity : (userCredits[currentUser?.id] || 0);
  const currentSnacks = userSnacks[currentUser?.id] || { left: null, right: null };

  const handleBuy = (item) => {
    if (!isAdmin && currentBalance < item.price) {
      alert(`⚠️ YETERSİZ KREDİ:\nBu ürünü almak için ${item.price} Krediye ihtiyacınız var. Mevcut Krediniz: ${currentBalance}`);
      return;
    }

    sounds.playPopcornCrunch();
    onBuySnack(currentUser.id, item, selectedSlot);
  };

  const handleAddItemSubmit = (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem = {
      id: 'buffet_' + Date.now(),
      name: newItemName.trim(),
      price: parseInt(newItemPrice) || 20,
      icon: newItemIcon.trim() || '🍿'
    };

    onAddBuffetItem(newItem);
    setNewItemName('');
    setNewItemPrice(30);
    setIsEditing(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100000 }}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px', padding: '28px' }}>
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

        {/* Credit Balance & Slot Picker */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid var(--bg-card-border)',
          borderRadius: '14px',
          padding: '12px 16px',
          marginBottom: '20px'
        }}>
          {/* Balance */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Coins size={20} color="var(--accent-gold)" />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Bakiyeniz:</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--accent-gold)' }}>
              {isAdmin ? '👑 ∞ Kredi (Admin)' : `${currentBalance} 🪙`}
            </span>
          </div>

          {/* Slot selector: Left or Right of Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Koyulacak Taraf:</span>
            <button
              onClick={() => setSelectedSlot('left')}
              style={{
                background: selectedSlot === 'left' ? 'var(--cinema-red)' : 'rgba(255,255,255,0.06)',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 10px',
                color: 'white',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              👈 Sol ({currentSnacks.left || 'Boş'})
            </button>
            <button
              onClick={() => setSelectedSlot('right')}
              style={{
                background: selectedSlot === 'right' ? 'var(--cinema-red)' : 'rgba(255,255,255,0.06)',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 10px',
                color: 'white',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Sağ 👉 ({currentSnacks.right || 'Boş'})
            </button>
          </div>
        </div>

        {/* Admin Item Add Bar */}
        {isAdmin && (
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn-cinema"
              onClick={() => setIsEditing(!isEditing)}
              style={{ padding: '6px 12px', fontSize: '0.78rem', background: 'rgba(251, 191, 36, 0.15)', borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)' }}
            >
              <Plus size={14} /> Admin: Yeni Ürün Ekle
            </button>
          </div>
        )}

        {/* Add Item Form */}
        {isAdmin && isEditing && (
          <form onSubmit={handleAddItemSubmit} style={{ background: 'rgba(0,0,0,0.4)', padding: '14px', borderRadius: '12px', marginBottom: '16px', border: '1px dashed var(--accent-gold)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-gold)', marginBottom: '8px' }}>
              👑 Büfeye Yeni Ürün Ekle
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 90px', gap: '8px', marginBottom: '10px' }}>
              <input
                type="text"
                placeholder="Simge (🍿/🥤)"
                value={newItemIcon}
                onChange={(e) => setNewItemIcon(e.target.value)}
                style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '6px', color: 'white', textAlign: 'center' }}
              />
              <input
                type="text"
                placeholder="Ürün Adı (Örn: Cips)"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '6px 10px', color: 'white' }}
              />
              <input
                type="number"
                placeholder="Fiyat 🪙"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
                style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '6px 10px', color: 'white' }}
              />
            </div>
            <button type="submit" className="btn-cinema primary" style={{ width: '100%', padding: '8px', fontSize: '0.8rem', justifyContent: 'center' }}>
              Ürünü Büfeye Ekle
            </button>
          </form>
        )}

        {/* Buffet Items Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', maxHeight: '320px', overflowY: 'auto' }}>
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
                borderRadius: '14px',
                position: 'relative'
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={() => handleBuy(item)}
                  className="btn-cinema primary"
                  style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                >
                  Satın Al
                </button>

                {isAdmin && (
                  <button
                    onClick={() => onDeleteBuffetItem(item.id)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                    title="Ürünü Sil"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
