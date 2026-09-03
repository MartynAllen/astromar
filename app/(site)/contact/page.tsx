import type { Metadata } from "next";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch about an order, a photo, or anything else.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <Breadcrumbs items={[{ name: "Contact", path: "/contact" }]} />
      <h1 className="font-mono text-4xl font-bold uppercase tracking-wide text-star-100">Contact</h1>
      <p className="mt-2 text-star-500">
        A question about an order, a photo, or anything else on the site — send a message below
        and I&apos;ll get back to you personally.
      </p>

      <div className="mt-8">
        <ContactForm />
      </div>
    </div>
  );
}
