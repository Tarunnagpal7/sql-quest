import React, { useState, useRef } from "react";
import LandingHero from "../components/LandingHero";
import About from "../components/About";
import StoryCarousel from "../components/Story";
import FinalCTA from "../components/FinalCTA";
import { useDispatch, useSelector } from "react-redux";
import { updateState } from "../redux/gameSlice";
import StoryIntroVideo from "../components/StoryIntroVideo";
import { useNavigate } from "react-router-dom";

function HomePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const containerRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const game = useSelector((state) => state.game);

  // ✅ FIXED: The component now checks localStorage to decide if the video should play.
  const [isVideoPlaying, setIsVideoPlaying] = useState(() => {
    return localStorage.getItem("videoWatched") !== "true";
  });

  const handleIntroEnd = () => {
    // ✅ FIXED: Set the flag in localStorage so the video doesn't play again on refresh.
    localStorage.setItem("videoWatched", "true");

    // Update the Redux state here as well to keep it consistent for a full game restart
    dispatch(updateState({ videoWatched: true }));

    // ✅ NEW: Instead of just hiding the video, navigate to the step-based homepage
    setIsVideoPlaying(false);

    // Optional: You can navigate to a specific route if you want
    navigate("/"); // If you have a separate home route

    // Or just show the step-based content (current behavior but more explicit)
  };

  // ✅ NEW: If you want to navigate to a separate route, uncomment this and create the route
  // if (isVideoPlaying) {
  //   return <StoryIntroVideo onEnd={() => {
  //     localStorage.setItem("videoWatched", "true");
  //     dispatch(updateState({ videoWatched: true }));
  //     navigate('/home'); // Navigate to step-based homepage
  //   }} onSkip={() => {
  //     localStorage.setItem("videoWatched", "true");
  //     dispatch(updateState({ videoWatched: true }));
  //     navigate('/home'); // Navigate to step-based homepage
  //   }} />;
  // }

  if (isVideoPlaying) {
    return <StoryIntroVideo onEnd={handleIntroEnd} onSkip={handleIntroEnd} />;
  }

  const components = [
    { component: <LandingHero />, name: "Hero" },
    {component: <About /> , name : 'About'},
    { component: <StoryCarousel />, name: "Story" },
    { component: <FinalCTA />, name: "CTA" },
  ];

  const goToNext = () => {
    if (currentStep < components.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex) => {
    if (stepIndex >= 0 && stepIndex < components.length) {
      setCurrentStep(stepIndex);
    }
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen w-screen bg-black overflow-hidden relative"
      style={{
        backgroundImage: `url('/home.webp')`,
        bacckgroundPosition: "center",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Welcome message for users who just watched the video */}
      {localStorage.getItem("videoWatched") === "true" && currentStep === 0 && (
        <div className="absolute top-4 right-4 z-50 bg-gradient-to-r from-gray-900/90 to-blue-900/90 text-white px-4 py-2 rounded-lg backdrop-blur-sm border border-white/30 animate-fade-in">
          <div className="text-sm font-medium">Presented by Team WhiteSnake! 🎮</div>
        </div>
      )}

      {/* Current Component with Animation */}
      <div className="min-h-screen w-full relative">
        <div
          key={currentStep}
          className="min-h-screen w-full animate-fade-in"
          style={{
            animation: "fadeIn 0.5s ease-in-out",
          }}
        >
          {components[currentStep].component}
        </div>
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>

      {/* Navigation Controls */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-2 z-50 bg-black/20 backdrop-blur-sm rounded-lg px-3 py-1.5">
        {/* Previous Button */}
        {currentStep > 0 && (
          <button
            onClick={goToPrevious}
            className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-md hover:bg-white/30 transition-all duration-300 border border-white/30 text-xs"
          >
            Previous
          </button>
        )}

        {/* Step Indicators */}
        <div className="flex gap-1.5">
          {components.map((_, index) => (
            <button
              key={index}
              onClick={() => goToStep(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? "bg-white scale-110"
                  : "bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>

        {/* Next Button */}
        {currentStep < components.length - 1 && (
          <button
            onClick={goToNext}
            className="px-4 py-2 bg-gradient-to-b from-blue-700 to-blue-900 text-white rounded-md hover:from-black hover:to-blue-900 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-xs"
          >
            Next
          </button>
        )}
      </div>

      {/* Progress Bar
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-64 h-1 bg-white/20 rounded-full overflow-hidden z-10">
        <div
          className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${((currentStep + 1) / components.length) * 100}%`,
          }}
        />
      </div> */}

      {/* Component Title
      <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-10">
        <span className="text-white/80 text-sm font-medium px-4 py-2 bg-black/30 backdrop-blur-sm rounded-full">
          {currentStep + 1} / {components.length} -{" "}
          {components[currentStep].name}
        </span>
      </div> */}
    </div>
  );
}

export default HomePage;
