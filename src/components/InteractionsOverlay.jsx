import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Popcorn, Heart, Flame, Sparkles, Volume2, Clapperboard } from 'lucide-react';
import { sounds } from '../utils/soundUtils';

export function InteractionsOverlay({ activeReactions, onTriggerReaction, mySeatCode }) {

  const handlePopcornSnack = () => {
    sounds.playPopcornCrunch();
    onTriggerReaction('🍿');
  };

  const handleApplause = () => {
    sounds.playApplause();
    onTriggerReaction('👏');
  };

  const handleConfetti = () => {
    sounds.playEmojiPop();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.8 }
    });
    onTriggerReaction('🎉');
  };

  return (
    <>
      {/* Floating Emojis Layer */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 60, overflow: 'hidden' }}>
        {activeReactions.map((reaction) => (
          <div
            key={reaction.id}
            className="floating-reaction"
            style={{
              left: `${reaction.x}%`,
              bottom: `${reaction.y}%`
            }}
          >
            {reaction.emoji}
          </div>
        ))}
      </div>

      {/* Floating Bottom Action Dock */}
      <div className="cinema-controls-deck">
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Interactions:
        </span>

        <button className="btn-cinema" onClick={handlePopcornSnack} title="Mısır Ye">
          <Popcorn size={16} color="var(--accent-gold)" /> Mısır Ye
        </button>

        <button className="btn-cinema" onClick={handleApplause} title="Alkışla">
          <Sparkles size={16} color="var(--discord-yellow)" /> Alkışla
        </button>

        <button className="btn-cinema" onClick={() => { sounds.playEmojiPop(); onTriggerReaction('❤️'); }}>
          <Heart size={16} color="var(--accent-pink)" /> Kalp
        </button>

        <button className="btn-cinema" onClick={() => { sounds.playEmojiPop(); onTriggerReaction('🔥'); }}>
          <Flame size={16} color="#f97316" /> Alev
        </button>

        <button className="btn-cinema primary" onClick={handleConfetti}>
          🎉 Kutla
        </button>
      </div>
    </>
  );
}
