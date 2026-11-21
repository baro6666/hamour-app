import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { Duyurular } from './Duyurular';
import { Kural } from './Kural';
import { Ozet } from './Ozet';
import { Personel } from './Personel';
import { Puanlar } from './Puanlar';
import { Talepler } from './Talepler';
import { Urunler } from './Urunler';
import { Uyeler } from './Uyeler';

const SEKMELER = [
  ['ozet', 'Özet', Ozet], ['urunler', 'Ürünler ve vitrin', Urunler], ['duyurular', 'Duyurular', Duyurular],
  ['talepler', 'Ön sipariş talepleri', Talepler], ['puanlar', 'Ziyaret puanları', Puanlar], ['uyeler', 'Üyeler', Uyeler],
  ['kural', 'Kahve kartı kuralı', Kural], ['personel', 'Personel', Personel],
] as const;

export function Yonetim() {
  return (
    <div className="sayfa">
      <nav aria-label="Yönetim bölümleri" className="secim">
        {SEKMELER.map(([yol, ad]) => (
          <NavLink key={yol} to={`/yonetim/${yol}`} style={{ textDecoration: 'none' }}>
            {({ isActive }) => <button tabIndex={-1} aria-pressed={isActive}>{ad}</button>}
          </NavLink>
        ))}
      </nav>
      <Routes>
        {SEKMELER.map(([yol, , Bilesen]) => <Route key={yol} path={yol} element={<Bilesen />} />)}
        <Route path="*" element={<Navigate to="ozet" replace />} />
      </Routes>
    </div>
  );
}
