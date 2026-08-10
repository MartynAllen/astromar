import JsonLd from "./JsonLd";
import { breadcrumbListJsonLd } from "@/lib/seo";

export default function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  return <JsonLd data={breadcrumbListJsonLd([{ name: "Home", path: "/" }, ...items])} />;
}
