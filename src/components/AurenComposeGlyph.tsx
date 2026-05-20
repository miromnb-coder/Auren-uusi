import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme';

type AurenComposeGlyphProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export function AurenComposeGlyph({
  size = 30,
  color = colors.icon,
  strokeWidth = 2.45,
}: AurenComposeGlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <Path
        d="M16.35 12.9 C11.1 13.05 7.35 16.75 7.35 21.35 C7.35 26.45 11.55 29.4 17.95 29.4 C24.55 29.4 29.15 26.35 29.15 21.35 C29.15 18.55 27.9 16.35 25.55 14.95"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M17.55 20.2 C20.6 16.95 23.4 14.05 26.75 10.65 C29.45 7.9 32.1 7.85 32.55 9.75 C33 11.7 30.65 14.35 27.25 17.05 C23.65 19.9 20.35 21.25 17.55 20.2 Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
