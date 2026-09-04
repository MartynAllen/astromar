"use client";

import { useMemo, useState } from "react";
import {
  computeBahtinovGeometry,
  validateBahtinovInputs,
  DEFAULT_ADVANCED,
  type BahtinovInputs,
} from "@/lib/bahtinov/geometry";
import { buildMaskMesh, serializeStlAscii, suggestedFilename } from "@/lib/bahtinov/stl";

type FieldKey = keyof BahtinovInputs;

interface FieldConfig {
  key: FieldKey;
  label: string;
  suffix?: string;
  step?: number;
}

const REQUIRED_FIELDS: FieldConfig[] = [
  { key: "focalLengthMm", label: "Focal length", suffix: "mm", step: 1 },
  { key: "apertureMm", label: "Clear aperture", suffix: "mm", step: 1 },
  { key: "tubeOuterDiameterMm", label: "Tube outer diameter", suffix: "mm", step: 1 },
  { key: "rimWidthMm", label: "Rim wall width", suffix: "mm", step: 1 },
];

const ADVANCED_FIELDS: FieldConfig[] = [
  { key: "maskThicknessMm", label: "Print thickness", suffix: "mm", step: 0.5 },
  { key: "slitsPerGroup", label: "Slits per grating", step: 1 },
  { key: "strutWidthPercent", label: "Strut width", suffix: "%", step: 5 },
  { key: "offsetAngleDeg", label: "Grating offset angle", suffix: "°", step: 1 },
  { key: "fitClearanceMm", label: "Print fit clearance", suffix: "mm", step: 0.1 },
  { key: "skirtDepthMm", label: "Mounting skirt depth", suffix: "mm", step: 1 },
  { key: "spineWidthMm", label: "Center spine width", suffix: "mm", step: 0.5 },
  { key: "dividerWidthMm", label: "Divider bar width", suffix: "mm", step: 0.5 },
];

// A common small-refractor setup — gives a working preview immediately
// rather than greeting the reader with an empty, error-state form.
const INITIAL_VALUES: Record<FieldKey, string> = {
  focalLengthMm: "900",
  apertureMm: "102",
  tubeOuterDiameterMm: "108",
  rimWidthMm: "6",
  maskThicknessMm: String(DEFAULT_ADVANCED.maskThicknessMm),
  slitsPerGroup: String(DEFAULT_ADVANCED.slitsPerGroup),
  strutWidthPercent: String(DEFAULT_ADVANCED.strutWidthPercent),
  offsetAngleDeg: String(DEFAULT_ADVANCED.offsetAngleDeg),
  fitClearanceMm: String(DEFAULT_ADVANCED.fitClearanceMm),
  skirtDepthMm: String(DEFAULT_ADVANCED.skirtDepthMm),
  spineWidthMm: String(DEFAULT_ADVANCED.spineWidthMm),
  dividerWidthMm: String(DEFAULT_ADVANCED.dividerWidthMm),
};

const inputClass =
  "w-full border border-void-600 bg-void-950 px-3 py-2 text-sm text-star-100 placeholder:text-star-700 focus:border-nebula-teal-500";

