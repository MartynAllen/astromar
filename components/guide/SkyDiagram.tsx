// Self-contained star-finding diagrams for the night-sky guide. No image
// asset, no licensing — drawn fresh at read time, theme-token coloured.
//
// The northern diagram plots real J2000 positions through one polar
// projection centred on the pole, so "extend the Merak–Dubhe line ~5x"
// genuinely lands on Polaris. The southern sky isn't in this codebase's
// star data and no observer sees it from Astromar's latitude, so that one
// is a clean schematic with the *construction* drawn to scale (axis
// extended 4.5x, perpendicular bisector of the Pointers) rather than a
// projected star field.

type Star = { name: string; ra: number; dec: number; mag: number };

const NORTH_SCALE = 2.05;
// A whole-frame rotation so the Cassiopeia–Polaris–Plough line runs on a
// diagonal rather than straight up the page — lets a squarer viewBox hold
// it without a tall empty strip through the middle.
const NORTH_ROT = (44 * Math.PI) / 180;
function project(ra: number, dec: number) {
  const d = (90 - Math.abs(dec)) * NORTH_SCALE;
  const a = (ra * Math.PI) / 180;
  const x = -d * Math.sin(a);
  const y = -d * Math.cos(a);
  return {
    x: x * Math.cos(NORTH_ROT) - y * Math.sin(NORTH_ROT),
    y: x * Math.sin(NORTH_ROT) + y * Math.cos(NORTH_ROT),
  };
}

function starRadius(mag: number) {
  return Math.max(1.5, 3.7 - mag * 0.7);
}

function Dot({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <>
      <circle cx={x} cy={y} r={r * 2.2} className="fill-star-100/10" />
      <circle cx={x} cy={y} r={r} className="fill-star-100" />
    </>
  );
}

function Text({
  x,
  y,
  children,
  anchor = "start",
  tone = "mid",
  size = 6,
}: {
  x: number;
  y: number;
  children: string;
  anchor?: "start" | "middle" | "end";
  tone?: "bright" | "mid" | "dim" | "accent";
  size?: number;
}) {
  const cls =
    tone === "bright"
      ? "fill-star-100"
      : tone === "accent"
        ? "fill-nebula-amber-400"
        : tone === "dim"
          ? "fill-star-500"
          : "fill-star-300";
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      className={cls}
      fontSize={size}
      style={{ paintOrder: "stroke" }}
      stroke="var(--color-void-950)"
      strokeWidth={2.6}
      strokeLinejoin="round"
    >
      {children}
    </text>
  );
}

// --- North: Polaris from the Plough -------------------------------------

const PLOUGH: Star[] = [
  { name: "Dubhe", ra: 165.93, dec: 61.75, mag: 1.79 },
  { name: "Merak", ra: 165.46, dec: 56.38, mag: 2.37 },
  { name: "Phecda", ra: 178.46, dec: 53.69, mag: 2.44 },
  { name: "Megrez", ra: 183.86, dec: 57.03, mag: 3.31 },
  { name: "Alioth", ra: 193.51, dec: 55.96, mag: 1.76 },
  { name: "Mizar", ra: 200.98, dec: 54.93, mag: 2.23 },
  { name: "Alkaid", ra: 206.89, dec: 49.31, mag: 1.86 },
];
const PLOUGH_LINES = [
  ["Alkaid", "Mizar"],
  ["Mizar", "Alioth"],
  ["Alioth", "Megrez"],
  ["Megrez", "Phecda"],
  ["Phecda", "Merak"],
  ["Merak", "Dubhe"],
  ["Dubhe", "Megrez"],
];

const LITTLE_DIPPER: Star[] = [
  { name: "Polaris", ra: 37.95, dec: 89.26, mag: 1.98 },
  { name: "Yildun", ra: 263.05, dec: 86.59, mag: 4.36 },
  { name: "EpsilonUMi", ra: 251.5, dec: 82.04, mag: 4.19 },
  { name: "ZetaUMi", ra: 236.02, dec: 77.79, mag: 4.32 },
  { name: "Kochab", ra: 222.68, dec: 74.16, mag: 2.08 },
  { name: "Pherkad", ra: 230.18, dec: 71.83, mag: 3.05 },
];
const LITTLE_DIPPER_LINES = [
  ["Polaris", "Yildun"],
  ["Yildun", "EpsilonUMi"],
  ["EpsilonUMi", "ZetaUMi"],
  ["ZetaUMi", "Kochab"],
  ["Kochab", "Pherkad"],
  ["Pherkad", "EpsilonUMi"],
];

