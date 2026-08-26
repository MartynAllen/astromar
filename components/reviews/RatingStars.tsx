export default function RatingStars({ rating }: { rating: number }) {
  // Proportional overlay rather than repeat()-ing "★" `rating` times — repeat()
  // truncates a fractional count (4.5 renders as 4 stars), which silently
  // drops the half-point ratings the schema now allows. A colored copy of
  // the row clipped to rating/5 width sits over a muted full row instead,
  // so any fractional rating (not just .5) renders proportionally.
  const filledPercent = Math.min(100, Math.max(0, (rating / 5) * 100));

  return (
    <span
      className="relative inline-block font-mono text-void-600"
      aria-label={`${rating} out of 5 stars`}
    >
      <span aria-hidden="true">★★★★★</span>
      <span
        aria-hidden="true"
        className="absolute inset-0 overflow-hidden whitespace-nowrap text-nebula-rose-400"
        style={{ width: `${filledPercent}%` }}
      >
        ★★★★★
      </span>
    </span>
  );
}
