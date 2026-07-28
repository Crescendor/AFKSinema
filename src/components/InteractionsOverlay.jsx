import React from 'react';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/soundUtils';

export function InteractionsOverlay({
  activeReactions,
  onTriggerReaction,
  mySeatCode,
  mySnacks = {},
  onConsumePopcorn
}) {
  const handleConfetti = () => {
    sounds.playApplause();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.7 }
    });
  };

  // Check if popcorn is present in left or right snack slot
  const hasPopcorn = (mySnacks.left?.icon === '🍿' || mySnacks.left?.icon === '👑') ||
                    (mySnacks.right?.icon === '🍿' || mySnacks.right?.icon === '👑');

  const handleEatPopcornClick = () => {
    if (!hasPopcorn) {
      alert('🍿 MISIRINIZ YOK:\nMısır yemek için önce Sinema Büfesi\'nden mısır satın almalısınız!');
      return;
    }

    sounds.playPopcornCrunch();
    onTriggerReaction('🍿');
    if (onConsumePopcorn) onConsumePopcorn();
  };

  return (
    <>
      {/* Active Floating Reactions over seats */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 60, overflow: 'hidden' }}>
        {activeReactions.map((r) => (
          <div
            key={r.id}
            className="floating-reaction"
            style={{ left: `${r.x}%`, top: '60%' }}
          >
            {r.emoji}
          </div>
        ))}
      </div>

      {/* Interactive Quick Deck at bottom of screen */}
      <div className="cinema-controls-deck" style={{ position: 'relative', zIndex: 45 }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dim)', marginRight: '4px' }}>
          Tepkiler:
        </span>

        {/* Popcorn Eat button requires Popcorn in Inventory */}
        <button
          className="btn-cinema"
          onClick={handleEatPopcornClick}
          style={{ opacity: hasPopcorn ? 1 : 0.65, border: hasPopcorn ? '1px solid var(--accent-gold)' : '1px solid rgba(255,255,255,0.1)' }}
          title={hasPopcorn ? 'Mısır Ye! 🍿' : 'Mısırınız yok! Büfeden satın alın.'}
        >
          🍿 {hasPopcorn ? 'Mısır Ye' : 'Mısır Al (Büfe)'}
        </button>

        <button className="btn-cinema" onClick={() => { sounds.playApplause(); onTriggerReaction('👏'); }}>
          👏 Alkışla
        </button>

        <button className="btn-cinema" onClick={() => { sounds.playEmojiPop(); onTriggerReaction('❤️'); }}>
          ❤️ Kalp At
        </button>

        <button className="btn-cinema" onClick={() => { sounds.playEmojiPop(); onTriggerReaction('🔥'); }}>
          🔥 Hype
        </button>

        <button className="btn-cinema" onClick={() => { sounds.playEmojiPop(); onTriggerReaction('😱'); }}>
          😱 Şaşır
        </button>

        <button className="btn-cinema primary" onClick={handleConfetti} style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', color: 'black' }}>
          🎉 Konfeti Patlat!
        </button>
      </div>
    </>
  );
}
