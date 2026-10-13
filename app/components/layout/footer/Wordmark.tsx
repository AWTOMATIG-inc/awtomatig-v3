// Optical letter spacing for the footer wordmark. Kerning is off (see `type-wordmark`), and each letter carries the
// space after it in em, so every pair has the same optical gap: measured from the Inter Tight 500 glyph outlines as the
// area between neighbours within 0.1em of their closest approach, then equalised to 0.15em. The diagonal pairs (A-W,
// T-O, A-T) get negative space, the straight ones (W-T, O-M, M-A, I-G) positive, so nothing collides and nothing gaps.
const LETTERS = [
  { char: "A", after: -0.0873 },
  { char: "W", after: 0.036 },
  { char: "T", after: -0.0924 },
  { char: "O", after: 0.0113 },
  { char: "M", after: 0.0059 },
  { char: "A", after: -0.1744 },
  { char: "T", after: -0.018 },
  { char: "I", after: 0.0097 },
  { char: "G", after: 0 },
];

export default function Wordmark({ className }: { className?: string }) {
  return (
    <p aria-hidden="true" className={className}>
      {LETTERS.map(({ char, after }, index) => (
        <span key={index} style={{ marginInlineEnd: `${after}em` }}>
          {char}
        </span>
      ))}
    </p>
  );
}
