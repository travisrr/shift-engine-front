import Navbar from "./components/landing/Navbar";
import HeroSection from "./components/landing/HeroSection";
import PainPoints from "./components/landing/PainPoints";
import HowItWorks from "./components/landing/HowItWorks";
import FeaturesGrid from "./components/landing/FeaturesGrid";
import Pricing from "./components/landing/Pricing";

export default function LandingPage() {
  return (
    <div className="bg-shift-offwhite text-shift-text-dark leading-relaxed">
      {/* Nav + Hero share same container */}
      <div className="mx-auto max-w-[1200px] px-5">
        <Navbar />
        <HeroSection />
      </div>

      {/* Full-width sections */}
      <PainPoints />
      <HowItWorks />
      <FeaturesGrid />
      <Pricing />
    </div>
  );
}
