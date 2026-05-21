import type { ReactNode } from 'react';
import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';

type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

type IconFrameProps = IconProps & {
  children: ReactNode;
};

function IconFrame({ size = 24, color = '#111111', strokeWidth = 2.25, children }: IconFrameProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </Svg>
  );
}

export function Home({ size, color, strokeWidth }: IconProps) {
  return (
    <IconFrame size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M3 10.8 12 3l9 7.8" />
      <Path d="M5.2 9.6V21h5.2v-6.2h3.2V21h5.2V9.6" />
    </IconFrame>
  );
}

export function BookOpen({ size, color, strokeWidth }: IconProps) {
  return (
    <IconFrame size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M3.8 5.2c2.5-.9 4.8-.5 7 1.1.7.5 1.2 1.2 1.2 2.1V21c-2.6-2-5.3-2.6-8.2-1.5V5.2Z" />
      <Path d="M20.2 5.2c-2.5-.9-4.8-.5-7 1.1-.7.5-1.2 1.2-1.2 2.1V21c2.6-2 5.3-2.6 8.2-1.5V5.2Z" />
    </IconFrame>
  );
}

export function SquarePen({ size, color, strokeWidth }: IconProps) {
  return (
    <IconFrame size={size} color={color} strokeWidth={strokeWidth}>
      <Path d="M12 20H5.8A1.8 1.8 0 0 1 4 18.2V6.8A1.8 1.8 0 0 1 5.8 5H12" />
      <Path d="M14.3 18.7 20.4 12.6a2.1 2.1 0 0 0-3-3l-6.1 6.1-.8 3.8 3.8-.8Z" />
      <Path d="m16 11 3 3" />
    </IconFrame>
  );
}

export function Plus({ size, color, strokeWidth }: IconProps) {
  return (
    <IconFrame size={size} color={color} strokeWidth={strokeWidth}>
      <Line x1="12" y1="5" x2="12" y2="19" />
      <Line x1="5" y1="12" x2="19" y2="12" />
    </IconFrame>
  );
}

export function Mic({ size, color, strokeWidth }: IconProps) {
  return (
    <IconFrame size={size} color={color} strokeWidth={strokeWidth}>
      <Rect x="9" y="3" width="6" height="11" rx="3" />
      <Path d="M5 11a7 7 0 0 0 14 0" />
      <Line x1="12" y1="18" x2="12" y2="21" />
      <Line x1="8" y1="21" x2="16" y2="21" />
    </IconFrame>
  );
}

export function ArrowUp({ size, color, strokeWidth }: IconProps) {
  return (
    <IconFrame size={size} color={color} strokeWidth={strokeWidth}>
      <Line x1="12" y1="19" x2="12" y2="5" />
      <Polyline points="5 12 12 5 19 12" />
    </IconFrame>
  );
}

export function CheckCircle({ size, color, strokeWidth }: IconProps) {
  return (
    <IconFrame size={size} color={color} strokeWidth={strokeWidth}>
      <Circle cx="12" cy="12" r="9" />
      <Path d="m8 12.3 2.6 2.6L16.5 9" />
    </IconFrame>
  );
}
