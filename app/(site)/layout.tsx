import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ShutterIntro from "@/components/ShutterIntro";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ShutterIntro />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
