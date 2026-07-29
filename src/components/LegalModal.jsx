import React from 'react';
import { ShieldCheck, FileText, X, Lock, CheckCircle2 } from 'lucide-react';

export function LegalModal({ isOpen, onClose, type }) {
  if (!isOpen || !type) return null;

  const isPrivacy = type === 'privacy';

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100000 }}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '28px',
          background: 'rgba(15, 6, 12, 0.96)',
          backdropFilter: 'blur(24px)',
          border: '1px solid var(--bg-card-border)',
          borderRadius: '20px'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isPrivacy ? <ShieldCheck size={26} color="var(--cinema-red)" /> : <FileText size={26} color="var(--accent-gold)" />}
            <div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>
                {isPrivacy ? 'Gizlilik Politikası (Privacy Policy)' : 'Kullanım Koşulları (Terms of Service)'}
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                AFK Sinema • Son Güncelleme: 30 Temmuz 2026
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px' }}><X size={20} /></button>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
          {isPrivacy ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.3)', padding: '12px 16px', borderRadius: '12px', color: 'white' }}>
                <strong style={{ color: 'var(--cinema-red)' }}>🔒 Gizliliğiniz Bizim İçin Önemlidir:</strong> AFK Sinema, kullanıcılarının kişisel gizliliğine ve veri güvenliğine en yüksek düzeyde önem vermektedir. Bu politika, hangi verilerin toplandığını ve nasıl korunduğunu açıklar.
              </div>

              <section>
                <h4 style={{ color: 'white', fontWeight: 800, marginBottom: '6px', fontSize: '0.95rem' }}>1. Toplanan Veriler</h4>
                <p>AFK Sinema uygulamasına Discord veya misafir oturumu ile katıldığınızda yalnızca aşağıdaki temel veriler işlenir:</p>
                <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
                  <li><strong>Discord Profil Bilgileri:</strong> Discord User ID, Kullanıcı Adı ve Profil Fotoğrafı URL'si (Discord OAuth2 / Embedded App SDK aracılığıyla).</li>
                  <li><strong>Oda ve Sohbet Verileri:</strong> Sinema salonunda seçtiğiniz koltuk kodu, anlık sohbet mesajları ve gönderdiğiniz emoji tepkileri.</li>
                  <li><strong>Kullanıcı Tercihleri:</strong> Özel rozet tercihleri ve bakiye verileri.</li>
                </ul>
              </section>

              <section>
                <h4 style={{ color: 'white', fontWeight: 800, marginBottom: '6px', fontSize: '0.95rem' }}>2. Verilerin Kullanım Amacı</h4>
                <p>Toplanan veriler yalnızca sanal sinema deneyimini sağlamak amacıyla kullanılır:</p>
                <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
                  <li>Sinema salonundaki koltukların gerçek zamanlı senkronizasyonu.</li>
                  <li>Kullanıcılar arası canlı sohbet ve tepki etkileşimi.</li>
                  <li>Uygulama içi bakiye ve VIP erişim haklarının doğrulanması.</li>
                </ul>
              </section>

              <section>
                <h4 style={{ color: 'white', fontWeight: 800, marginBottom: '6px', fontSize: '0.95rem' }}>3. Veri Güvenliği ve Üçüncü Taraflar</h4>
                <p>Toplanan veriler kesinlikle 3. şahıslarla paylaşılmaz, satılmaz veya reklam amacıyla kullanılmaz. Veriler Cloudflare Edge güvenli altyapısında daireselSQLite ortamında saklanır.</p>
              </section>

              <section>
                <h4 style={{ color: 'white', fontWeight: 800, marginBottom: '6px', fontSize: '0.95rem' }}>4. Veri Silme ve İletişim</h4>
                <p>Dilediğiniz zaman profil sayfanızdan oturumunuzu kapatabilir veya verilerinizin tamamen silinmesi için yöneticilerimizle iletişime geçebilirsiniz.</p>
              </section>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', padding: '12px 16px', borderRadius: '12px', color: 'white' }}>
                <strong style={{ color: 'var(--accent-gold)' }}>📜 Kullanım Şartları:</strong> AFK Sinema platformunu kullanarak aşağıdaki kullanım koşullarını kabul etmiş sayılırsınız.
              </div>

              <section>
                <h4 style={{ color: 'white', fontWeight: 800, marginBottom: '6px', fontSize: '0.95rem' }}>1. Hizmet Tanımı</h4>
                <p>AFK Sinema, Discord toplulukları için geliştirilmiş sanal sinema salonu ve canlı medya akış senkronizasyon platformudur.</p>
              </section>

              <section>
                <h4 style={{ color: 'white', fontWeight: 800, marginBottom: '6px', fontSize: '0.95rem' }}>2. Topluluk ve Sohbet Kuralları</h4>
                <p>Sinema salonunda tüm kullanıcıların huzurlu ve keyifli vakit geçirmesi esastır. Aşağıdaki davranışlar kesinlikle yasaktır:</p>
                <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
                  <li>Nefret söylemi, ırkçılık, cinsiyetçilik ve hakaret içeren mesajlar göndermek.</li>
                  <li>Spam veya reklam amaçlı bağlantılar paylaşmak.</li>
                  <li>Sinema düzenini ve yayın akışını kasıtlı olarak bozmaya çalışmak.</li>
                </ul>
              </section>

              <section>
                <h4 style={{ color: 'white', fontWeight: 800, marginBottom: '6px', fontSize: '0.95rem' }}>3. Yaptırımlar</h4>
                <p>Kuralları ihlal eden kullanıcılar salon yöneticileri (Adminler) tarafından süreli veya sınırsız olarak sinema salonundan uzaklaştırılabilir.</p>
              </section>

              <section>
                <h4 style={{ color: 'white', fontWeight: 800, marginBottom: '6px', fontSize: '0.95rem' }}>4. Sorumluluk Reddi</h4>
                <p>AFK Sinema platformunda paylaşılan canlı medya yayınlarının mülkiyeti ilgili içerik üreticilerine ve yayıncılara aittir. AFK Sinema sadece teknik altyapı sağlayıcısıdır.</p>
              </section>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '18px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-cinema primary" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
            <CheckCircle2 size={16} /> Anladım ve Kabul Ediyorum
          </button>
        </div>
      </div>
    </div>
  );
}
