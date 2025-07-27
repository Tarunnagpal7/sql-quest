import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { updateState } from '../redux/gameSlice';
import { levels } from '../assets/data/levels';

// --- Import your level-specific components here ---
import Level1 from '../components/levels/Level1';
// import Level2 from '../components/levels/Level2';
import Level2 from '../components/levels/Level2';

// Enhanced Header Component with better styling
const LevelHeader = ({ levelId, lives, onSkip, onBack }) => {
    const canSkip = lives > 0;
    return (
        <header className="fixed top-0 left-0 right-0 z-50 ">
          
            <div className="container mx-auto px-2 sm:px-4 py-3 flex items-center justify-between relative">
                {/* Back Button */}
                <button 
                    onClick={onBack}
                    className="group pixel-font text-cyan-300 hover:text-white transition-all duration-300 text-sm sm:text-base flex items-center gap-1 sm:gap-2 bg-slate-800/50 hover:bg-slate-700/70 px-3 py-2 rounded-xl border border-cyan-500/30 hover:border-cyan-400/60 shadow-lg hover:shadow-cyan-400/20 backdrop-blur-sm"
                >
                    <span className="text-xl sm:text-2xl group-hover:scale-110 transition-transform duration-200">←</span>
                    <span className="hidden sm:inline font-bold">Map</span>
                </button>

                {/* Skip Button - Enhanced */}
                <button
                    onClick={onSkip}
                    disabled={!canSkip}
                    className='group pixel-font text-cyan-300 hover:text-white transition-all duration-300 text-sm sm:text-base flex items-center gap-1 sm:gap-2 bg-slate-800/50 hover:bg-slate-700/70 px-3 py-2 rounded-xl border border-cyan-500/30 hover:border-cyan-400/60 shadow-lg hover:shadow-cyan-400/20 backdrop-blur-sm'
                >
                    <span className="font-bold">Skip</span>
                    <span className="text-rose-300 hidden sm:inline">(-1💖)</span>
                </button>
            </div>
        </header>
    );
};

