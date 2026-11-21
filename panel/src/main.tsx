import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { Giris } from './Giris';
import { Kasa } from './Kasa';
import { OturumSaglayici, useOturum } from './Oturum';
import { sb } from './supabase';
import './stil.css';
import { Yonetim } from './yonetim/Yonetim';

function Logo({ boy = 28 }: { boy?: number }) {
  // Geçici "H" monogramı; Hamour logosu gelince değişecek
  return (
    <svg width={boy} height={boy} viewBox="0 0 48 48" role="img" aria-label="Hamour">
      <circle cx="24" cy="24" r="22.5" fill="none" stroke="#EFE2CC" strokeWidth="2" />
      <text x="24" y="32.5" fontSize="25" fontWeight="700" fill="#EFE2CC" textAnchor="middle" fontFamily="Georgia, serif">H</text>
    </svg>
  );
}

async function sifreDegistir() {
  const yeni = prompt('Yeni şifreniz (en az 8 karakter):');
  if (!yeni) return;
  if (yeni.length < 8) { alert('Şifre en az 8 karakter olmalı.'); return; }
  const r = await sb.auth.updateUser({ password: yeni });
  alert(r.error ? 'Şifre değiştirilemedi: ' + r.error.message : 'Şifreniz değiştirildi.');
}

function Uygulama() {
  const { hazir, oturum, personel, cikis } = useOturum();
  if (!hazir) return <div className="sayfa"><p className="soluk">Yükleniyor…</p></div>;
  if (!oturum) return <Giris />;
  if (!personel) {
    return (
      <div className="sayfa dar">
        <div className="kart">
          <h2>Bu hesap personel değil</h2>
          <p className="soluk">Kasa ve yönetim ekranları yalnız Hamour personeli içindir. Yöneticinizden hesabınızı eklemesini isteyin.</p>
          <button className="dugme cizgi" onClick={cikis}>Çıkış</button>
        </div>
      </div>
    );
  }
  const yonetici = personel.rol === 'yonetici';
  return (
    <>
      <header className="ust">
        <div className="marka"><Logo /> Hamour</div>
        <nav aria-label="Bölümler">
          <NavLink to="/kasa" className={({ isActive }) => (isActive ? 'etkin' : '')}>Damga ver</NavLink>
          {yonetici ? <NavLink to="/yonetim" className={({ isActive }) => (isActive ? 'etkin' : '')}>Yönetim</NavLink> : null}
        </nav>
        <div className="kim">{personel.ad} · {yonetici ? 'Yönetici' : 'Kasiyer'}
          <button className="dugme kucuk krem" onClick={sifreDegistir}>Şifre</button>
          <button className="dugme kucuk krem" onClick={cikis}>Çıkış</button></div>
      </header>
      <Routes>
        <Route path="/kasa" element={<Kasa />} />
        {yonetici ? <Route path="/yonetim/*" element={<Yonetim />} /> : null}
        <Route path="*" element={<Navigate to={yonetici ? '/yonetim' : '/kasa'} replace />} />
      </Routes>
    </>
  );
}

createRoot(document.getElementById('kok')!).render(
  <StrictMode>
    <OturumSaglayici>
      <HashRouter><Uygulama /></HashRouter>
    </OturumSaglayici>
  </StrictMode>,
);
