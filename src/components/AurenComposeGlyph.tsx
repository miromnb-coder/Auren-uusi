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
  strokeWidth = 2.7,
}: AurenComposeGlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <Path
        d="M16.45 12.25C11.05 12.55 6.75 16.65 6.75 21.8C6.75 27.35 11.6 30.55 18.1 30.55C24.75 30.55 30.25 27.25 31.1 21.45"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M17.2 20.8C18.35 17.4 22.3 13.9 26.6 9.6C29.25 6.95 32.15 8.75 31.3 11.55C30.65 13.65 28.15 16.1 24.9 18.85C21.7 21.55 18.05 22.95 17.2 20.8Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
