import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { updateState } from "../redux/gameSlice";
import AnimatedButton from "./AnimatedButton";

function LandingHero() {
  const videoRef = useRef(null);
  const nav = useNavigate();
  const dispatch = useDispatch();
  const game = useSelector((state) => state.game);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.load();
      const tryPlay = async () => {
        try {
          video.muted = true;
          video.volume = 0;
          await video.play();
        } catch {
          setTimeout(() => video.play().catch(() => {}), 100);
        }
      };

      video.addEventListener("loadeddata", tryPlay);
      if (video.readyState >= 3) tryPlay();
    }

    const interactToPlay = () => {
      const video = videoRef.current;
      if (video) {
        video.muted = false;
        video.volume = 0.5;
        video.play().catch(() => {});
      }
      document.removeEventListener("click", interactToPlay);
      document.removeEventListener("touchstart", interactToPlay);
      document.removeEventListener("keydown", interactToPlay);
    };

    document.addEventListener("click", interactToPlay);
    document.addEventListener("touchstart", interactToPlay);
    document.addEventListener("keydown", interactToPlay);

    return () => {
      document.removeEventListener("click", interactToPlay);
      document.removeEventListener("touchstart", interactToPlay);
      document.removeEventListener("keydown", interactToPlay);
    };
  }, []);

  // ✅ NEW: Start Game handler - resets the game to initial state
  const handleStartGame = () => {
    // Clear only the game progress, but keep videoWatched as true
    localStorage.removeItem("sql-quest-game");
    // ✅ IMPORTANT: Don't remove videoWatched - keep it so intro doesn't replay

    // Reset Redux state to initial values but preserve videoWatched
    dispatch(
      updateState({
        currentLevel: 1,
        progress: [],
        lives: 3,
        skipCount: 0,
        videoWatched: true, // ✅ Keep this as true to skip intro video
      })
    );

    // Navigate directly to map (no intro video)
    nav("/map");
  };

  // ✅ NEW: Continue Game handler - preserves existing state
  const handleContinueGame = () => {
    // Simply navigate to map with existing state
    nav("/map");
  };

  return (
    <section className="relative h-screen w-full flex items-center justify-center snap-start overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0 bg-black/50 z-0" />
      <div className="relative z-10 px-6 py-12 md:py-20 w-full max-w-4xl text-center space-y-6">
        {/* Top Title Section */}
        <h2 className="text-lg sm:text-xl md:text-2xl text-amber-100 ml-13 font-bold tracking-widest uppercase drop-shadow">
          Welcome to the
        </h2>

        <div className="w-24 h-1 mx-auto bg-gradient-to-r from-blue-400 to-cyan-400 shadow-md"></div>

        {/* New Animated Title */}
        <h2 className="text-4xl md:text-6xl font-black tracking-widest mb-6 bg-gradient-to-r from-amber-600 via-cyan-200 to-blue-300 bg-clip-text animate-fade-up text-transparent drop-shadow-2xl">
          SQL QUEST
        </h2>

        <p className="text-sm sm:text-lg md:text-xl text-white/90 max-w-xl mx-auto leading-relaxed">
          A gamified learning experience where stories, challenges, and stunning
          visuals unite to practice SQL like never before.
        </p>

        {/* Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mt-6">
          {/* ✅ UPDATED: Start Game button with reset logic */}
          <AnimatedButton label={`Play Now`} onClick={handleStartGame} />
        </div>
      </div>
    </section>
  );
}

export default LandingHero;
