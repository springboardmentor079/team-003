import { Link } from 'react-router-dom';

interface LogoProps {
  /** Optional mono caption under the wordmark. */
  caption?: string;
  to?: string;
  size?: 'sm' | 'md' | 'lg';
}

const WORDMARK_SIZE: Record<'sm' | 'md' | 'lg', string> = {
  sm: '1.05rem',
  md: '1.3rem',
  lg: '1.6rem',
};

/** BuildTrack mark: two stacked bars plus the wordmark, as in the Figma. */
export function Logo({ caption, to = '/', size = 'md' }: LogoProps) {
  return (
    <Link to={to} className="d-inline-flex align-items-center gap-2 text-decoration-none">
      <span
        className="d-inline-flex flex-column justify-content-center gap-1 flex-shrink-0"
        aria-hidden="true"
        style={{ width: 22 }}
      >
        <span
          style={{
            display: 'block',
            height: 7,
            width: '100%',
            background: 'var(--bt-accent)',
            borderRadius: 2,
          }}
        />
        <span
          style={{
            display: 'block',
            height: 7,
            width: '62%',
            background: 'var(--bt-accent-strong)',
            borderRadius: 2,
          }}
        />
      </span>

      <span className="d-flex flex-column lh-1">
        <span
          className="bt-display"
          style={{ fontSize: WORDMARK_SIZE[size], color: 'var(--bt-text)' }}
        >
          BuildTrack
        </span>
        {caption && (
          <span className="bt-label mt-1" style={{ fontSize: '0.625rem' }}>
            {caption}
          </span>
        )}
      </span>
    </Link>
  );
}
