const musicNotesStyles = `
  .pixel-art {
    fill: currentColor;
  }
  .note {
    transform-origin: 50px 50px;
    animation: pixelBob 4s ease-in-out infinite;
  }
  .particle {
    opacity: 0;
    transform-origin: center;
  }
  .p1 { animation: floatUpLeft 3s ease-in-out infinite 0.2s; }
  .p2 { animation: floatUpLeft 3.5s ease-in-out infinite 1.5s; }
  .p3 { animation: floatUpRight 3s ease-in-out infinite 0.8s; }
  .p4 { animation: floatUpRight 4s ease-in-out infinite 2s; }
  @keyframes pixelBob {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
  }
  @keyframes floatUpLeft {
    0% { transform: translate(0, 0); opacity: 0; }
    40% { transform: translate(-4px, -6px); opacity: 1; }
    100% { transform: translate(-8px, -12px); opacity: 0; }
  }
  @keyframes floatUpRight {
    0% { transform: translate(0, 0); opacity: 0; }
    40% { transform: translate(4px, -6px); opacity: 1; }
    100% { transform: translate(8px, -12px); opacity: 0; }
  }
`;

export interface MusicNotesAnimatedProps {
  /** Size in pixels (square). Ignored if width/height are set. */
  size?: number;
  /** Width in pixels or CSS value (e.g. "100%"). */
  width?: number | string;
  /** Height in pixels or CSS value (e.g. "100%"). */
  height?: number | string;
  className?: string;
}

export function MusicNotesAnimated({
  size,
  width,
  height,
  className,
}: MusicNotesAnimatedProps = {}) {
  const w = width ?? (size ?? "100%");
  const h = height ?? (size ?? "100%");

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <style dangerouslySetInnerHTML={{ __html: musicNotesStyles }} />

      <g className="pixel-art">
        <rect className="particle p1" x="18" y="55" width="6" height="6" />
        <rect className="particle p2" x="24" y="40" width="4" height="4" />
        <rect className="particle p3" x="82" y="45" width="6" height="6" />
        <rect className="particle p4" x="76" y="32" width="4" height="4" />

        <g className="note">
          <rect x="22" y="64" width="16" height="12" />
          <rect x="18" y="68" width="4" height="4" />
          <rect x="58" y="52" width="16" height="12" />
          <rect x="54" y="56" width="4" height="4" />
          <rect x="34" y="28" width="6" height="48" />
          <rect x="70" y="16" width="6" height="48" />
          <rect x="34" y="28" width="16" height="6" />
          <rect x="46" y="22" width="16" height="6" />
          <rect x="58" y="16" width="18" height="6" />
        </g>
      </g>
    </svg>
  );
}