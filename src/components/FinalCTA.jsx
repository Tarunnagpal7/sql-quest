// components/FinalCTA.jsx
import React from 'react';
import PixelCard from '../assets/style/PixelCard';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const FinalCTA = () => {
  const nav = useNavigate();
  const game = useSelector(state => state.game);

  return (
    <section className="relative bg-gradient-to-t from-black via-blue-950 to-black snap-start flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 md:px-12 text-white overflow-hidden">
      
      {/* Enhanced Hero Section with Icons */}
      <div className="relative flex flex-col items-center justify-center flex-1 w-full max-w-7xl mx-auto py-12">
        
        {/* Title Section */}
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-widest mb-4 bg-gradient-to-r from-cyan-300 via-purple-300 to-blue-300 bg-clip-text text-transparent drop-shadow-2xl">
            BEGIN YOUR QUEST
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-cyan-400 to-purple-400 mx-auto shadow-lg shadow-cyan-400/50 mb-4" />
          <p className="text-sm sm:text-base md:text-lg text-white/80 max-w-md mx-auto">
            Your SQL mastery journey awaits. Are you ready?
          </p>
        </div>

        {/* Game Icons + PixelCard Container */}
        <div className="relative flex items-center justify-center">
          
          {/* Floating Game Icons */}
          <GameIcon icon="⚔️" className="absolute -top-16 -left-16 sm:-top-20 sm:-left-20 lg:-top-24 lg:-left-32" delay="0s" />
          <GameIcon icon="🐉" className="absolute -top-12 -right-12 sm:-top-16 sm:-right-16 lg:-top-20 lg:-right-28" delay="0.5s" />
          <GameIcon icon="📜" className="absolute -bottom-12 -left-8 sm:-bottom-16 sm:-left-12 lg:-bottom-20 lg:-left-24" delay="1s" />
          <GameIcon icon="💎" className="absolute -bottom-8 -right-16 sm:-bottom-12 sm:-right-20 lg:-bottom-16 lg:-right-32" delay="1.5s" />
          <GameIcon icon="🗡️" className="absolute top-1/2 -left-20 sm:-left-28 lg:-left-40 transform -translate-y-1/2" delay="2s" />
          <GameIcon icon="🔮" className="absolute top-1/2 -right-20 sm:-right-28 lg:-right-40 transform -translate-y-1/2" delay="2.5s" />
          <GameIcon icon="🏰" className="absolute -top-8 left-1/2 transform -translate-x-1/2 sm:-top-12 lg:-top-16" delay="3s" />
          <GameIcon icon="⭐" className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 sm:-bottom-8 lg:-bottom-12" delay="3.5s" />

          {/* Enhanced Responsive PixelCard */}
          <div className="scale-75 sm:scale-90 md:scale-100 transition-transform duration-300">
            <PixelCard variant="blue">
              <h1
                className="cursor-pointer text-lg sm:text-xl md:text-2xl lg:text-3xl font-black tracking-widest px-4 py-2 text-center hover:scale-105 transition-transform duration-200"
                onClick={() => nav('/map')}
              >
                {game.videoWatched ? 'CONTINUE' : 'PLAY NOW'}
              </h1>
            </PixelCard>
          </div>
        </div>

        {/* Stats/Features Mini Cards */}
        <div className="flex flex-wrap justify-center gap-4 mt-12 mb-8">
          <StatCard icon="📊" label="7 Levels" />
          <StatCard icon="🎯" label="SQL Mastery" />
          <StatCard icon="🏆" label="Epic Story" />
        </div>
      </div>

      {/* Footer Branding */}
      <footer className="w-full flex flex-col sm:flex-row items-center justify-between border-t border-white/30 pt-6 pb-4 text-sm text-white/80 max-w-6xl mx-auto gap-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">⚡</span>
          <div className="tracking-widest font-semibold text-base md:text-lg text-white drop-shadow-sm">
            SQL QUEST
          </div>
        </div>

        <div className="text-center sm:text-right leading-snug">
          <div className="font-semibold text-white/90 uppercase tracking-wide text-sm md:text-base">
            Team WhiteSnake
          </div>
          <div className="text-white/70 text-xs md:text-sm">BVM College</div>
        </div>
      </footer>
    </section>
  );
};

// Floating Game Icon Component
const GameIcon = ({ icon, className, delay = "0s" }) => (
  <div
    className={`text-2xl sm:text-3xl md:text-4xl opacity-20 hover:opacity-60 transition-all duration-500 animate-bounce ${className}`}
    style={{
      animationDelay: delay,
      animationDuration: '3s',
      filter: 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.3))'
    }}
  >
    {icon}
  </div>
);

// Mini Stat Cards
const StatCard = ({ icon, label }) => (
  <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
    <span className="text-lg">{icon}</span>
    <span className="text-xs sm:text-sm font-medium">{label}</span>
  </div>
);

export default FinalCTA;
