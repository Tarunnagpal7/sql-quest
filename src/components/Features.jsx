// components/FeatureScroll.jsx
import React from 'react';
import ScrollStack, { ScrollStackItem } from '../assets/style/ScrollStack';
import Particles from '../assets/style/Particles';

function FeatureScroll({ onStackComplete, stackComplete }) {
  return (
      <div className='relative h-screen snap-start flex items-center justify-center overflow-hidden p-6 md:p-12'
        style={{
          // background: 'linear-gradient(135deg, #1a1411 0%, #2d1b14 25%, #1f1a13 50%, #0f0d0a 100%)',
          scrollbarWidth: 'none', /* Firefox */
          msOverflowStyle: 'none' /* IE and Edge */
        }}>

        {/* Hide scrollbar for webkit browsers */}
        <style jsx>{`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {/* Mystical glow overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-blue-900/20"></div>

        {/* Particles Background */}
        <div className="absolute inset-0" style={{ zIndex: 1 }}>
          <Particles
            particleColors={['#fff']}
            particleCount={200}
            particleSpread={10}
            speed={0.1}
            particleBaseSize={100}
            moveParticlesOnHover={true}
            alphaParticles={false}
            disableRotation={false}
          />
        </div>

        {/* Features Text - Centered and Overlaid */}
        <div className="relative z-10 text-center max-w-4xl mx-auto px-2 flex flex-col items-center justify-center h-full hide-scrollbar">
          <div className="mb-8">
            <h2 className="text-4xl md:text-6xl font-black tracking-widest mb-6  bg-gradient-to-r from-purple-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent drop-shadow-2xl">
              ENTER THE REALM
            </h2>
            <div className="w-32 h-1 bg-gradient-to-r from-purple-300 via-blue-300 to-cyan-300 mx-auto shadow-lg shadow-cyan-400/50 mb-8"></div>

            <p className="text-2xl md:text-3xl text-amber-100/95 font-semibold tracking-wide leading-relaxed drop-shadow-lg mb-12">
              Where ancient dragons guard the secrets of SQL mastery.
            </p>
          </div>

          <ScrollStack
            blurAmount={stackComplete ? 8 : 0}
            onStackComplete={onStackComplete}
          >
            <ScrollStackItem>
              <div className="bg-gradient-to-br from-slate-900/90 to-gray-800/90 backdrop-blur-xl border-2 border-cyan-400/60 rounded-xl p-4 shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-cyan-400/30 hover:border-cyan-300/80 group">
                <div className="text-cyan-300 text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">⚔️</div>
                <h3 className="text-2xl font-bold text-cyan-100 mb-4 tracking-wide group-hover:text-cyan-200 transition-colors">Epic Quests</h3>
                <p className="text-gray-200/90 text-lg leading-relaxed group-hover:text-gray-100 transition-colors">Embark on challenging SQL adventures through mystical realms filled with ancient mysteries</p>
                <div className="mt-4 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent group-hover:via-cyan-300/70 transition-all duration-300"></div>
              </div>
            </ScrollStackItem>
            <ScrollStackItem>
              <div className="bg-gradient-to-br from-amber-900/90 to-orange-800/90 backdrop-blur-xl border-2 border-amber-400/60 rounded-xl p-4 shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-amber-400/30 hover:border-amber-300/80 group">
                <div className="text-amber-300 text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">🎯</div>
                <h3 className="text-2xl font-bold text-amber-100 mb-4 tracking-wide group-hover:text-amber-200 transition-colors">Skill Mastery</h3>
                <p className="text-gray-200/90 text-lg leading-relaxed group-hover:text-gray-100 transition-colors">Level up your database knowledge with ancient wisdom passed down through generations</p>
                <div className="mt-4 w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent group-hover:via-amber-300/70 transition-all duration-300"></div>
              </div>
            </ScrollStackItem>
            <ScrollStackItem>
              <div className="bg-gradient-to-br from-purple-900/90 to-indigo-800/90 backdrop-blur-xl border-2 border-purple-400/60 rounded-xl p-4 shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-purple-400/30 hover:border-purple-300/80 group">
                <div className="text-purple-300 text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">📖</div>
                <h3 className="text-2xl font-bold text-purple-100 mb-4 tracking-wide group-hover:text-purple-200 transition-colors">Rich Story</h3>
                <p className="text-gray-200/90 text-lg leading-relaxed group-hover:text-gray-100 transition-colors">Learn through immersive narratives and dragon lore spanning countless ages</p>
                <div className="mt-4 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-400/50 to-transparent group-hover:via-purple-300/70 transition-all duration-300"></div>
              </div>
            </ScrollStackItem>
          </ScrollStack>
        </div>
      </div>
  );
}


export default FeatureScroll;