// Main Level Page Component
function LevelPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams();

    const { lives, progress } = useSelector(state => state.game);
    const levelData = levels.find(level => level.id === parseInt(id));

    // Handler for completing a level successfully
    const handleCompleteLevel = () => {
        if (!levelData) return;
        const nextLevelId = levelData.id + 1;
        const newProgress = [...new Set([...progress, levelData.id])];
        dispatch(updateState({ currentLevel: nextLevelId, progress: newProgress }));
        navigate('/map');
    };

    const handleSkip = () => {
        if (lives <= 0 || !levelData) return;
        const nextLevelId = levelData.id + 1;
        if (nextLevelId > levels.length) {
            handleCompleteLevel();
            return;
        }
        dispatch(updateState({ lives: lives - 1, currentLevel: nextLevelId, progress: [...progress, levelData.id] }));
        navigate('/map');
    };
    
    // This function determines which level component to render
    const renderLevelComponent = () => {
        if (!levelData) return null;

        switch (levelData.id) {
            case 1:
                return <Level1 onComplete={handleCompleteLevel} />;
            case 2:
                return <Level2 onComplete={handleCompleteLevel} />;
            default:
                return (
                    <div className="text-center py-12">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 blur-2xl rounded-full" />
                            <p className="pixel-font text-slate-300 text-lg sm:text-2xl relative z-10 mb-4">
                                🚧 Quest Under Construction 🚧
                            </p>
                            <p className="text-slate-400 text-sm sm:text-base">
                                Level {levelData.id} adventure coming soon!
                            </p>
                        </div>
                    </div>
                );
        }
    };

    if (!levelData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white p-4 text-center relative overflow-hidden">
                {/* Animated Background Elements */}
                <div className="absolute inset-0">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-2 h-2 bg-cyan-400/30 rounded-full animate-pulse"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 3}s`,
                                animationDuration: `${2 + Math.random() * 4}s`
                            }}
                        />
                    ))}
                </div>
                
                <div className="relative z-10 bg-slate-800/80 backdrop-blur-xl rounded-3xl p-8 border-2 border-cyan-400/30 shadow-2xl">
                    <h1 className="pixel-font text-3xl sm:text-4xl text-cyan-300 mb-4 animate-pulse">
                        ⚠️ Quest Not Found ⚠️
                    </h1>
                    <p className="text-lg mb-8 text-slate-300">Perhaps you've mastered all the realms!</p>
                    <button
                        onClick={() => navigate('/map')}
                        className="pixel-font text-white font-bold text-lg px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-emerald-400/30 border-2 border-emerald-400/30"
                    >
                        🗺️ Return to Map
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen  bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white pt-20 sm:pt-24 p-4 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.1),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(168,85,247,0.1),transparent_50%)]" />
                {[...Array(30)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full animate-pulse"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${3 + Math.random() * 4}s`
                        }}
                    />
                ))}
            </div>

            <LevelHeader 
                levelId={levelData.id}
                lives={lives}
                onSkip={handleSkip}
                onBack={() => navigate('/map')}
            />

            {/* --- MODIFIED: Side-by-side responsive layout --- */}
            <main className="container mx-auto relative z-10 max-w-7xl">
                <div className="flex flex-col xl:flex-row gap-6 sm:gap-8 items-start">
                    
                    {/* Left Side - Game Component (takes more space) */}
                    <div className="w-full xl:flex-1 order-2 xl:order-1">
                        <div className="relative group">
                            {/* Outer Glow */}
                            <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-cyan-500/30 rounded-3xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity duration-500" />
                            
                            <div className="relative min-h-[20rem] sm:min-h-[24rem] xl:min-h-[28rem] flex items-center justify-center bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border-2 border-gradient-to-r border-blue-400/40 rounded-3xl p-4 sm:p-6 xl:p-8 shadow-2xl">
                                {/* Corner Decorations */}
                                <div className="absolute top-4 left-4 w-4 h-4 border-l-2 border-t-2 border-cyan-400/60 rounded-tl-lg" />
                                <div className="absolute top-4 right-4 w-4 h-4 border-r-2 border-t-2 border-cyan-400/60 rounded-tr-lg" />
                                <div className="absolute bottom-4 left-4 w-4 h-4 border-l-2 border-b-2 border-cyan-400/60 rounded-bl-lg" />
                                <div className="absolute bottom-4 right-4 w-4 h-4 border-r-2 border-b-2 border-cyan-400/60 rounded-br-lg" />
                                
                                {/* Level Component */}
                                <div className="w-full relative z-10">
                                    {renderLevelComponent()}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Quest Information */}
                    <div className="w-full xl:w-96 xl:flex-shrink-0 order-1 xl:order-2 space-y-6">
           
        

                        
                        {/* Enhanced Quest Display */}
                        <div className="relative group">
                            {/* Glow Effect */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/50 via-blue-500/50 to-purple-500/50 rounded-3xl blur-lg opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                            
                            <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border-2 border-cyan-400/40 rounded-3xl p-4 sm:p-6 text-center shadow-2xl">
                                {/* Quest Header */}
                                <div className="flex items-center justify-center gap-2 mb-4">
                                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                                    <h2 className="pixel-font text-lg sm:text-xl xl:text-2xl text-transparent bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text font-bold">
                                        ⚡ Your Quest ⚡
                                    </h2>
                                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                                </div>

                                {/* Quest Description */}
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-slate-700/50 to-slate-800/50 rounded-xl blur-sm" />
                                    <p className="relative font-mono text-sm sm:text-base xl:text-lg text-cyan-100 bg-slate-800/70 backdrop-blur-sm p-3 sm:p-4 rounded-xl border border-cyan-500/30 shadow-inner break-words">
                                        <span className="text-cyan-300 font-bold block mb-2">🎯 Mission:</span> 
                                        <span className="text-slate-200">{levelData.title}</span>
                                    </p>
                                </div>

                                {/* Decorative Elements */}
                                <div className="flex justify-center gap-2 mt-4">
                                    <div className="w-8 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-full opacity-60" />
                                    <div className="w-6 h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent rounded-full opacity-60" />
                                    <div className="w-8 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent rounded-full opacity-60" />
                                </div>
                            </div>
                        </div>

                        {/* Additional Level Info Card */}
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/40 via-pink-500/40 to-cyan-500/40 rounded-2xl blur-md opacity-50 group-hover:opacity-70 transition-opacity duration-500" />
                            
                            <div className="relative bg-gradient-to-br from-slate-800/85 to-slate-900/85 backdrop-blur-lg border-2 border-purple-400/30 rounded-2xl p-4 sm:p-5 shadow-xl">
                                <h3 className="pixel-font text-purple-300 font-bold text-sm sm:text-base mb-3 text-center">
                                    📊 Level Details
                                </h3>
                   <div className="flex items-center justify-center space-x-2">
                        <span className=" text-white font-bold text-xs sm:text-sm">Lives:</span>
                        <div className="flex space-x-1">
                            {[...Array(3)].map((_, i) => (
                                <div 
                                    key={i} 
                                    className={`text-lg sm:text-xl transition-all duration-500 transform ${
                                        i < lives 
                                            ? 'text-rose-400 animate-pulse scale-110 drop-shadow-lg filter brightness-125' 
                                            : 'text-slate-600 grayscale scale-75 opacity-50'
                                    }`}
                                    style={{ animationDelay: `${i * 0.2}s` }}
                                >
                                    💖
                                </div>
                            ))}
                        </div>
                        </div>
                                
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400">Difficulty:</span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                            levelData.type === 'basic' ? 'bg-green-600/30 text-green-300 border border-green-500/30' :
                                            levelData.type === 'intermediate' ? 'bg-yellow-600/30 text-yellow-300 border border-yellow-500/30' :
                                            levelData.type === 'advanced' ? 'bg-orange-600/30 text-orange-300 border border-orange-500/30' :
                                            'bg-red-600/30 text-red-300 border border-red-500/30'
                                        }`}>
                                            {levelData.type?.toUpperCase() || 'UNKNOWN'}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400">Level:</span>
                                        <span className="text-cyan-300 font-bold">{levelData.id} / {levels.length}</span>
                                    </div>
                                    
                                    <div className="pt-2 border-t border-slate-700/50">
                                        <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-1000 ease-out"
                                                style={{ width: `${(levelData.id / levels.length) * 100}%` }}
                                            />
                                        </div>
                                        <p className="text-center text-xs text-slate-400 mt-1">
                                            Quest Progress
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Motivational Message */}
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/40 to-teal-500/40 rounded-2xl blur-md opacity-50 group-hover:opacity-70 transition-opacity duration-500" />
                            
                            <div className="relative bg-gradient-to-br from-slate-800/85 to-slate-900/85 backdrop-blur-lg border-2 border-emerald-400/30 rounded-2xl p-4 text-center shadow-xl">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <span className="text-2xl">🌟</span>
                                    <h4 className="pixel-font text-emerald-300 font-bold text-sm">
                                        Pro Tip
                                    </h4>
                                    <span className="text-2xl">🌟</span>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                                    Complete quests to unlock new SQL realms and become a true data wizard!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <style jsx>{`
                .pixel-font { 
                    font-family: 'Courier New', monospace; 
                    text-shadow: 2px 2px 0px rgba(0,0,0,0.8), 0 0 10px rgba(59,130,246,0.3); 
                }
                @media (max-width: 640px) { 
                    .pixel-font { 
                        text-shadow: 1px 1px 0px rgba(0,0,0,0.8), 0 0 5px rgba(59,130,246,0.3); 
                    } 
                }
                
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                
                .group:hover .animate-float {
                    animation: float 3s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}

export default LevelPage;
