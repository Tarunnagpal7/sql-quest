import React, { useRef, useState } from "react";
import LandingHero from "../components/LandingHero";
import FeatureScroll from "../components/Features";
import StoryCarousel from "../components/Story";
import FinalCTA from "../components/FinalCTA";

function HomePage() {
  const containerRef = useRef(null);
  const [stackComplete, setStackComplete] = useState(false);

  const handleStackComplete = () => {
    setStackComplete(true);
    if (containerRef.current) {
      const sectionHeight = window.innerHeight;
      containerRef.current.scrollTo({
        top: sectionHeight * 2,
        behavior: "smooth",
      });
    }
  };

  return (
    <div
      ref={containerRef}
      className="h-screen w-screen snap-y bg-black snap-mandatory scroll-smooth overflow-y-scroll"
      style={{ scrollBehavior: "smooth", WebkitOverflowScrolling: "touch" }}
    >
            <LandingHero />
           {" "}
      <FeatureScroll
        onStackComplete={handleStackComplete}
        stackComplete={stackComplete}
      />
            <StoryCarousel />
            <FinalCTA />   {" "}
    </div>
  );
}

export default HomePage;
