export default function RatingStars({ rating }: { rating: number }) {
  return (
    <span
      className="font-mono text-nebula-rose-400"
      aria-label={`${rating} out of 5 stars`}
    >
      {"★".repeat(rating)}
      <span className="text-void-600">{"★".repeat(5 - rating)}</span>
    </span>
  );
}
