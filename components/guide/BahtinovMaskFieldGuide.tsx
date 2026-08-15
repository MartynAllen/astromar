interface FieldExplainer {
  label: string;
  what: string;
  find: string;
}

const REQUIRED_EXPLAINERS: FieldExplainer[] = [
  {
    label: "Focal length",
    what: "How far light travels inside your scope before it comes to a focus. It's what sets your magnification and field of view.",
    find: "Check the spec sheet, the manufacturer's website, or the scope itself — it's often printed near the focuser. If you only know the focal ratio (like f/5) and the aperture, multiply them: focal length = aperture × focal ratio.",
  },
  {
    label: "Clear aperture",
    what: "The actual width of light-gathering glass or mirror — not the tube, not a dew shield, just the optical opening itself.",
    find: "Usually the number in the scope's name — an “80mm refractor” has an 80mm aperture. For reflectors, look for “clear aperture” or “primary mirror diameter” on the spec sheet, since the tube itself is often noticeably wider than this.",
  },
  {
    label: "Tube outer diameter",
    what: "How wide the tube is at the end where the mask will actually sit. This is what the mask's mounting collar grips onto.",
    find: "Measure it directly — a tape measure or calipers wrapped around the outside of the tube opening. Don't guess here; the mask needs to fit snugly to stay on.",
  },
  {
    label: "Rim wall width",
    what: "Not a measurement of your scope — a design choice. How much solid material surrounds the mounting collar.",
    find: "Wider means a sturdier print and more plastic; narrower means lighter and quicker to print. 6mm (the default) is a sensible middle ground for most printers.",
  },
];

const ADVANCED_EXPLAINERS: FieldExplainer[] = [
  { label: "Print thickness", what: "How thick the flat plate is. 3mm prints quickly and holds its shape fine.", find: "" },
  {
    label: "Slits per grating",
    what: "How many light/dark stripes make up each of the three groups. More = a finer, denser pattern; fewer = bolder and easier to read on a dim star.",
    find: "",
  },
  { label: "Strut width", what: "What share of each stripe is solid plastic versus open slit. 50% is the classic even split.", find: "" },
  {
    label: "Grating offset angle",
    what: "How far the two angled groups tilt away from the straight one. 20° is the standard, well-tested default.",
    find: "",
  },
  {
    label: "Print fit clearance",
    what: "A little extra room built into the mounting collar so it slides onto the tube instead of jamming.",
    find: "",
  },
  {
    label: "Mounting skirt depth",
    what: "How far the collar extends past the plate to actually grip the tube. Deeper holds on more securely.",
    find: "",
  },
  {
    label: "Center spine / divider bar width",
    what: "The structural bars that brace the pattern into one solid piece instead of loose fragments.",
    find: "",
  },
];

export default function BahtinovMaskFieldGuide() {
  return (
    <div className="border border-void-700 bg-void-900 p-5">
      <p className="font-mono text-xs uppercase tracking-widest text-nebula-teal-400">
        Before you start
      </p>
      <p className="mt-1 text-sm text-star-500">
        The tool below needs four real numbers from your telescope, plus some optional print
        settings. Here&apos;s what each one means and where to find it — most people only ever
        need the first four.
      </p>

      <div className="mt-5 space-y-5">
        {REQUIRED_EXPLAINERS.map((field) => (
          <div key={field.label} className="border-l-2 border-nebula-teal-500 pl-4">
            <p className="font-mono text-sm uppercase tracking-wide text-star-100">{field.label}</p>
            <p className="mt-1 text-sm text-star-300">{field.what}</p>
            <p className="mt-1 text-sm text-star-500">
              <span className="text-star-300">How to find it: </span>
              {field.find}
            </p>
          </div>
        ))}
      </div>

      <details className="mt-6 border border-void-700 p-3">
        <summary className="cursor-pointer font-mono text-xs uppercase tracking-widest text-star-300">
          What the advanced settings do
        </summary>
        <div className="mt-3 space-y-3">
          <p className="text-sm text-star-500">
            These are print/pattern preferences, not measurements of your scope — the defaults
            work for most setups, so treat this as reference rather than something to fill in.
          </p>
          {ADVANCED_EXPLAINERS.map((field) => (
            <div key={field.label}>
              <span className="font-mono text-xs uppercase tracking-wide text-star-100">{field.label}</span>
              <span className="text-sm text-star-500"> — {field.what}</span>
            </div>
          ))}
        </div>
      </details>

      <p className="mt-5 text-sm text-star-500">
        Once you&apos;ve got your four numbers, use the tool below — the preview updates live as
        you type, and the STL downloads ready to take to a 3D printer (or a print-and-ship
        service, if you don&apos;t own one).
      </p>
    </div>
  );
}
