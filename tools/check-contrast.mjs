// WCAG contrast gate for the CredRoof token set.
// Run: node site/tools/check-contrast.mjs
// OKLCH -> OKLab -> linear sRGB -> sRGB -> relative luminance -> contrast ratio.
//
// A light green-tinted page with deep green hero and closing bands. Reading
// type is ink on light and bone on forest; saffron is reserved for the two
// actions. Every pair below is a pair that actually ships.

const tokens = {
  bg: [0.972, 0.008, 150],
  "bg-soft": [0.945, 0.016, 150],
  card: [0.99, 0.004, 150],
  "tint-green": [0.94, 0.03, 152],
  ink: [0.27, 0.035, 155],
  "ink-soft": [0.47, 0.03, 155],
  "ink-faint": [0.54, 0.025, 155],
  forest: [0.4, 0.1, 152],
  "forest-deep": [0.32, 0.08, 152],
  "on-forest": [0.97, 0.008, 150],
  "on-forest-soft": [0.86, 0.02, 150],
  accent: [0.78, 0.15, 70],
  "accent-strong": [0.7, 0.15, 68],
  "on-accent": [0.22, 0.04, 70],
  danger: [0.45, 0.17, 27],
};

function oklchToRgb([L, C, hDeg]) {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  const lr = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  const gamma = (c) => {
    const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    return Math.min(1, Math.max(0, v));
  };

  return [gamma(lr), gamma(lg), gamma(lb)];
}

function luminance([r, g, b]) {
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(fg, bg) {
  const a = luminance(oklchToRgb(tokens[fg]));
  const b = luminance(oklchToRgb(tokens[bg]));
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

function hex(name) {
  return (
    "#" +
    oklchToRgb(tokens[name])
      .map((c) => Math.round(c * 255).toString(16).padStart(2, "0"))
      .join("")
  );
}

const checks = [
  ["ink", "bg", 7.0, "reading type on the page"],
  ["ink", "card", 7.0, "reading type on a card"],
  ["ink", "bg-soft", 7.0, "reading type on a tinted band"],
  ["ink-soft", "bg", 4.5, "secondary type on the page"],
  ["ink-soft", "card", 4.5, "secondary type on a card"],
  ["ink-soft", "bg-soft", 4.5, "secondary type on a tinted band"],
  ["ink-faint", "bg", 4.5, "fine print on the page"],
  ["ink-faint", "card", 4.5, "fine print on a card"],
  ["forest", "bg", 4.5, "brand green on the page"],
  ["forest", "card", 4.5, "brand green on a card"],
  ["ink", "tint-green", 7.0, "ink on the green tint"],
  ["forest", "tint-green", 4.5, "forest on the green tint"],
  ["on-forest", "forest", 4.5, "reading type on the hero"],
  ["on-forest-soft", "forest", 4.5, "secondary type on the hero"],
  ["on-forest", "forest-deep", 7.0, "reading type on the closing band"],
  ["on-forest-soft", "forest-deep", 4.5, "secondary type on the closing band"],
  ["on-accent", "accent", 4.5, "action label on saffron"],
  ["on-accent", "accent-strong", 4.5, "action label on saffron hover"],
  ["ink", "accent", 4.5, "ink on the saffron fill"],
  ["danger", "card", 4.5, "field error text on a card"],
];

let failed = 0;
for (const [fg, bg, min, label] of checks) {
  const ratio = contrast(fg, bg);
  const pass = ratio >= min;
  if (!pass) failed += 1;
  console.log(
    `${pass ? "PASS" : "FAIL"}  ${label.padEnd(30)} ${fg.padEnd(14)} on ${bg.padEnd(14)} ${ratio.toFixed(2)}:1 (min ${min})`
  );
}

console.log(failed === 0 ? "\nAll contrast checks passed." : `\n${failed} check(s) failed.`);

console.log("\nToken hex values (shipped in styles.css, OKLCH source kept here):");
for (const name of Object.keys(tokens)) {
  console.log(`  --${name.padEnd(14)} oklch(${tokens[name].join(" ")})  ${hex(name)}`);
}

process.exit(failed === 0 ? 0 : 1);
