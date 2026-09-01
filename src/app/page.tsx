import { PublicHeader } from "@/components/marketing/PublicHeader";
import { Hero } from "@/components/marketing/Hero";
import { Features } from "@/components/marketing/Features";
import { Segments } from "@/components/marketing/Segments";
import { Pricing } from "@/components/marketing/Pricing";
import { Footer } from "@/components/marketing/Footer";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <PublicHeader />
      <Hero />
      <Features />
      <Segments />
      <Pricing />
      <Footer />
    </div>
  );
}
