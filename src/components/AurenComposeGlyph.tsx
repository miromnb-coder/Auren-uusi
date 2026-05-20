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
  strokeWidth = 2.85,
}: AurenComposeGlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <Path
        d="M24.55 13.35C27.05 14.65 28.55 16.95 28.55 20.05C28.55 26.25 23.6 30.35 17.1 30.35C10.75 30.35 6.45 27.15 6.45 22.15C6.45 17.9 9.9 15.15 14.55 15.15"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M17.45 18.05L29.55 5.95"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
