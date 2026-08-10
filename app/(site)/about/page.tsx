import Image from "next/image";
import type { Metadata } from "next";
import PortableTextContent from "@/components/PortableTextContent";
import AffiliateDisclosureBanner from "@/components/reviews/AffiliateDisclosureBanner";
import AffiliateButton from "@/components/reviews/AffiliateButton";
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

export default async function AboutPage() {
  const about = await getAboutPage();

  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <h1 className="font-display text-3xl font-semibold text-star-100">About</h1>

      {about?.heroImage?.asset && (
        <div className="mt-6 overflow-hidden rounded-lg border border-void-700">
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
          <h2 className="font-display text-2xl font-semibold text-star-100">The gear</h2>
          <div className="mt-4">
            <AffiliateDisclosureBanner />
          </div>
          <div className="space-y-4">
            {about.gear.map((item, i) => (
              <div
                key={`${item.name}-${i}`}
                className="flex items-start gap-4 rounded-lg border border-void-700 bg-void-900 p-4"
              >
                {item.image?.asset && (
                  <Image
                    src={urlFor(item.image).width(160).height(160).url()}
                    alt={item.name}
                    width={72}
                    height={72}
                    className="h-[72px] w-[72px] flex-none rounded-md border border-void-700 object-cover"
                  />
                )}
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wider text-star-500">
                    {CATEGORY_LABEL[item.category] ?? item.category}
                  </p>
                  <p className="mt-0.5 font-display text-base font-medium text-star-100">
                    {item.name}
                  </p>
                  {item.notes && <p className="mt-1 text-sm text-star-500">{item.notes}</p>}
                  {item.affiliateLink && (
                    <div className="mt-3">
                      <AffiliateButton link={item.affiliateLink} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