const CASSIOPEIA: Star[] = [
  { name: "Caph", ra: 2.29, dec: 59.15, mag: 2.27 },
  { name: "Schedar", ra: 10.13, dec: 56.54, mag: 2.24 },
  { name: "GammaCas", ra: 14.18, dec: 60.72, mag: 2.47 },
  { name: "Ruchbah", ra: 21.45, dec: 60.24, mag: 2.68 },
  { name: "Segin", ra: 28.6, dec: 63.67, mag: 3.35 },
];
const CASSIOPEIA_LINES = [
  ["Caph", "Schedar"],
  ["Schedar", "GammaCas"],
  ["GammaCas", "Ruchbah"],
  ["Ruchbah", "Segin"],
];

function Constellation({ stars, lines }: { stars: Star[]; lines: string[][] }) {
  const at = new Map(stars.map((s) => [s.name, project(s.ra, s.dec)]));
  return (
    <>
      {lines.map(([a, b], i) => {
        const p = at.get(a);
        const q = at.get(b);
        return p && q ? (
          <line key={i} x1={p.x} y1={p.y} x2={q.x} y2={q.y} className="stroke-void-600" strokeWidth={1} />
        ) : null;
      })}
      {stars.map((s) => {
        const p = project(s.ra, s.dec);
        return <Dot key={s.name} x={p.x} y={p.y} r={starRadius(s.mag)} />;
      })}
    </>
  );
}

function FindingPolaris() {
  const merak = project(165.46, 56.38);
  const dubhe = project(165.93, 61.75);
  const polaris = project(37.95, 89.26);
  const t = 5.4;
  const ext = { x: merak.x + (dubhe.x - merak.x) * t, y: merak.y + (dubhe.y - merak.y) * t };

  return (
    <svg viewBox="-94 -58 192 166" className="mx-auto w-full max-w-[450px]">
      <Constellation stars={CASSIOPEIA} lines={CASSIOPEIA_LINES} />
      <Constellation stars={LITTLE_DIPPER} lines={LITTLE_DIPPER_LINES} />
      <Constellation stars={PLOUGH} lines={PLOUGH_LINES} />

      <line
        x1={merak.x}
        y1={merak.y}
        x2={ext.x}
        y2={ext.y}
        className="stroke-nebula-amber-400"
        strokeWidth={1.4}
        strokeDasharray="4 3"
      />

      <circle cx={polaris.x} cy={polaris.y} r={7.5} className="fill-none stroke-nebula-amber-400" strokeWidth={1.2} />
      <circle cx={polaris.x} cy={polaris.y} r={2.8} className="fill-nebula-amber-400" />

      <Text x={polaris.x + 12} y={polaris.y + 2.2} tone="bright">Polaris — true north</Text>
      <Text x={merak.x - 5} y={merak.y + 8} anchor="end">Merak</Text>
      <Text x={dubhe.x - 5} y={dubhe.y - 1} anchor="end">Dubhe</Text>
      <Text x={project(196, 52).x} y={project(196, 52).y + 15} anchor="middle" tone="dim">The Plough</Text>
      <Text x={project(16, 58).x} y={project(16, 58).y + 15} anchor="middle" tone="dim">Cassiopeia</Text>
      <Text x={project(236, 73).x + 8} y={project(236, 73).y + 4} tone="dim" size={5.4}>Little Dipper</Text>
      <Text x={(merak.x + ext.x) / 2 + 6} y={(merak.y + ext.y) / 2 - 3} tone="accent" size={5.6}>~5× the gap →</Text>
    </svg>
  );
}

// --- South: due south from the Southern Cross ---------------------------
// Schematic. SCP at the origin; Crux below-right of it, its long axis
// pointing back at the pole; the Pointers below-left. Both constructions
// are drawn to scale and meet at the pole.

