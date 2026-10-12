import { AccessSection } from "./access-section/access-section";
import { HeroSection } from "./hero-section/hero-section";
import { MenuSection } from "./menu-section/menu-section";
import { SponsorSection } from "./sponsor-section/sponsor-section";

export const HomePage = () => (
  <>
    <HeroSection />
    <MenuSection />
    <AccessSection />
    <SponsorSection />
  </>
);
