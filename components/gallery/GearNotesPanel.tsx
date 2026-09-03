// Same bordered-panel language as ShotDetailsPanel/ProcessingPanel — gear
// notes used to be a single muted, easy-to-miss paragraph tacked on below
// those two panels, which undersold exactly the thing that makes them
// useful: they're often a genuine "how to do this yourself" recipe (a
// plain lens-and-tripod wide-field shot needs no telescope at all), not
// just a spec footnote. Giving it the same panel treatment as every other
// distinct concern on this site makes that legible at a glance rather than
// something a reader has to notice on their own.
export default function GearNotesPanel({ notes }: { notes?: string }) {
  if (!notes) return null;

  return (
    <div className="border border-void-700 bg-void-900 p-4">
      <p className="mb-2 font-mono text-xs uppercase tracking-widest text-nebula-teal-400">
        Gear notes
      </p>
      <p className="text-sm leading-relaxed text-star-300">{notes}</p>
    </div>
  );
}
