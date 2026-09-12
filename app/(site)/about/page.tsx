import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import PortableTextContent from "@/components/PortableTextContent";
import AffiliateDisclosureBanner from "@/components/reviews/AffiliateDisclosureBanner";
import AffiliateButton from "@/components/reviews/AffiliateButton";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import CategoryIcon from "@/components/about/CategoryIcon";
import FeaturedPhotoCluster from "@/components/about/FeaturedPhotoCluster";
import { urlFor, heroCropUrl } from "@/sanity/image";
import { getAboutPage, getFeaturedPhotos, getSiteSettings, type GearItem } from "@/lib/sanity.queries";
import { SUPPORT_URL } from "@/lib/navigation";
import { isSafeHref } from "@/lib/safeUrl";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 60;

const TITLE = "About";
const DESCRIPTION = "Who's behind Astromar, and the gear used to make the images.";

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAboutPage();
  // heroPhoto is a real gallery photo (watermarked, so cropBottom keeps the
  // signature in frame); the plain heroImage fallback is a direct upload
  // with no watermark to protect.
  const image = about?.heroPhoto?.mainImage ?? about?.heroImage;
  return buildMetadata({
    title: TITLE,
    description: DESCRIPTION,
    path: "/about",
    image,
    cropBottom: Boolean(about?.heroPhoto?.mainImage),
  });
}

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
  const [about, settings, featuredPhotos] = await Promise.all([
    getAboutPage(),
    getSiteSettings().catch(() => null),
    getFeaturedPhotos(8).catch(() => []),
  ]);
  // shopUrl is a free-text Studio field, not URL-typed — isSafeHref rules
  // out a stored javascript:/data: scheme executing on click.
  const rawShopUrl = settings?.shopUrl;
  const shopUrl = isSafeHref(rawShopUrl) ? rawShopUrl : undefined;
  // Same lookup Footer.tsx uses — the sign-off at the true end of the page
  // (below) re-links Instagram rather than hardcoding a URL that could
  // drift from the one actually configured in Studio.
  const instagramUrl = (settings?.socialLinks ?? []).find(
    (s) => s.platform.toLowerCase() === "instagram" && isSafeHref(s.url),
  )?.url;
  // A handful of other featured shots to scatter around the hero — never
  // the hero photo itself twice over, and capped at 4 (2 per side; see
  // FeaturedPhotoCluster).
  const clusterPhotos = featuredPhotos
    .filter((p) => p.slug.current !== about?.heroPhoto?.slug.current)
    .slice(0, 4);

  const heroBlock = (about?.heroPhoto?.mainImage?.asset || about?.heroImage?.asset) && (
    <>
      {/* 1344x640 (exactly 672x320 at 2x) matches this box's own aspect
          ratio at the sm: breakpoint and up (max-w-2xl = 672px wide,
          h-80 = 320px tall) — the previous 1600x640 (2.5:1) didn't match
          either breakpoint's real box shape, so object-cover was cropping
          a second time on top of Sanity's own crop, with no awareness of
          what sat near that edge. That silently clipped the corner
          signature once this started showing a real watermarked gallery
          photo instead of a private, unwatermarked one. object-position
          biased right covers the narrower mobile box too (h-64, ~1.3:1) —
          some further cropping still happens there, but toward the left
          edge (aurora sky, not the signature) rather than centred. */}
      <div className="relative h-64 overflow-hidden border border-void-700 sm:h-80">
        <Image
          src={heroCropUrl(about!.heroPhoto?.mainImage ?? about!.heroImage!, 1344, 640)}
          alt={about!.heroPhoto ? about!.heroPhoto.title : "Martyn's imaging setup"}
          fill
          sizes="(min-width: 672px) 672px, 100vw"
          className="object-cover object-right sm:object-center"
        />
      </div>
      {about!.heroPhoto && (
        <p className="mt-2 text-xs text-star-500">
          {about!.heroPhoto.title}
          {about!.heroPhoto.availableAsPrint ? " — prints available." : "."}{" "}
          <Link href={`/gallery/${about!.heroPhoto.slug.current}`} className="underline hover:text-star-300">
            View in the gallery →
          </Link>
        </p>
      )}
    </>
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <div className="mx-auto max-w-2xl">
        <Breadcrumbs items={[{ name: "About", path: "/about" }]} />
        <h1 className="font-mono text-4xl font-bold uppercase tracking-wide text-star-100">About</h1>
        {about?.gear && about.gear.length > 0 && (
          <p className="mt-3 font-mono text-xs uppercase tracking-widest text-star-500">
            Jump to:{" "}
            <a href="#the-gear" className="underline hover:text-nebula-teal-400">
              The gear
            </a>{" "}
            ·{" "}
            <a href="#support-the-site" className="underline hover:text-nebula-teal-400">
              Support the site
            </a>
          </p>
        )}
      </div>

      {heroBlock &&
        (clusterPhotos.length > 0 ? (
          <FeaturedPhotoCluster clusterPhotos={clusterPhotos}>{heroBlock}</FeaturedPhotoCluster>
        ) : (
          <div className="mx-auto mt-6 max-w-2xl">{heroBlock}</div>
        ))}

      <div className="mx-auto mt-6 max-w-2xl">
        {about?.bio ? (
          <PortableTextContent value={about.bio} />
        ) : (
          <p className="text-star-500">Bio coming soon.</p>
        )}
      </div>

      {about?.gear && about.gear.length > 0 && (
        <div id="the-gear" className="mx-auto mt-12 max-w-2xl scroll-mt-24">
          <h2 className="font-mono text-3xl uppercase tracking-wide text-star-100">The gear</h2>
          <p className="mt-3 text-star-500">
            Camera, mount, cables — everything that goes into both rigs above, linked if you
            want to go and buy the exact same thing.
          </p>
          <div className="mt-4">
            <AffiliateDisclosureBanner />
          </div>
          <div className="mt-8 space-y-10">
            {CATEGORY_ORDER.filter((category) =>
              about.gear!.some((item) => item.category === category),
            ).map((category) => {
              const allItems = about.gear!.filter((item) => item.category === category);
              const items = allItems.filter((item) => !item.minimised);
              const minItems = allItems.filter((item) => item.minimised);
              const color = CATEGORY_COLOR[category];
              const [textColor] = color.split(" ");
              return (
                <div key={category}>
                  <p className={`font-mono text-xs uppercase tracking-widest ${textColor}`}>
                    {CATEGORY_LABEL[category]}
                  </p>
                  {/* Grouped as a loose cluster, not a grid, but tiles still
                      fill the row edge-to-edge: sm:flex-1 grows each one
                      (down to a sm:min-w-[260px] floor before wrapping) so a
                      1- or 2-tile row's right edge lines up with the
                      full-width Miscellaneous tile below it, instead of
                      stopping short at a fixed max-width and leaving a gap
                      that made the section look unaligned as a whole. Height
                      stretches to match the tallest tile per row too (the
                      default align-items, left unset rather than pinned to
                      items-start) so a short tile's border doesn't fall
                      short of its taller row-mate either. */}
                  <div className="mt-3 flex flex-wrap gap-4">
                    {items.map((item, i) => {
                      const spanFull = Boolean(item.items && item.items.length > 0);
                      return (
                        <div
                          key={`${item.name}-${i}`}
                          className={`flex items-start gap-4 border border-l-2 border-void-700 bg-void-900 p-4 ${color} ${
                            spanFull
                              ? "w-full"
                              : "w-full sm:min-w-[260px] sm:flex-1"
                          }`}
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
                              <CategoryIcon category={item.icon ?? item.category} className="h-8 w-8" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-mono text-lg uppercase tracking-wide text-star-100">{item.name}</p>
                            {item.notes && (
                              <p className="mt-1 text-sm text-star-500">{item.notes}</p>
                            )}
                            {item.items && item.items.length > 0 && (
                              <ul className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-sm text-star-300 sm:grid-cols-2">
                                {item.items.map((sub) => (
                                  <li key={sub.label} className="flex gap-2">
                                    <span className="text-star-700">·</span>
                                    <span>
                                      {sub.label}
                                      {sub.affiliateLink && isSafeHref(sub.affiliateLink.url) && (
                                        <>
                                          {" "}
                                          <a
                                            href={sub.affiliateLink.url}
                                            target="_blank"
                                            rel="noopener noreferrer sponsored"
                                            className={`whitespace-nowrap font-mono text-xs uppercase tracking-widest underline underline-offset-2 hover:brightness-125 ${textColor}`}
                                          >
                                            Buy →
                                          </a>
                                        </>
                                      )}
                                    </span>
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

                  {/* Minimised tiles: kept-but-superseded gear, shown compact
                      and dimmer below the current picks. Fixed narrow width
                      (sm:flex-none) so they read as secondary rather than
                      stretching to match a full tile. */}
                  {minItems.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-3">
                      {minItems.map((item, i) => (
                        <div
                          key={`${item.name}-min-${i}`}
                          className={`flex w-full items-start gap-3 border border-l-2 border-void-700 bg-void-900 p-3 sm:w-[300px] sm:flex-none ${color}`}
                        >
                          <div className="flex h-11 w-11 flex-none items-center justify-center border border-void-700">
                            <CategoryIcon category={item.icon ?? item.category} className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-mono text-sm uppercase tracking-wide text-star-300">{item.name}</p>
                            {item.notes && <p className="mt-1 text-xs text-star-500">{item.notes}</p>}
                            {item.affiliateLink && isSafeHref(item.affiliateLink.url) && (
                              <a
                                href={item.affiliateLink.url}
                                target="_blank"
                                rel="noopener noreferrer sponsored"
                                className={`mt-2 inline-block font-mono text-xs uppercase tracking-widest underline underline-offset-2 hover:brightness-125 ${textColor}`}
                              >
                                {item.affiliateLink.label} →
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div
        id="support-the-site"
        className="mx-auto mt-12 max-w-2xl scroll-mt-24 border-t border-void-700 pt-8"
      >
        <h2 className="font-mono text-3xl uppercase tracking-wide text-star-100">Support the site</h2>
        <p className="mt-3 text-star-500">
          Astromar doesn&apos;t run ads, and the odd affiliate link barely dents the cost
          of the gear above. If you&apos;ve enjoyed the photos or found a guide useful,
          you&apos;re welcome to buy me a coffee — it goes straight back into camera
          gear, clear-sky trips, and the very late nights that make these images happen.
          Never expected, always genuinely appreciated.
          {shopUrl && (
            <>
              {" "}Prefer something physical? Prints of these shots are also available
              to buy.
            </>
          )}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-nebula-teal-400 px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-nebula-teal-400 transition-colors hover:bg-nebula-teal-400 hover:text-void-950"
          >
            Buy me a coffee
          </a>
          {shopUrl && (
            <Link
              href={shopUrl}
              className="inline-flex items-center gap-2 border border-nebula-rose-400 px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-nebula-rose-400 transition-colors hover:bg-nebula-rose-400 hover:text-void-950"
            >
              Shop Prints
            </Link>
          )}
        </div>
        {instagramUrl && (
          <p className="mt-8 text-star-500">
            I hope you enjoy my content, and if you do, feel free to follow me on{" "}
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-star-300">
              Instagram
            </a>
            .
          </p>
        )}
      </div>
    </div>
  );
}
