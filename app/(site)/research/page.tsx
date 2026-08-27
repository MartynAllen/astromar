import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import ResearchProjectCard from "@/components/research/ResearchProjectCard";
import { getAllResearchProjects, getHeroPhoto } from "@/lib/sanity.queries";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Research",
  description:
    "Applying Python, computer vision and image analysis to the astrophotography.",
};

export default async function ResearchPage() {
  const [projects, heroPhoto] = await Promise.all([
    getAllResearchProjects(),
    getHeroPhoto(6),
  ]);

  // Two honest buckets rather than three statuses flattened into one list:
  // "Idea" is proposed-but-not-started; "In progress" and "Complete" both
  // mean real work has actually happened, so they share a section — the
  // per-card StatusBadge still shows which of the two it is. Order within
  // each bucket is preserved from the query (publishedAt desc).
  const ideas = projects.filter((project) => project.status === "Idea");
  const log = projects.filter((project) => project.status !== "Idea");

  return (
    <>
      <PageHero photo={heroPhoto}>
        <div className="mx-auto w-full max-w-3xl px-6">
          <Breadcrumbs items={[{ name: "Research", path: "/research" }]} />
          <h1 className="font-mono text-4xl font-bold uppercase tracking-wide text-star-100">Research</h1>
          <p className="mt-2 text-star-500">
            Turning the gallery into a dataset — colour tracking, computer
            vision, exoplanet detection and whatever else comes out of pointing
            Python at these images.
          </p>
        </div>
      </PageHero>

      <div className="mx-auto max-w-3xl px-6 py-10">
        {projects.length === 0 ? (
          <p className="mt-16 text-center text-star-500">
            No research projects posted yet.
          </p>
        ) : (
          <div className="space-y-12">
            <section>
              <div className="mb-4 border-b border-void-700 pb-3">
                <h2 className="font-mono text-2xl uppercase tracking-wide text-star-100">
                  Ideas
                </h2>
                <p className="mt-1 text-sm text-star-500">
                  Proposed, not started — real questions worth pointing Python
                  at, with nothing to show yet.
                </p>
              </div>
              {ideas.length > 0 ? (
                <ul className="space-y-4">
                  {ideas.map((project) => (
                    <ResearchProjectCard key={project._id} project={project} />
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-star-500">
                  Nothing queued right now — see what&apos;s already moved
                  into the log below.
                </p>
              )}
            </section>

            <section>
              <div className="mb-4 border-b border-void-700 pb-3">
                <h2 className="font-mono text-2xl uppercase tracking-wide text-star-100">
                  Research Log
                </h2>
                <p className="mt-1 text-sm text-star-500">
                  Work that&apos;s actually underway or finished, in the order
                  it happened.
                </p>
              </div>
              {log.length > 0 ? (
                <ul className="space-y-4">
                  {log.map((project) => (
                    <ResearchProjectCard key={project._id} project={project} />
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-star-500">
                  Nothing&apos;s moved off the idea stage yet — see what&apos;s
                  queued above.
                </p>
              )}
            </section>
          </div>
        )}
      </div>
    </>
  );
}
