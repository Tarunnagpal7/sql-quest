import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { updateState } from "../redux/gameSlice";
import AnimatedButton from "./AnimatedButton";
import Particles from "../assets/style/Particles";

function LandingHero() {
  const videoRef = useRef(null);
  const nav = useNavigate();
  const dispatch = useDispatch();
  const game = useSelector((state) => state.game);
  const [isHovering, setIsHovering] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);

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

  // Sparkle effect timer
  useEffect(() => {
    const interval = setInterval(() => {
      setShowSparkles(true);
      setTimeout(() => setShowSparkles(false), 1000);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Start Game handler - resets the game to initial state
  const handleStartGame = () => {
    localStorage.removeItem("sql-quest-game");
    
    dispatch(
      updateState({
        currentLevel: 1,
        progress: [],
        lives: 3,
        skipCount: 0,
        videoWatched: true,
      })
    );

    nav("/map");
  };

  // Continue Game handler - preserves existing state
  const handleContinueGame = () => {
    nav("/map");
  };

  return (
    <section className="relative h-screen w-full flex items-center justify-center snap-start overflow-hidden">
      {/* Enhanced Styles */}
      <style >{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }

        @keyframes pulse-glow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(16, 185, 129, 0.3);
          }
          50% { 
            box-shadow: 0 0 40px rgba(59, 130, 246, 0.8), 0 0 80px rgba(16, 185, 129, 0.5), 0 0 120px rgba(139, 92, 246, 0.3);
          }
        }

        @keyframes magic-sparkle {
          0%, 100% { opacity: 0; transform: scale(0.5) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.2) rotate(180deg); }
        }

        @keyframes title-glow {
          0%, 100% { 
            text-shadow: 0 0 20px rgba(59, 130, 246, 0.8), 0 0 40px rgba(16, 185, 129, 0.6);
          }
          50% { 
            text-shadow: 0 0 40px rgba(59, 130, 246, 1), 0 0 80px rgba(16, 185, 129, 0.8), 0 0 120px rgba(139, 92, 246, 0.6);
          }
        }

        @keyframes button-bounce {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-5px) scale(1.05); }
        }

        @keyframes ripple {
          0% { transform: scale(0); opacity: 1; }
          100% { transform: scale(4); opacity: 0; }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }

        .float-animation { animation: float 4s ease-in-out infinite; }
        .pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
        .magic-sparkle { animation: magic-sparkle 2s ease-in-out infinite; }
        .title-glow { animation: title-glow 4s ease-in-out infinite; }
        .button-bounce { animation: button-bounce 2s ease-in-out infinite; }
        .shake-animation { animation: shake 0.5s ease-in-out infinite; }

        .play-button {
          position: relative;
          background: linear-gradient(135deg, #3b82f6, #10b981, #8b5cf6);
          background-size: 200% 200%;
          animation: gradient-shift 3s ease infinite;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }

        .play-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          transition: left 0.5s;
        }

        .play-button:hover::before {
          left: 100%;
        }

        .play-button:hover {
          transform: translateY(-3px) scale(1.05);
          box-shadow: 0 20px 40px rgba(59, 130, 246, 0.4), 
                      0 0 60px rgba(16, 185, 129, 0.3),
                      0 0 100px rgba(139, 92, 246, 0.2);
        }

        .play-button:active {
          transform: translateY(-1px) scale(1.02);
        }

        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .ripple-effect {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.6);
          pointer-events: none;
          animation: ripple 0.6s linear;
        }

        .floating-orbs {
          position: absolute;
          width: 100%;
          height: 100%;
          overflow: hidden;
          pointer-events: none;
        }

        .orb {
          position: absolute;
          border-radius: 50%;
          opacity: 0.7;
          animation: float-orb 6s ease-in-out infinite;
        }

        @keyframes float-orb {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-10px) translateX(-10px); }
          75% { transform: translateY(-30px) translateX(5px); }
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .play-button {
            padding: 16px 32px !important;
            font-size: 18px !important;
          }
        }

        @media (max-width: 480px) {
          .play-button {
            padding: 14px 28px !important;
            font-size: 16px !important;
          }
        }
      `}</style>

      {/* Enhanced mystical overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80 z-0" />
      
      {/* Floating Orbs */}
      <div className="floating-orbs">
        <div className="orb w-3 h-3 bg-blue-400/30 top-1/4 left-1/4" style={{ animationDelay: '0s' }}></div>
        <div className="orb w-2 h-2 bg-emerald-400/30 top-3/4 left-1/3" style={{ animationDelay: '2s' }}></div>
        <div className="orb w-4 h-4 bg-purple-400/30 top-1/2 right-1/4" style={{ animationDelay: '4s' }}></div>
        <div className="orb w-2 h-2 bg-cyan-400/30 top-1/6 right-1/3" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Particles Background */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        <Particles
          particleColors={["#fff"]}
          particleCount={150}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover={true}
          alphaParticles={false}
          disableRotation={false}
        />
      </div>

      <div className="relative z-10 px-6 py-12 md:py-20 w-full max-w-4xl text-center space-y-6">
        {/* Enhanced Top Title Section */}
        <div className="relative">
          <h2 className="text-lg sm:text-xl md:text-2xl text-blue-100 font-bold tracking-widest uppercase drop-shadow-lg ">
            Welcome to the
          </h2>
        </div>

        {/* Enhanced Divider */}
        <div className="w-24 h-1 mx-auto bg-gradient-to-r from-blue-400 via-emerald-400 to-cyan-400 shadow-lg pulse-glow rounded-full"></div>

        {/* Enhanced Animated Title */}
        <div className="relative">
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-widest mb-6 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-900 bg-clip-text text-transparent title-glow float-animation">
            SQL QUEST
          </h2>
          
        </div>

        {/* Enhanced Description */}
        <p className="text-sm sm:text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed drop-shadow-md font-medium">
          A gamified learning experience where <span className="text-cyan-300 font-bold">stories</span>, 
          <span className="text-emerald-300 font-bold"> challenges</span>, and 
          <span className="text-purple-300 font-bold"> stunning visuals</span> unite to practice SQL like never before.
        </p>

        {/* Enhanced Play Button */}
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <button
            className="play-button px-8 py-4 md:px-12 md:py-5 rounded-full font-black text-lg md:text-xl text-white tracking-wider border-2 border-white/20 button-bounce"
            onClick={handleStartGame}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onMouseDown={(e) => {
              // Create ripple effect
              const button = e.currentTarget;
              const rect = button.getBoundingClientRect();
              const size = Math.max(rect.width, rect.height);
              const x = e.clientX - rect.left - size / 2;
              const y = e.clientY - rect.top - size / 2;
              
              const ripple = document.createElement('span');
              ripple.className = 'ripple-effect';
              ripple.style.width = ripple.style.height = size + 'px';
              ripple.style.left = x + 'px';
              ripple.style.top = y + 'px';
              
              button.appendChild(ripple);
              setTimeout(() => ripple.remove(), 600);
            }}
          >
            {/* Play Icon */}
            <span className="inline-flex items-center gap-3">
              <span className={`text-2xl ${isHovering ? 'shake-animation' : ''}`}>🎮</span>
              <span>PLAY NOW</span>
              <span className={`text-xl ${isHovering ? 'magic-sparkle' : ''}`}>⚡</span>
            </span>
            
            {/* Hover glow effect */}
            <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-blue-900/20 via-emerald-900/20 to-purple-900/20 transition-opacity duration-300 ${isHovering ? 'opacity-100' : 'opacity-0'}`}></div>
          </button>
        </div>
      </div>
    </section>
  );
}

export default LandingHero;