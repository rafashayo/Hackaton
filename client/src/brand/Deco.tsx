/* Capa decorativa de íconos de materias flotando al fondo de cada pantalla.
   Réplica de las "safe zones" del diseño de marca Discere. */

export type DecoItem = {
  src: string;
  left: number;
  top: number;
  width: number;
  rotate: number;
};

const A = '/brand/deco/';

export const decoSets: Record<string, DecoItem[]> = {
  inicio: [
    { src: 'gown', left: 792, top: 90, width: 118, rotate: 8 },
    { src: 'sport', left: 1096, top: 118, width: 108, rotate: -6 },
    { src: 'palette', left: 980, top: 210, width: 84, rotate: 12 },
    { src: 'math', left: -40, top: 392, width: 150, rotate: 6 },
    { src: 'science', left: 296, top: 452, width: 76, rotate: -7 },
    { src: 'code', left: 80, top: 792, width: 148, rotate: 5 },
    { src: 'drama', left: 436, top: 776, width: 176, rotate: 2 },
    { src: 'literature', left: 772, top: 792, width: 120, rotate: -8 },
    { src: 'trophy', left: 286, top: 556, width: 96, rotate: 8 },
    { src: 'literature', left: -26, top: 600, width: 118, rotate: -6 },
  ],
  senda: [
    { src: 'math', left: 560, top: 196, width: 180, rotate: 8 },
    { src: 'science', left: 792, top: 300, width: 84, rotate: -8 },
    { src: 'code', left: 600, top: 432, width: 150, rotate: 6 },
    { src: 'palette', left: 828, top: 470, width: 90, rotate: 10 },
    { src: 'drama', left: 556, top: 598, width: 172, rotate: -4 },
    { src: 'literature', left: 804, top: 648, width: 118, rotate: 8 },
    { src: 'trophy', left: 706, top: 300, width: 100, rotate: 6 },
  ],
  leccion: [
    { src: 'math', left: -34, top: 150, width: 170, rotate: -8 },
    { src: 'science', left: 70, top: 360, width: 82, rotate: 8 },
    { src: 'code', left: -6, top: 548, width: 148, rotate: 5 },
    { src: 'literature', left: 84, top: 600, width: 116, rotate: -6 },
    { src: 'palette', left: 1086, top: 150, width: 90, rotate: 10 },
    { src: 'gown', left: 1066, top: 300, width: 110, rotate: 6 },
    { src: 'sport', left: 1150, top: 430, width: 96, rotate: -6 },
    { src: 'math', left: 1086, top: 548, width: 150, rotate: -5 },
    { src: 'trophy', left: 40, top: 430, width: 96, rotate: 7 },
    { src: 'drama', left: 1116, top: 680, width: 150, rotate: 4 },
  ],
  recompensa: [
    { src: 'sport', left: 56, top: 150, width: 120, rotate: -10 },
    { src: 'math', left: -30, top: 330, width: 170, rotate: 7 },
    { src: 'palette', left: 120, top: 548, width: 118, rotate: 8 },
    { src: 'code', left: 30, top: 730, width: 150, rotate: -5 },
    { src: 'science', left: 1110, top: 150, width: 90, rotate: 10 },
    { src: 'drama', left: 1040, top: 320, width: 172, rotate: -6 },
    { src: 'literature', left: 1120, top: 560, width: 120, rotate: -8 },
    { src: 'gown', left: 1080, top: 736, width: 114, rotate: 5 },
  ],
  panel: [
    { src: 'trophy', left: 432, top: 8, width: 86, rotate: -6 },
    { src: 'gown', left: 800, top: 90, width: 108, rotate: -6 },
    { src: 'science', left: 976, top: 116, width: 84, rotate: 10 },
    { src: 'sport', left: 1120, top: 150, width: 96, rotate: -5 },
  ],
  detalle: [
    { src: 'palette', left: 560, top: 14, width: 80, rotate: -8 },
    { src: 'science', left: 700, top: 18, width: 78, rotate: 10 },
    { src: 'trophy', left: 828, top: 8, width: 84, rotate: -5 },
    { src: 'gown', left: 980, top: 14, width: 92, rotate: 6 },
  ],
};

export function DecoLayer({ set }: { set: keyof typeof decoSets }) {
  const items = decoSets[set] ?? [];
  return (
    <div className="deco-layer" aria-hidden>
      {items.map((it, i) => (
        <img
          key={i}
          src={`${A}${it.src}.png`}
          alt=""
          style={{
            position: 'absolute',
            left: it.left,
            top: it.top,
            width: it.width,
            transform: `rotate(${it.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}

export default DecoLayer;
