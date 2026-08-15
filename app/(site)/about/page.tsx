import Image from "next/image";
import type { Metadata } from "next";
import PortableTextContent from "@/components/PortableTextContent";
import AffiliateDisclosureBanner from "@/components/reviews/AffiliateDisclosureBanner";
import AffiliateButton from "@/components/reviews/AffiliateButton";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import CategoryIcon from "@/components/about/CategoryIcon";
import { urlFor } from "@/sanity/image";
import { getAboutPage, type GearItem } from "@/lib/sanity.queries";
import { SUPPORT_URL } from "@/lib/navigation";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "About",
  description: "Who's behind Astromar, and the gear used to make the images.",
};

type GearCategory = GearItem["category"];

// What you point, what you mount it on, what else the session needs.
const CATEGORY_ORDER: GearCategory[] = ["camera", "telescope", "accessory", "software"];

const CATEGORY_LABEL: Record<GearCategory, string> = {
  telescope: "Telescope",
  camera: "Camera",
  accessory: "Accessories",
  software: "Software",
};

const CATEGORY_COLOR: Record<GearCategory, string> = {
  telescope: "text-nebula-teal-400 border-l-nebula-teal-400",
  camera: "text-nebula-rose-400 border-l-nebula-rose-400",
  accessory: "text-nebula-amber-400 border-l-nebula-amber-400",
  software: "text-nebula-indigo-400 border-l-nebula-indigo-400",
};

export default async function AboutPage() {
  const about = await getAboutPage();

  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <Breadcrumbs items={[{ name: "About", path: "/about" }]} />
      <h1 className="font-mono text-4xl font-bold uppercase tracking-wide text-star-100">About</h1>

      {about?.heroImage?.asset && (
        <div className="mt-6 overflow-hidden border border-void-700">
          <Image
            src={urlFor(about.heroImage).width(1200).url()}
            alt="Martyn's imaging setup"
            width={about.heroImage.dimensions?.width ?? 1200}
            height={about.heroImage.dimensions?.height ?? 800}
            className="h-auto w-full"
          />
        </div>
      )}

      {about?.bio ? (
        <PortableTextContent value={about.bio} />
      ) : (
        <p className="mt-6 text-star-500">Bio coming soon.</p>
      )}

      {about?.gear && about.gear.length > 0 && (
        <div className="mt-12">
          <h2 className="font-mono text-3xl uppercase tracking-wide text-star-100">The gear</h2>
          <div className="mt-4">
            <AffiliateDisclosureBanner />
          </div>
          <div className="mt-8 space-y-10">
            {CATEGORY_ORDER.filter((category) =>
              about.gear!.some((item) => item.category === category),
            ).map((category) => {
              const items = about.gear!.filter((item) => item.category === category);
              const color = CATEGORY_COLOR[category];
              const [textColor] = color.split(" ");
              return (
                <div key={category}>
                  <p className={`font-mono text-xs uppercase tracking-widest ${textColor}`}>
                    {CATEGORY_LABEL[category]}
                  </p>
                  {/* Grouped as a loose cluster, not a grid — tiles size to
                      their own content (not a forced 50/50 split, which left
                      short tiles bloated with dead space) so they can sit
                      genuinely close together, tight within a category and
                      generous between categories, with a slight stagger on
                      alternating tiles so it reads like related stars near
                      each other rather than a spreadsheet. */}
                  <div className="mt-3 flex flex-wrap items-start gap-4">
                    {items.map((item, i) => {
                      const spanFull = Boolean(item.items && item.items.length > 0);
                      const stagger = !spanFull && items.length > 1 && i % 2 === 1;
                      return (
                        <div
                          key={`${item.name}-${i}`}
                          className={`flex items-start gap-4 border border-l-2 border-void-700 bg-void-900 p-4 ${color} ${
                            spanFull
                              ? "w-full"
                              : "w-full sm:w-auto sm:min-w-[260px] sm:max-w-[288px]"
                          } ${stagger ? "sm:mt-7" : ""}`}
                        >
                          {item.image?.asset ? (
                            <Image
                              src={urlFor(item.image).width(160).height(160).url()}
                              alt={item.name}
                              width={72}
                              height={72}
                              className="h-[72px] w-[72px] flex-none border border-void-700 object-cover"
                            />
                          ) : (
                            <div className="flex h-[72px] w-[72px] flex-none items-center justify-center border border-void-700">
                              <CategoryIcon category={item.category} className="h-8 w-8" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-mono text-lg uppercase tracking-wide text-star-100">{item.name}</p>
                            {item.notes && (
                              <p className="mt-1 text-sm text-star-500">{item.notes}</p>
                            )}
                            {item.items && item.items.length > 0 && (
                              <ul className="mt-2 space-y-1 text-sm text-star-300">
                                {item.items.map((sub) => (
                                  <li key={sub} className="flex gap-2">
                                    <span className="text-star-700">·</span>
                                    {sub}
                                  </li>
                                ))}
                              </ul>
                            )}
                            {item.affiliateLink && (
                              <div className="mt-3">
                                <AffiliateButton link={item.affiliateLink} />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-12 border-t border-void-700 pt-8">
        <h2 className="font-mono text-3xl uppercase tracking-wide text-star-100">Support the site</h2>
        <p className="mt-3 text-star-500">
          Astromar doesn&apos;t run ads, and the odd affiliate link barely dents the cost
          of the gear above. If you&apos;ve enjoyed the photos or found a guide useful,
          you&apos;re welcome to buy me a coffee — it goes straight back into camera
          gear, clear-sky trips, and the very late nights that make these images happen.
          Never expected, always genuinely appreciated.
        </p>
        <a
          href={SUPPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 border border-void-600 px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-star-300 transition-colors hover:border-nebula-teal-500 hover:text-nebula-teal-400"
        >
          Buy me a coffee
        </a>
      </div>
    </div>
  );
}
