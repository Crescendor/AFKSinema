import React, { useState } from 'react';
import { Coffee, Play, X, Clock, Flame } from 'lucide-react';

const PRESET_MOLAS = [
  '🚽 Çiş Molası',
  '🚬 Sigara Molası',
  '🍿 Mısır & İçecek Molası',
  '☕ Kahve Molası',
  '🍕 Yemek Molası'
];

export function MolaModal({ isOpen, onClose, onStartMola }) {
  const [customTitle, setCustomTitle] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('🚽 Çiş Molası');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const title = customTitle.trim() || selectedPreset;
    onStartMola(title);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100000 }}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--cinema-red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Coffee size={22} color="white" />
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 800 }}>
                Sinema Molası Başlat
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Tüm izleyicilerin ekranında mola duyurusu açılır
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Preset Buttons */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
              Hazır Mola Türü Seçin:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {PRESET_MOLAS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => { setSelectedPreset(preset); setCustomTitle(''); }}
                  style={{
                    background: selectedPreset === preset && !customTitle ? 'var(--cinema-red)' : 'rgba(255,255,255,0.06)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Input */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
              Veya Özel Mola Başlığı Yazın:
            </label>
            <input
              type="text"
              placeholder="Örn: 5 Dakika Teknik Mola"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid var(--bg-card-border)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: 'white',
                fontSize: '0.85rem'
              }}
            />
          </div>

          <button
            type="submit"
            className="btn-cinema primary"
            style={{ width: '100%', padding: '10px', justifyContent: 'center', fontSize: '0.9rem', borderRadius: '10px' }}
          >
            <Play size={16} /> Molayı Başlat
          </button>
        </form>
      </div>
    </div>
  );
}
