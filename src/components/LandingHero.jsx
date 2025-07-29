import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import AnimatedButton from "./AnimatedButton";

function LandingHero() {
  const videoRef = useRef(null);
  const nav = useNavigate();
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

<<<<<<< HEAD
  return (
    <section className="relative h-screen w-full flex items-center justify-center snap-start overflow-hidden">
      {/* Background Video */}
      <video
        ref={videoRef}
        className="absolute top-0 left-0 w-full h-full object-cover -z-10"
        src="/Intro.mp4"
        autoPlay
        loop
        muted
      />
      <div className="absolute inset-0 bg-black/50 z-0" />

       <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-12 md:py-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          
          {/* Left Side - Text Content */}
          <div className="text-center lg:text-left space-y-6 order-2 lg:order-1">
            {/* Top Title Section */}
            <h2 className="text-lg sm:text-xl md:text-2xl text-amber-100 font-bold tracking-widest uppercase drop-shadow">
              Welcome to the
            </h2>

            <div className="w-24 h-1 mx-auto lg:mx-0 bg-gradient-to-r from-blue-400 to-cyan-400 shadow-md"></div>

            {/* Main Title */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-widest mb-6 bg-gradient-to-r from-cyan-600 via-cyan-200 to-blue-300 bg-clip-text animate-fade-up text-transparent drop-shadow-2xl">
              SQL QUEST
            </h1>

            <p className="text-sm sm:text-lg md:text-xl text-white/90 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              A gamified learning experience where stories, challenges, and stunning visuals unite to practice SQL like never before.
            </p>

            {/* Buttons */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 mt-8">
              <AnimatedButton label="Start Game" onClick={() => nav('/map')} />
              {game.videoWatched && (
                <AnimatedButton label="Continue" color="green" onClick={() => nav('/map')} />
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
=======
  return (
    <section className="relative h-screen w-full flex items-center justify-center snap-start overflow-hidden">
            {/* Background Video */}     {" "}
      <video
        ref={videoRef}
        className="absolute top-0 left-0 w-full h-full object-cover -z-10"
        src="/Intro.mp4"
        autoPlay
        loop
        muted
      />
            <div className="absolute inset-0 bg-black/50 z-0" />     {" "}
      <div className="relative z-10 px-6 py-12 md:py-20 w-full max-w-4xl text-center space-y-6">
                {/* Top Title Section */}       {" "}
        <h2 className="text-lg sm:text-xl md:text-2xl text-amber-100 font-bold tracking-widest uppercase drop-shadow">
                    Welcome to the        {" "}
        </h2>
               {" "}
        <div className="w-24 h-1 mx-auto bg-gradient-to-r from-blue-400 to-cyan-400 shadow-md"></div>
                {/* New Animated Title */}       {" "}
        <h2 className="text-4xl md:text-6xl font-black tracking-widest mb-6 bg-gradient-to-r from-amber-600 via-cyan-200 to-blue-300 bg-clip-text animate-fade-up text-transparent drop-shadow-2xl">
          SQL QUEST
        </h2>
               {" "}
        <p className="text-sm sm:text-lg md:text-xl text-white/90 max-w-xl mx-auto leading-relaxed">
                    A gamified learning experience where stories, challenges,
          and stunning visuals unite to teach SQL like never before.        {" "}
        </p>
                {/* Buttons */}       {" "}
        <div className="flex flex-wrap justify-center gap-4 mt-6">
                   {" "}
          <AnimatedButton label="Start Game" onClick={() => nav("/map")} />     
             {" "}
          {game.videoWatched && (
            <AnimatedButton
              label="Continue"
              color="green"
              onClick={() => nav("/map")}
            />
          )}
                 {" "}
        </div>
             {" "}
      </div>
         {" "}
    </section>
  );
>>>>>>> a82874c607a35eb63caa61b477a13b6ce104dc0e
}

export default LandingHero;
