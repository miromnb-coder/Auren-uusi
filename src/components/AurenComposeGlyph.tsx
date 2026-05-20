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
  strokeWidth = 2.38,
}: AurenComposeGlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <Path
        d="M16.9 13.45 C11.5 13.55 7.75 17.25 7.75 21.75 C7.75 26.95 12.15 29.75 18.35 29.75 C24.85 29.75 29.2 26.7 29.2 21.45 C29.2 19.4 28.45 17.75 27.1 16.55"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M17.55 20.15 C19.25 18.05 21.95 15.1 25.25 11.8 C27.8 9.25 30.35 8.05 31.55 9.35 C32.75 10.65 31.25 13.2 28.35 15.85 C24.75 19.15 20.95 21.1 17.55 20.15"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
