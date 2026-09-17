import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import ResearchProjectCard from "@/components/research/ResearchProjectCard";
import { getAllResearchProjects, getHeroPhoto } from "@/lib/sanity.queries";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 60;

const TITLE = "Workshop";
const DESCRIPTION = "Software tools and technical write-ups built around the astrophotography.";

export async function generateMetadata(): Promise<Metadata> {
  const heroPhoto = await getHeroPhoto(3);
  return buildMetadata({
    title: TITLE,
    description: DESCRIPTION,
    path: "/research",
    image: heroPhoto?.mainImage,
    cropBottom: true,
  });
}

export default async function ResearchPage() {
  const [allProjects, heroPhoto] = await Promise.all([
    getAllResearchProjects(),
    getHeroPhoto(3),
  ]);

  // A plain log of real work — anything still at the "Idea" stage in Studio
  // stays there as a private planning note rather than appearing here, so
  // this page only ever shows things that actually happened.
  const projects = allProjects.filter((project) => project.status !== "Idea");

  return (
    <>
      <PageHero photo={heroPhoto}>
        <div className="mx-auto w-full max-w-3xl px-6">
          <Breadcrumbs items={[{ name: "Workshop", path: "/research" }]} />
          <h1 className="font-mono text-4xl font-bold uppercase tracking-wide text-star-100">Workshop</h1>
          <p className="mt-2 text-star-500">
            A log of the software tools and technical projects built alongside
            the astrophotography, in the order they happened.
          </p>
        </div>
      </PageHero>

      <div className="mx-auto max-w-3xl px-6 py-10">
        {projects.length === 0 ? (
          <p className="mt-16 text-center text-star-500">
            Nothing posted here yet.
          </p>
        ) : (
          <ul className="space-y-4">
            {projects.map((project) => (
              <ResearchProjectCard key={project._id} project={project} />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
