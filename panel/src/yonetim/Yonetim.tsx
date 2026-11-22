import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { Duyurular } from './Duyurular';
import { Kampanyalar } from './Kampanyalar';
import { Personel } from './Personel';

const SEKMELER = [
  // Menü hamour.com.tr/tr/menu/'den uygulamaya otomatik gelir; panelde menü düzenlenmez.
  ['kampanyalar', 'Kampanyalar', Kampanyalar], ['duyurular', 'Duyurular', Duyurular], ['personel', 'Personel', Personel],
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
        <Route path="*" element={<Navigate to="kampanyalar" replace />} />
      </Routes>
    </div>
  );
}