function FindingSouth() {
  const scp = { x: 0, y: 0 };

  // Long axis of Crux points at the pole. `u` runs Gacrux -> Acrux (i.e.
  // toward the pole); placing the pole 4.5 axis-lengths past Acrux fixes
  // both stars once the pole is the origin.
  const L = 26;
  const u = { x: -0.74, y: -0.67 }; // toward the pole: up and left
  const acrux = { x: -4.5 * L * u.x, y: -4.5 * L * u.y };
  const gacrux = { x: acrux.x - L * u.x, y: acrux.y - L * u.y };
  const centre = { x: (acrux.x + gacrux.x) / 2, y: (acrux.y + gacrux.y) / 2 };
  const cross = { x: -u.y, y: u.x }; // short arm, perpendicular
  const mimosa = { x: centre.x + cross.x * 12, y: centre.y + cross.y * 12 };
  const delta = { x: centre.x - cross.x * 12, y: centre.y - cross.y * 12 };
  const epsilon = { x: centre.x - cross.x * 4 + u.x * 3, y: centre.y - cross.y * 4 + u.y * 3 };
  // Carry the axis a little past the pole so it visibly runs through it.
  const axisEnd = { x: scp.x + 24 * u.x, y: scp.y + 24 * u.y };
  const axisLabel = { x: gacrux.x * 0.46, y: gacrux.y * 0.46 };

  // The two Pointers: their perpendicular bisector also runs through the
  // pole, so orient the pair square to the pole-ward direction.
  const pMid = { x: -46, y: 96 };
  const toPole = { x: scp.x - pMid.x, y: scp.y - pMid.y };
  const tpLen = Math.hypot(toPole.x, toPole.y);
  const along = { x: -toPole.y / tpLen, y: toPole.x / tpLen };
  const alphaCen = { x: pMid.x + along.x * 15, y: pMid.y + along.y * 15 };
  const betaCen = { x: pMid.x - along.x * 15, y: pMid.y - along.y * 15 };
  const bisEnd = { x: scp.x + (toPole.x / tpLen) * 16, y: scp.y + (toPole.y / tpLen) * 16 };

  const horizonY = 146;

  return (
    <svg viewBox="-86 -30 218 202" className="mx-auto w-full max-w-[440px]">
      {/* constructions, under the stars */}
      <line x1={gacrux.x} y1={gacrux.y} x2={axisEnd.x} y2={axisEnd.y} className="stroke-nebula-amber-400" strokeWidth={1.4} strokeDasharray="4 3" />
      <line x1={pMid.x} y1={pMid.y} x2={bisEnd.x} y2={bisEnd.y} className="stroke-nebula-amber-400/70" strokeWidth={1.1} strokeDasharray="2 3" />
      <line x1={scp.x} y1={scp.y} x2={scp.x} y2={horizonY} className="stroke-star-500" strokeWidth={1} strokeDasharray="3 3" />
      <line x1={-74} y1={horizonY} x2={108} y2={horizonY} className="stroke-star-500" strokeWidth={1.3} />

      <line x1={delta.x} y1={delta.y} x2={mimosa.x} y2={mimosa.y} className="stroke-void-600" strokeWidth={1} />
      <line x1={gacrux.x} y1={gacrux.y} x2={acrux.x} y2={acrux.y} className="stroke-void-600" strokeWidth={1} />
      <Dot x={gacrux.x} y={gacrux.y} r={2.7} />
      <Dot x={acrux.x} y={acrux.y} r={3} />
      <Dot x={mimosa.x} y={mimosa.y} r={2.6} />
      <Dot x={delta.x} y={delta.y} r={2.2} />
      <Dot x={epsilon.x} y={epsilon.y} r={1.5} />
      <Dot x={alphaCen.x} y={alphaCen.y} r={3.4} />
      <Dot x={betaCen.x} y={betaCen.y} r={3} />

      {/* pole marker (no star) */}
      <circle cx={scp.x} cy={scp.y} r={6.5} className="fill-none stroke-nebula-amber-400" strokeWidth={1.2} />
      <line x1={scp.x - 3.6} y1={scp.y} x2={scp.x + 3.6} y2={scp.y} className="stroke-nebula-amber-400" strokeWidth={1.2} />
      <line x1={scp.x} y1={scp.y - 3.6} x2={scp.x} y2={scp.y + 3.6} className="stroke-nebula-amber-400" strokeWidth={1.2} />

      <Text x={scp.x + 12} y={scp.y - 1} tone="bright">South celestial pole</Text>
      <Text x={scp.x + 12} y={scp.y + 7} tone="dim" size={5}>no star marks it</Text>
      <Text x={mimosa.x + 7} y={mimosa.y + 3}>Crux</Text>
      <Text x={pMid.x} y={pMid.y + 16} anchor="middle">The Pointers</Text>
      <Text x={pMid.x} y={pMid.y + 23} anchor="middle" tone="dim" size={5}>α &amp; β Centauri</Text>
      <Text x={0} y={horizonY + 12} anchor="middle" tone="bright">due south</Text>
      <Text x={axisLabel.x + 8} y={axisLabel.y} tone="accent" size={5.6}>~4.5× the cross</Text>
    </svg>
  );
}

const DIAGRAMS: Record<string, () => React.JSX.Element> = {
  "finding-polaris": FindingPolaris,
  "finding-south": FindingSouth,
};

export default function SkyDiagram({ kind, caption }: { kind: string; caption?: string }) {
  const Diagram = DIAGRAMS[kind];
  if (!Diagram) return null;
  return (
    <figure className="mt-6">
      <div className="overflow-hidden border border-void-700 bg-void-950 p-3">
        <Diagram />
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-star-500">{caption}</figcaption>
      )}
    </figure>
  );
}
