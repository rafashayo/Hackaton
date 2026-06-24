import type { SVGProps } from 'react';
import icons from './icon-data';

export type IconName = keyof typeof icons;

export interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number | string;
}

export function Icon({ name, size = 24, ...rest }: IconProps) {
  const d = icons[name as IconName];
  if (!d) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox={d.viewBox}
      fill="none"
      style={{ display: 'block' }}
      // body strings are emitter-controlled <path> markup — geometry,
      // numeric fills and transforms only; no authored text reaches them.
      dangerouslySetInnerHTML={{ __html: d.body }}
      {...rest}
    />
  );
}

export default Icon;
