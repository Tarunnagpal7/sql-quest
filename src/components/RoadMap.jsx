// components/Roadmap.jsx
import React from "react";
import Particles from "../assets/style/Particles";

function Roadmap() {
  const roadmapItems = [
    {
      id: 1,
      title: "Dragon's Awakening",
      subtitle: "SQL Fundamentals",
      description:
        "Begin your journey by learning the ancient language of databases. Master SELECT, WHERE, and JOIN spells.",
      icon: "🐉",
      color: "from-emerald-900/90 to-green-800/90",
      borderColor: "border-emerald-400/60",
      textColor: "text-black",
      size: "text-xl",
      desc_size: "text-xs",
      hoverBorder: "hover:border-emerald-300/80",
      hoverShadow: "hover:shadow-emerald-400/30",
      iconColor: "text-emerald-300",
      difficulty: "Beginner",
      duration: "2-3 weeks",
    },
    {
      id: 2,
      title: "Guardian's Trial",
      subtitle: "Advanced Queries",
      description:
        "Face the ancient guardians by mastering complex queries, subqueries, and window functions.",
      icon: "⚔️",
      color: "from-cyan-900/90 to-blue-800/90",
      borderColor: "border-cyan-400/60",
      textColor: "text-red-500",
      size: "text-xl",
      desc_size: "text-sm",
      hoverBorder: "hover:border-cyan-300/80",
      hoverShadow: "hover:shadow-cyan-400/30",
      iconColor: "text-cyan-300",
      difficulty: "Intermediate",
      duration: "3-4 weeks",
    },
    {
      id: 3,
      title: "Temple of Optimization",
      subtitle: "Performance Mastery",
      description:
        "Unlock the secrets of query optimization, indexing, and database performance tuning.",
      icon: "🏛️",
      color: "from-amber-900/90 to-orange-800/90",
      borderColor: "border-amber-400/60",
      textColor: "text-blue-900",
      size: "text-lg",
      desc_size: "text-sm",
      hoverBorder: "hover:border-amber-300/80",
      hoverShadow: "hover:shadow-amber-400/30",
      iconColor: "text-amber-300",
      difficulty: "Advanced",
      duration: "4-5 weeks",
    },
    {
      id: 4,
      title: "Elder Dragon's Wisdom",
      subtitle: "Database Architecture",
      description:
        "Learn the ancient arts of database design, normalization, and enterprise-level architecture.",
      icon: "🔮",
      color: "from-purple-900/90 to-indigo-800/90",
      borderColor: "border-purple-400/60",
      textColor: "text-black",
      size: "text-lg",
      desc_size: "text-sm",
      hoverBorder: "hover:border-purple-300/80",
      hoverShadow: "hover:shadow-purple-400/30",
      iconColor: "text-purple-300",
      difficulty: "Expert",
      duration: "5-6 weeks",
    },
  ];

  return (
    <div
      className="relative min-h-screen snap-start flex items-center justify-center overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-12 pb-24"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {/* Hide scrollbar for webkit browsers */}
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }

        /* Mobile specific styles */
        @media (max-width: 768px) {
          .roadmap-container {
            padding-bottom: 6rem; /* Extra space for navigation */
          }

          .roadmap-card {
            height: auto !important;
            min-height: 280px;
          }

          .roadmap-grid {
            gap: 1rem;
          }
        }

        /* Touch scrolling */
        .roadmap-scroll {
          -webkit-overflow-scrolling: touch;
        }
      `}</style>

      {/* Mystical glow overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-blue-900/20 pointer-events-none"></div>

      {/* Particles Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 1 }}
      >
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

      {/* Roadmap Content */}
      <div className="relative z-10 max-w-7xl mx-auto w-full roadmap-container">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-6xl font-black tracking-widest mb-4 md:mb-6 bg-gradient-to-r from-purple-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent drop-shadow-2xl">
            THE DRAGON'S PATH
          </h2>
          <div className="w-24 md:w-32 h-1 bg-gradient-to-r from-purple-300 via-blue-300 to-cyan-300 mx-auto shadow-lg shadow-cyan-400/50 mb-6 md:mb-8"></div>
          <p className="text-lg md:text-xl lg:text-2xl text-amber-100/95 font-semibold tracking-wide leading-relaxed drop-shadow-lg px-4">
            Choose your destiny and master the ancient arts of SQL
          </p>
        </div>

        {/* Roadmap Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 relative roadmap-grid">
          {/* Connecting Path Line - Hidden on mobile */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400/30 via-cyan-400/30 to-purple-400/30 transform -translate-y-1/2 z-0"></div>

          {roadmapItems.map((item, index) => (
            <div key={item.id} className="relative z-10">
              {/* Path Number */}
              <div className="flex justify-center mb-3 md:mb-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-r from-gray-800 to-gray-700 border-2 border-gray-600 flex items-center justify-center text-white font-bold text-base md:text-lg shadow-lg">
                  {item.id}
                </div>
              </div>

              {/* Card */}
              <div
                className={`rounded-xl p-5 md:p-7 transform transition-all duration-300 hover:scale-105 ${item.hoverShadow} ${item.hoverBorder} group cursor-pointer roadmap-card`}
                style={{
                  backgroundImage: `url('/scroll.png')`,
                  backgroundPosition: "center",
                  backgroundSize: "120% 120%",
                  height: window.innerWidth < 768 ? "auto" : "320px",
                  minHeight: window.innerWidth < 768 ? "280px" : "320px",
                }}
              >
                {/* Icon */}
                <div
                  className={`${item.iconColor} text-3xl md:text-4xl mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300 text-center`}
                >
                  {item.icon}
                </div>

                {/* Content */}
                <div className="text-center">
                  <h3
                    className={`text-lg md:${item.size} font-bold ${item.textColor} mb-2 tracking-wide group-hover:text-opacity-90 transition-colors animate-pulse`}
                    style={{
                      textShadow:
                        "0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor, 0 0 40px currentColor",
                      filter: "brightness(1.2) saturate(1.5)",
                    }}
                  >
                    {item.title}
                  </h3>
                  <h4 className="text-base md:text-lg font-semibold text-black mb-3">
                    {item.subtitle}
                  </h4>
                  <p
                    className={`text-black text-xs md:${item.desc_size} leading-relaxed group-hover:text-gray-100 transition-colors mb-4`}
                  >
                    {item.description}
                  </p>

                  {/* Difficulty & Duration */}
                  <div className="space-y-2">
                    <div className="flex justify-center items-center text-xs">
                      <span className="bg-black/30 px-2 py-1 mr-3 rounded text-gray-300">
                        {item.difficulty}
                      </span>
                      <span className="text-black font-extrabold">
                        {item.duration}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Decorative bottom line */}
                <div
                  className={`mt-4 w-full h-0.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-50 group-hover:opacity-70 transition-all duration-300`}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Extra space for mobile navigation */}
        <div className="h-16 md:hidden"></div>
      </div>
    </div>
  );
}

export default Roadmap;
