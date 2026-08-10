import Link from "next/link";
import type { Metadata } from "next";
import { getAllDiscussions } from "@/lib/sanity.queries";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Weekly Discussion",
  description: "A new astrophotography discussion topic every week.",
};

function formatWeekOf(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function DiscussionsPage() {
  const discussions = await getAllDiscussions();

  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <h1 className="font-display text-3xl font-semibold text-star-100">Weekly Discussion</h1>
      <p className="mt-2 text-star-500">
        One topic a week — planning, processing, gear, whatever&apos;s worth talking through.
        Comment with a GitHub account.
      </p>

      {discussions.length === 0 ? (
        <p className="mt-16 text-center text-star-500">No discussions posted yet.</p>
      ) : (
        <ul className="mt-10 divide-y divide-void-700">
          {discussions.map((d) => (
            <li key={d._id} className="py-5">
              <Link href={`/discussions/${d.slug.current}`} className="group block">
                <p className="font-mono text-xs uppercase tracking-widest text-nebula-teal-400">
                  Week of {formatWeekOf(d.weekOf)}
                </p>
                <h2 className="mt-1 font-display text-lg font-medium text-star-100 group-hover:text-nebula-teal-400">
                  {d.title}
                </h2>
                {d.topic && <p className="mt-1 text-sm text-star-500">{d.topic}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
