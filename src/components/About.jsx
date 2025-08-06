// components/About.jsx
import React, { useState, useEffect } from "react";
import Particles from "../assets/style/Particles";

function About() {
  const [activeCard, setActiveCard] = useState(null);
  const [unlockedCards, setUnlockedCards] = useState([0]);
  const [hoverEffect, setHoverEffect] = useState(null);

  const AboutItems = [
    {
      id: 1,
      title: "10 Enchanted Levels",
      subtitle: "From Select to Sorcery",
      description: "Journey through 10 mystical levels, each revealing SQL secrets.",
      icon: "🗺️",
      color: "from-emerald-900/90 to-green-800/90",
      borderColor: "border-emerald-400/60",
      textColor: "text-emerald-900",
      glowColor: "emerald",
      magicEffect: "✨",
    },
    {
      id: 2,
      title: "Riddles as Clues",
      subtitle: "Mystery-Based SQL",
      description: "Game-based riddles guide you to the right SQL solution.",
      icon: "🧩",
      color: "from-cyan-900/90 to-blue-800/90",
      borderColor: "border-cyan-400/60",
      textColor: "text-cyan-900",
      glowColor: "cyan",
      magicEffect: "🔮",
    },
    {
      id: 3,
      title: "Three Sacred Lives",
      subtitle: "Limited Skips",
      description: "Use your 3 lives wisely when puzzles get too challenging.",
      icon: "❤️",
      color: "from-red-900/90 to-pink-800/90",
      borderColor: "border-red-400/60",
      textColor: "text-red-900",
      glowColor: "red",
      magicEffect: "💖",
    },
    {
      id: 4,
      title: "Unfolding Jungle Map",
      subtitle: "Unlock by Completion",
      description: "Each solved query reveals new areas of the jungle map.",
      icon: "🌿",
      color: "from-purple-900/90 to-indigo-800/90",
      borderColor: "border-purple-400/60",
      textColor: "text-purple-900",
      glowColor: "purple",
      magicEffect: "🌟",
    },
  ];

  // Simulate unlocking cards based on progress
  useEffect(() => {
    const timer = setTimeout(() => {
      if (unlockedCards.length < AboutItems.length) {
        setUnlockedCards(prev => [...prev, prev.length]);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [unlockedCards]);

  const handleCardClick = (index) => {
    if (unlockedCards.includes(index)) {
      setActiveCard(activeCard === index ? null : index);
    }
  };

 

  const getGlowEffect = (color, isActive) => {
    if (!isActive) return "";
    switch (color) {
      case "emerald": return "shadow-2xl shadow-emerald-400/50";
      case "cyan": return "shadow-2xl shadow-cyan-400/50";
      case "red": return "shadow-2xl shadow-red-400/50";
      case "purple": return "shadow-2xl shadow-purple-400/50";
      default: return "";
    }
  };

  return (
    <div
      className="relative min-h-screen snap-start flex items-center justify-center overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-12 pb-24"
      style={{
        backgroundImage: `url('/about.webp')`,
        backgroundPosition: "center",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Enhanced Styles */}
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px currentColor; }
          50% { box-shadow: 0 0 40px currentColor, 0 0 60px currentColor; }
        }

        @keyframes magic-sparkle {
          0%, 100% { opacity: 0; transform: scale(0.8) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.2) rotate(180deg); }
        }

        @keyframes card-unlock {
          0% { transform: scale(0.8) rotateY(-90deg); opacity: 0; }
          50% { transform: scale(1.1) rotateY(0deg); }
          100% { transform: scale(1) rotateY(0deg); opacity: 1; }
        }

        .float-animation { animation: float 3s ease-in-out infinite; }
        .pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        .magic-sparkle { animation: magic-sparkle 1.5s ease-in-out infinite; }
        .card-unlock { animation: card-unlock 0.8s ease-out forwards; }

        .game-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          transform-style: preserve-3d;
        }

        .game-card:hover {
          transform: translateY(-8px) scale(1.02);
        }

        .game-card.active {
          transform: translateY(-12px) scale(1.05);
        }

        .game-card.locked {
          filter: grayscale(100%) brightness(0.3);
          cursor: not-allowed;
        }

        .progress-bar {
          background: linear-gradient(90deg, #10b981, #06b6d4, #8b5cf6);
          background-size: 200% 100%;
          animation: progress-flow 3s ease-in-out infinite;
        }

        @keyframes progress-flow {
          0%, 100% { background-position: 0% 0%; }
          50% { background-position: 100% 0%; }
        }

        @media (max-width: 768px) {
          .About-container { padding-bottom: 6rem; }
          .About-card { height: auto !important; min-height: 300px; }
          .About-grid { gap: 1rem; }
        }

        .About-scroll { -webkit-overflow-scrolling: touch; }
      `}</style>

      {/* Enhanced mystical overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-blue-900/30 pointer-events-none"></div>

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

      {/* About Content */}
      <div className="relative z-10 max-w-7xl mx-auto w-full About-container">
        {/* Enhanced Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="relative inline-block">
            <h2 className="text-3xl md:text-4xl lg:text-6xl font-black tracking-widest mb-4 md:mb-6 bg-gradient-to-r from-blue-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent drop-shadow-2xl float-animation">
              ABOUT THE QUEST
            </h2>
            <div className="absolute -top-4 -right-4 text-2xl magic-sparkle">✨</div>
            <div className="absolute -bottom-2 -left-4 text-xl magic-sparkle" style={{ animationDelay: '0.5s' }}>🌟</div>
          </div>
          
          <p className="text-lg md:text-xl lg:text-2xl text-amber-100/95 font-semibold tracking-wide leading-relaxed drop-shadow-lg px-4">
            A magical SQL adventure through jungle riddles, ancient maps, and data-based trials. Can you solve them all with only 3 lives?
          </p>
        </div>

        {/* Enhanced About Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 relative About-grid">
          {/* Magical connecting path */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400/20 via-cyan-400/40 to-purple-400/20 transform -translate-y-1/2 z-0 rounded-full pulse-glow"></div>

          {AboutItems.map((item, index) => {
            const isUnlocked = unlockedCards.includes(index);
            const isActive = activeCard === index;
            const isHovered = hoverEffect === index;

            return (
              <div key={item.id} className="relative z-10">
                {/* Unlock Animation Trigger */}
                {isUnlocked && (
                  <div className="absolute -top-2 -right-2 z-20 text-2xl magic-sparkle">
                    {item.magicEffect}
                  </div>
                )}

                {/* Enhanced Card */}
                <div
                  className={`
                    game-card rounded-xl p-5 md:p-7 cursor-pointer About-card
                    ${isActive ? 'active' : ''}
                    ${!isUnlocked ? 'locked' : ''}
                    ${isUnlocked ? 'card-unlock' : ''}
                    ${getGlowEffect(item.glowColor, isActive || isHovered)}
                  `}
                  style={{
                    backgroundImage: `url('/scroll.webp')`,
                    backgroundPosition: "center",
                    backgroundSize: "120% 120%",
                    height: window.innerWidth < 768 ? "auto" : "340px",
                    minHeight: window.innerWidth < 768 ? "300px" : "340px",
                    border: isActive ? `2px solid ${item.borderColor.replace('border-', '').replace('/60', '')}` : '1px solid rgba(255,255,255,0.1)',
                  }}
                  onClick={() => handleCardClick(index)}
                  onMouseEnter={() => setHoverEffect(index)}
                  onMouseLeave={() => setHoverEffect(null)}
                >
                  {/* Lock Overlay */}
                  {!isUnlocked && (
                    <div className="absolute inset-0 bg-black/70 rounded-xl flex items-center justify-center z-10">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🔒</div>
                        <p className="text-gray-300 text-sm font-semibold">{item.unlockCondition}</p>
                      </div>
                    </div>
                  )}

                  {/* Icon with floating animation */}
                  <div className={`text-3xl md:text-4xl mt-3 mb-3 md:mb-4 text-center transition-all duration-300 ${isActive ? 'scale-125 float-animation' : 'group-hover:scale-110'}`}>
                    {item.icon}
                  </div>

                  {/* Enhanced Content */}
                  <div className="text-center">
                    <h3 className={`text-lg md:text-xl font-bold ${item.textColor} mb-2 tracking-wide transition-all duration-300 ${isActive ? 'pulse-glow' : ''}`}
                        style={{
                          textShadow: isActive ? "0 0 20px currentColor" : "0 0 10px currentColor",
                          filter: "brightness(1.2) saturate(1.5)",
                        }}>
                      {item.title}
                    </h3>
                    
                    <h4 className="text-base md:text-lg font-semibold text-black mb-3">
                      {item.subtitle}
                    </h4>
                    
                    <p className={`text-black p-2 hover:text-bold text-md leading-relaxed transition-all duration-300 mb-4 ${isActive ? 'font-bold' : ''}`}>
                      {item.description}
                    </p>
                    </div>
                  </div>

                  {/* Enhanced decorative line */}
                  <div className={`mt-4 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-50 transition-all duration-300 rounded-full ${isActive ? 'opacity-100 pulse-glow' : 'group-hover:opacity-70'}`}></div>
                </div>
            );
          })}
        </div>

        {/* Mobile navigation space */}
        <div className="h-16 md:hidden"></div>
      </div>
    </div>
  );
}

export default About;