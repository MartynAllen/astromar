import Image from "next/image";
import type { Metadata } from "next";
import PortableTextContent from "@/components/PortableTextContent";
import AffiliateDisclosureBanner from "@/components/reviews/AffiliateDisclosureBanner";
import AffiliateButton from "@/components/reviews/AffiliateButton";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import CategoryIcon from "@/components/about/CategoryIcon";
import { urlFor } from "@/sanity/image";
import { getAboutPage } from "@/lib/sanity.queries";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "About",
  description: "Who's behind Astromar, and the gear used to make the images.",
};

const CATEGORY_LABEL: Record<string, string> = {
  telescope: "Telescope",
  camera: "Camera",
  accessory: "Accessories",
  software: "Software",
};

const CATEGORY_COLOR: Record<string, string> = {
  telescope: "text-nebula-teal-400 border-l-nebula-teal-400",
  camera: "text-nebula-rose-400 border-l-nebula-rose-400",
  accessory: "text-nebula-amber-400 border-l-nebula-amber-400",
  software: "text-nebula-indigo-400 border-l-nebula-indigo-400",
};
const DEFAULT_COLOR = "text-star-500 border-l-void-700";

export default async function AboutPage() {
  const about = await getAboutPage();

  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <Breadcrumbs items={[{ name: "About", path: "/about" }]} />
      <h1 className="font-display text-4xl italic text-star-100">About</h1>

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
          <h2 className="font-display text-3xl italic text-star-100">The gear</h2>
          <div className="mt-4">
            <AffiliateDisclosureBanner />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {about.gear.map((item, i) => {
              const color = CATEGORY_COLOR[item.category] ?? DEFAULT_COLOR;
              const spanFull = item.items && item.items.length > 0;
              return (
                <div
                  key={`${item.name}-${i}`}
                  className={`flex items-start gap-4 border border-l-2 border-void-700 bg-void-900 p-4 ${color} ${spanFull ? "sm:col-span-2" : ""}`}
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
                      <CategoryIcon
                        category={item.category}
                        className="h-8 w-8"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-mono text-xs uppercase tracking-wider">
                      {CATEGORY_LABEL[item.category] ?? item.category}
                    </p>
                    <p className="mt-0.5 font-display text-lg italic text-star-100">
                      {item.name}
                    </p>
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
      )}
    </div>
  );
}
