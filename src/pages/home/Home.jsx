import HeroSection from "../../components/home/HeroSection";
import AboutUsSection from "../../components/home/AboutUsSection";
import JoinDiscordSection from "../../components/home/JoinDiscordSection";

export default function Home() {
  return (
    <div className="relative space-y-20">
      <HeroSection />
      <AboutUsSection />
      <JoinDiscordSection />
    </div>
  );
}
