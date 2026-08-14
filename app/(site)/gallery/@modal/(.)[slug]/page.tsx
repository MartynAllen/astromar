import { notFound } from "next/navigation";
import Lightbox from "@/components/gallery/Lightbox";
import PhotoDetail from "@/components/gallery/PhotoDetail";
import { getPhotoBySlug } from "@/lib/sanity.queries";

export default async function PhotoModal(props: PageProps<"/gallery/[slug]">) {
  const { slug } = await props.params;
  const photo = await getPhotoBySlug(slug);
  if (!photo) notFound();

  return (
    <Lightbox slug={slug}>
      <PhotoDetail photo={photo} />
    </Lightbox>
  );
}
