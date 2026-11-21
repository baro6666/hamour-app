import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { renk } from '../tema';

// Geçici "H" monogramı. Hamour'un logosu (vektör) gelince buraya konacak.
export function Logo({ boy = 40, renkKodu = renk.ana }: { boy?: number; renkKodu?: string }) {
  return (
    <Svg width={boy} height={boy} viewBox="0 0 48 48" accessibilityLabel="Hamour logosu">
      <Circle cx={24} cy={24} r={22.5} fill="none" stroke={renkKodu} strokeWidth={2} />
      <SvgText x={24} y={32.5} fontSize={25} fontWeight="700" fill={renkKodu} textAnchor="middle" fontFamily="Georgia, serif">H</SvgText>
    </Svg>
  );
}
