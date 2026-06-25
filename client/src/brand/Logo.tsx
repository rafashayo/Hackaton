import Icon from './Icon';

/* Monograma "DC" de Discere (viewBox 227 × 90.837 → relación ~2.5:1).
   Se renderiza respetando el aspecto natural a partir de una altura. */
const RATIO = 227 / 90.837;

export function DiscereMark({ size = 32, color }: { size?: number; color?: string }) {
  return (
    <Icon
      name="Group4"
      width={Math.round(size * RATIO)}
      height={size}
      style={{ display: 'block', color }}
    />
  );
}

export function DiscereLogo({
  size = 30,
  wordmark = false,
}: {
  size?: number;
  wordmark?: boolean;
}) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 11 }}>
      <span
        style={{
          width: Math.round(size * 1.34),
          height: Math.round(size * 1.34),
          borderRadius: Math.round(size * 0.42),
          background: 'var(--navy)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 'none',
        }}
      >
        <DiscereMark size={Math.round(size * 0.62)} color="var(--cream-deep)" />
      </span>
      {wordmark && (
        <span
          style={{
            fontFamily: "'Fredoka', sans-serif",
            fontWeight: 600,
            fontSize: size * 0.78,
            color: 'var(--ink)',
            letterSpacing: '-0.01em',
          }}
        >
          Discere
        </span>
      )}
    </span>
  );
}

export default DiscereLogo;