export default function BahtinovMaskGenerator() {
  const [values, setValues] = useState<Record<FieldKey, string>>(INITIAL_VALUES);

  function handleChange(key: FieldKey, raw: string) {
    setValues((prev) => ({ ...prev, [key]: raw }));
  }

  const parsed = useMemo(() => {
    const out: Partial<BahtinovInputs> = {};
    (Object.keys(values) as FieldKey[]).forEach((key) => {
      const n = parseFloat(values[key]);
      if (Number.isFinite(n)) out[key] = n;
    });
    return out;
  }, [values]);

  const errors = useMemo(() => validateBahtinovInputs(parsed), [parsed]);
  const isValid = Object.keys(errors).length === 0;

  const geometry = useMemo(() => {
    if (!isValid) return null;
    try {
      return computeBahtinovGeometry(parsed as BahtinovInputs);
    } catch {
      return null;
    }
  }, [isValid, parsed]);

  function handleDownload() {
    if (!geometry) return;
    const inputs = parsed as BahtinovInputs;
    const mesh = buildMaskMesh(geometry, inputs.maskThicknessMm, inputs.skirtDepthMm);
    const stl = serializeStlAscii(mesh, "bahtinov-mask");
    const blob = new Blob([stl], { type: "model/stl" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = suggestedFilename(inputs);
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  const focalRatio =
    parsed.focalLengthMm && parsed.apertureMm ? (parsed.focalLengthMm / parsed.apertureMm).toFixed(1) : "—";

  function renderField(field: FieldConfig) {
    const error = errors[field.key];
    return (
      <label key={field.key} className="block">
        <span className="text-xs text-star-500">
          {field.label}
          {field.suffix ? ` (${field.suffix})` : ""}
        </span>
        <input
          type="number"
          inputMode="decimal"
          step={field.step ?? "any"}
          value={values[field.key]}
          onChange={(e) => handleChange(field.key, e.target.value)}
          className={`${inputClass} mt-1`}
        />
        {error && <span className="mt-1 block text-xs text-nebula-rose-400">{error}</span>}
      </label>
    );
  }

  return (
    <div className="border border-void-700 bg-void-900 p-5">
      <p className="font-mono text-xs uppercase tracking-widest text-nebula-teal-400">Build your own</p>
      <p className="mt-1 text-sm text-star-500">
        Enter your telescope&apos;s specs to generate a Bahtinov mask sized exactly to it — download the
        STL and print it. Everything below runs in your browser; nothing is uploaded anywhere.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{REQUIRED_FIELDS.map(renderField)}</div>

      <p className="mt-3 text-xs text-star-500">
        Focal ratio: <span className="text-star-300">{focalRatio === "—" ? focalRatio : `f/${focalRatio}`}</span>
      </p>

      <details className="mt-4 border border-void-700 p-3">
        <summary className="cursor-pointer font-mono text-xs uppercase tracking-widest text-star-300">
          Advanced
        </summary>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">{ADVANCED_FIELDS.map(renderField)}</div>
      </details>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex justify-center border border-void-700 bg-void-950 p-3 sm:flex-none">
          {geometry ? (
            <BahtinovPreview geometry={geometry} />
          ) : (
            <p className="flex h-48 w-48 items-center justify-center text-center text-xs text-star-500">
              Enter valid specs to see a preview
            </p>
          )}
        </div>

        <div className="flex-1">
          <button
            type="button"
            onClick={handleDownload}
            disabled={!geometry}
            className="w-full bg-nebula-teal-400 px-4 py-2 font-mono text-xs uppercase tracking-widest text-void-950 disabled:opacity-40 sm:w-auto"
          >
            Download STL
          </button>
          <p className="mt-2 text-xs text-star-500">
            A slit-grating plate on top of a deep collar sized to slide over your tube, like a lens
            cap. Print with the open collar end down on the bed — self-supporting, no supports needed.
          </p>
        </div>
      </div>
    </div>
  );
}

function BahtinovPreview({
  geometry,
}: {
  geometry: NonNullable<ReturnType<typeof computeBahtinovGeometry>>;
}) {
  const { wallOuterRadiusMm, wallFillInnerRadiusMm, struts, spine, divider } = geometry;
  const pad = wallOuterRadiusMm * 0.08;
  const size = wallOuterRadiusMm + pad;

  const ring = (r: number) =>
    `M ${r},0 A ${r},${r} 0 1,0 ${-r},0 A ${r},${r} 0 1,0 ${r},0 Z`;

  return (
    <svg
      viewBox={`${-size} ${-size} ${size * 2} ${size * 2}`}
      className="h-48 w-48"
      role="img"
      aria-label="Preview of the generated Bahtinov mask pattern"
    >
      {/* SVG's Y axis points down; the geometry module uses standard
          math orientation (Y up), so flip once here rather than baking a
          flip into the geometry itself. */}
      <g transform="scale(1,-1)">
        <path
          d={`${ring(wallOuterRadiusMm)} ${ring(wallFillInnerRadiusMm)}`}
          fillRule="evenodd"
          className="fill-void-600"
        />
        {/* Every shape here genuinely fuses into one solid — confirmed
            point-for-point against the real geometry — but SVG antialiases
            each <polygon>'s edges independently, so two shapes that only
            just touch (rather than overlap by area, as at the strut-to-
            spine/divider connection points) can still show a hairline seam
            of background bleeding through between their soft edges. A
            matching stroke, thin enough to be invisible on any shape's own
            outer silhouette, closes that seam without needing to merge
            these into one path (which would risk real holes wherever two
            overlapping shapes happen to wind in opposite directions —
            StrutRect's own winding isn't guaranteed). */}
        <polygon
          points={spine.corners.map(([x, y]) => `${x},${y}`).join(" ")}
          className="fill-nebula-teal-400 stroke-nebula-teal-400"
          strokeWidth={0.5}
        />
        <polygon
          points={divider.corners.map(([x, y]) => `${x},${y}`).join(" ")}
          className="fill-nebula-teal-400 stroke-nebula-teal-400"
          strokeWidth={0.5}
        />
        {struts.map((strut, i) => (
          <polygon
            key={i}
            points={strut.corners.map(([x, y]) => `${x},${y}`).join(" ")}
            className="fill-nebula-teal-400 stroke-nebula-teal-400"
            strokeWidth={0.5}
          />
        ))}
      </g>
    </svg>
  );
}
