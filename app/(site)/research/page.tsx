import Link from "next/link";
import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import StatusBadge from "@/components/research/StatusBadge";
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

  return (
    <>
      <PageHero photo={heroPhoto}>
        <div className="mx-auto w-full max-w-3xl px-6">
          <Breadcrumbs items={[{ name: "Research", path: "/research" }]} />
          <h1 className="font-display text-4xl text-star-100">Research</h1>
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
          <ul className="mt-2 space-y-4">
            {projects.map((project) => (
              <li key={project._id}>
                <Link
                  href={`/research/${project.slug.current}`}
                  className="group block border border-void-700 border-l-2 border-l-nebula-green-400 bg-void-900 p-5 transition-colors hover:border-void-600"
                >
                  <div className="flex items-center gap-3">
                    <h2 className="font-display text-xl text-star-100 group-hover:text-nebula-green-400">
                      {project.title}
                    </h2>
                    <StatusBadge status={project.status} />
                  </div>
                  {project.summary && (
                    <p className="mt-1.5 text-sm text-star-500">
                      {project.summary}
                    </p>
                  )}
                  {project.techniques && project.techniques.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {project.techniques.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-nebula-green-400/30 px-2.5 py-0.5 font-mono text-xs text-nebula-green-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
