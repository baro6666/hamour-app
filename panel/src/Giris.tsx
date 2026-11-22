import { useState } from 'react';
import { hataMetni, sb } from './supabase';

export function Giris() {
  const [eposta, setEposta] = useState('');
  const [sifre, setSifre] = useState('');
  const [bekliyor, setBekliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  return (
    <div className="sayfa dar" style={{ paddingTop: 60 }}>
      <form className="kart" onSubmit={async (e) => {
        e.preventDefault(); setBekliyor(true); setHata(null);
        const r = await sb.auth.signInWithPassword({ email: eposta.trim(), password: sifre });
        if (r.error) setHata(hataMetni(r.error));
        setBekliyor(false);
      }}>
        <h1>Hamour personel girişi</h1>
        <p className="soluk">Kasada indirim okutma; kampanya, duyuru ve personel yönetimi.</p>
        <label className="alan">E-posta<input type="email" autoComplete="username" required value={eposta} onChange={(e) => setEposta(e.target.value)} /></label>
        <label className="alan">Şifre<input type="password" autoComplete="current-password" required value={sifre} onChange={(e) => setSifre(e.target.value)} /></label>
        {hata ? <p className="mesaj hata" role="alert">{hata}</p> : null}
        <button className="dugme buyuk" disabled={bekliyor}>{bekliyor ? 'Giriş yapılıyor…' : 'Giriş yap'}</button>
      </form>
    </div>
  );
}
