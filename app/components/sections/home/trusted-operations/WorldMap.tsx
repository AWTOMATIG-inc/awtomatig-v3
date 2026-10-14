import { WORLD_DOTS_HEIGHT, WORLD_DOTS_PATH, WORLD_DOTS_WIDTH } from "./worldDots";
import { MAP_CITIES } from "./trustedOperations";

// The top of the dots fades out so the map never runs into the headline copy (the cyan points stay unfaded)
const FADE_TOP = {
  maskImage: "linear-gradient(to bottom, transparent 4%, black 26%)",
  WebkitMaskImage: "linear-gradient(to bottom, transparent 4%, black 26%)",
};

// Dotted world map (the dots take the text color) with crisp cyan "connected" points; decorative
export default function WorldMap({ className }: { className?: string }) {
  const viewBox = `0 0 ${WORLD_DOTS_WIDTH} ${WORLD_DOTS_HEIGHT}`;
  return (
    <div aria-hidden="true" className={className} style={{ width: WORLD_DOTS_WIDTH, height: WORLD_DOTS_HEIGHT }}>
      <svg viewBox={viewBox} width={WORLD_DOTS_WIDTH} height={WORLD_DOTS_HEIGHT} className="absolute inset-0" style={FADE_TOP}>
        <path d={WORLD_DOTS_PATH} fill="none" stroke="currentColor" strokeWidth="3.1" strokeLinecap="round" />
      </svg>
      <svg viewBox={viewBox} width={WORLD_DOTS_WIDTH} height={WORLD_DOTS_HEIGHT} className="absolute inset-0">
        {MAP_CITIES.map(([x, y]) => (
          <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="2.9" ry="1.7" className="fill-cyan-bright" />
        ))}
      </svg>
    </div>
  );
}
