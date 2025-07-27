import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateState } from '../redux/gameSlice';
import { useNavigate } from 'react-router-dom';
import { levels } from '../assets/data/levels';

// Helper hook to remember the previous value of a state or prop
function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

// ✅ FIXED: Using actual assets you have
const ASSETS = {
  wizard: '/wizard-character.png',
  bird: '/magical-bird.png',
  tree: '/magical-tree.png',
  castle: '/castle.png',
  cage: '/cage.png',
  river: '/river-segment.png',
  bush: '/bush.png',
  rock: '/rock.png',
  portal: '/portal.png',
  mysticalMap: '/jungle_map_bg.jpg', // Your provided background
};

const MapMainView = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const gameState = useSelector(state => state.game || {
    lives: 3,
    currentLevel: 1,
    progress: [],
    skipCount: 0,
    videoWatched: false
  });

  const updatedLevels = useMemo(() => levels.map(level => ({
    ...level,
    unlocked: level.id <= gameState.currentLevel || level.id === 1,
    completed: gameState.progress.includes(level.id)
  })), [gameState.currentLevel, gameState.progress]);

  const initialLevelData = useMemo(() => 
    updatedLevels.find(level => level.id === gameState.currentLevel), 
    [gameState.currentLevel, updatedLevels]
  );
  
  const [characterPosition, setCharacterPosition] = useState(() => {
    if (initialLevelData) {
      return { x: initialLevelData.x, y: initialLevelData.y };
    }
    return { x: 50, y: 15 };
  });

  const [isMoving, setIsMoving] = useState(false);
  const [mapScale, setMapScale] = useState(1);
  
  const previousCurrentLevelId = usePrevious(gameState.currentLevel);

  const isGameWon = gameState.progress.length >= levels.length;
  const isGameOver = gameState.lives <= 0;

  const handleRestart = () => {
    localStorage.removeItem('sql-quest-game');
    dispatch(updateState({
      currentLevel: 1,
      progress: [],
      lives: 3,
      skipCount: 0,
      videoWatched: false,
    }));
    window.location.reload();
  };

  // Enhanced responsive handling
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 480) setMapScale(0.7);
      else if (width < 768) setMapScale(0.8);
      else if (width < 1024) setMapScale(0.9);
      else setMapScale(1);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Animate character movement when currentLevel changes
  useEffect(() => {
    const currentLevelData = updatedLevels.find(level => level.id === gameState.currentLevel);
    
    if (previousCurrentLevelId && previousCurrentLevelId !== gameState.currentLevel && currentLevelData) {
        setIsMoving(true);
        setTimeout(() => {
            setCharacterPosition({ x: currentLevelData.x, y: currentLevelData.y });
            setTimeout(() => {
                setIsMoving(false);
            }, 800);
        }, 100); 
    } else if (currentLevelData && (characterPosition.x !== currentLevelData.x || characterPosition.y !== currentLevelData.y)) {
        setCharacterPosition({ x: currentLevelData.x, y: currentLevelData.y });
    }
  }, [gameState.currentLevel, previousCurrentLevelId, updatedLevels, characterPosition]);

  // ✅ FIXED: Prevent going back to previous levels once completed
  const handleLevelClick = (level) => {
    if (isGameOver) return;

    // ✅ NEW: Prevent clicking on completed levels (can't go backwards)
    if (level.completed && level.id < gameState.currentLevel) {
      return; // Block access to completed previous levels
    }

    // Only allow current level or next unlocked level
    if (level.unlocked && level.id === gameState.currentLevel) {
      navigate(`/level/${level.id}`);
    } else if (level.unlocked && level.id === gameState.currentLevel + 1) {
      // Allow moving to next level if it's unlocked
      setIsMoving(true);
      setTimeout(() => {
        dispatch(updateState({ currentLevel: level.id }));
        setCharacterPosition({ x: level.x, y: level.y });
        setTimeout(() => {
            setIsMoving(false);
            navigate(`/level/${level.id}`);
        }, 800);
      }, 200);
    }
  };

  // ✅ FIXED: Using actual rock assets for stone paths
  const renderRockPath = () => {
    const pathSegments = [];
    
    for (let i = 0; i < updatedLevels.length - 1; i++) {
      const current = updatedLevels[i];
      const next = updatedLevels[i + 1];
      
      const pathIsUnlocked = next.unlocked;
      const pathIsCompleted = current.completed && pathIsUnlocked;

      // Create rock segments using your rock asset
      const numRocks = 6;
      const rocks = [];
      
      for (let j = 0; j < numRocks; j++) {
        const progress = j / (numRocks - 1);
        const rockX = current.x + (next.x - current.x) * progress;
        const rockY = current.y + (next.y - current.y) * progress;
        
        // Add some randomness for natural look
        const offsetX = (Math.random() - 0.5) * 1.5;
        const offsetY = (Math.random() - 0.5) * 1.5;
        
        rocks.push(
          <div
            key={`rock-${i}-${j}`}
            className="absolute pointer-events-none"
            style={{
              left: `${rockX + offsetX}%`,
              top: `${rockY + offsetY}%`,
              transform: `translate(-50%, -50%) scale(${mapScale * 0.8}) rotate(${Math.random() * 360}deg)`,
              zIndex: 1
            }}
          >
            {/* ✅ USING ACTUAL ROCK ASSET */}
            <img 
              src={ASSETS.rock} 
              alt="Path Rock" 
              className={`w-6 h-6 sm:w-8 sm:h-8 object-contain transition-all duration-500 ${
                pathIsCompleted 
                  ? 'filter brightness-125 drop-shadow-lg' 
                  : pathIsUnlocked 
                    ? 'filter brightness-100' 
                    : 'filter grayscale brightness-60 opacity-40'
              }`}
              onError={(e) => {
                // Fallback if rock asset doesn't load
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            
            {/* Fallback rock shape */}
            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg hidden transition-all duration-500 ${
              pathIsCompleted 
                ? 'bg-gradient-to-br from-blue-400 to-cyan-500 shadow-lg shadow-blue-400/50' 
                : pathIsUnlocked 
                  ? 'bg-gradient-to-br from-slate-500 to-slate-700 shadow-md' 
                  : 'bg-gradient-to-br from-slate-700 to-slate-900 opacity-30'
            }`}>
              {/* Rock texture */}
              <div className="absolute inset-0 rounded-lg opacity-40">
                <div className="w-1 h-1 bg-white/60 rounded-full absolute top-1 left-1"></div>
                <div className="w-1 h-1 bg-black/40 rounded-full absolute bottom-1 right-1"></div>
              </div>
            </div>
          </div>
        );
      }
      
      pathSegments.push(...rocks);
    }
    
    return pathSegments;
  };

  // ✅ FIXED: Using actual tree assets
  const renderTreeDecorations = () => {
    const trees = [];
    const treePositions = [
      { x: 10, y: 10, scale: 1.0, rotation: -3 }, 
      { x: 90, y: 20, scale: 0.8, rotation: 5 },
      { x: 5, y: 35, scale: 1.2, rotation: -8 }, 
      { x: 95, y: 45, scale: 0.9, rotation: 4 },
      { x: 8, y: 65, scale: 1.1, rotation: -2 }, 
      { x: 92, y: 75, scale: 0.7, rotation: 7 },
      { x: 12, y: 85, scale: 1.0, rotation: -5 }, 
      { x: 88, y: 95, scale: 0.8, rotation: 3 },
    ];

    treePositions.forEach((pos, i) => {
      trees.push(
        <div 
          key={`tree-${i}`} 
          className="absolute pointer-events-none" 
          style={{ 
            left: `${pos.x}%`, 
            top: `${pos.y}%`, 
            transform: `translate(-50%, -50%) scale(${pos.scale * mapScale}) rotate(${pos.rotation}deg)`, 
            zIndex: pos.y > 50 ? 3 : 1 
          }}
        >
          {/* ✅ USING ACTUAL TREE ASSET */}
          <img 
            src={ASSETS.tree} 
            alt="Magical Tree" 
            className="w-16 h-20 sm:w-20 sm:h-24 md:w-24 md:h-28 object-contain drop-shadow-2xl opacity-90 filter brightness-90" 
            onError={(e) => { 
              e.target.style.display = 'none'; 
              e.target.nextSibling.style.display = 'block'; 
            }} 
          />
          
          {/* Fallback tree */}
          <div className="w-16 h-20 sm:w-20 sm:h-24 md:w-24 md:h-28 bg-gradient-to-b from-green-900 via-green-800 to-green-700 rounded-t-full opacity-80 hidden">
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-8 bg-gradient-to-b from-amber-800 to-amber-900 rounded-b" />
          </div>
        </div>
      );
    });
    return trees;
  };

  // ✅ FIXED: Using actual bush assets
  const renderBushDecorations = () => {
    const bushes = [];
    const bushPositions = [
      { x: 15, y: 22, scale: 0.8 }, 
      { x: 82, y: 38, scale: 1.0 }, 
      { x: 28, y: 52, scale: 0.9 }, 
      { x: 72, y: 68, scale: 1.1 }, 
      { x: 18, y: 78, scale: 0.7 }, 
      { x: 85, y: 88, scale: 0.9 }
    ];

    bushPositions.forEach((pos, i) => {
      bushes.push(
        <div 
          key={`bush-${i}`} 
          className="absolute pointer-events-none" 
          style={{ 
            left: `${pos.x}%`, 
            top: `${pos.y}%`, 
            transform: `translate(-50%, -50%) scale(${pos.scale * mapScale})`, 
            zIndex: 1 
          }}
        >
          {/* ✅ USING ACTUAL BUSH ASSET */}
          <img 
            src={ASSETS.bush} 
            alt="Mystical Bush" 
            className="w-12 h-8 sm:w-16 sm:h-10 object-contain drop-shadow-lg opacity-85 filter brightness-95" 
            onError={(e) => { 
              e.target.style.display = 'none'; 
              e.target.nextSibling.style.display = 'block'; 
            }} 
          />
          
          {/* Fallback bush */}
          <div className="w-12 h-8 sm:w-16 sm:h-10 bg-gradient-to-b from-green-700 to-green-800 rounded-full opacity-70 hidden" />
        </div>
      );
    });
    return bushes;
  };

  // ✅ FIXED: Using actual bird assets
  const renderBirdAnimations = () => {
    const birds = [];
    const birdPositions = [
      { x: 25, y: 5, direction: 1, speed: 4 }, 
      { x: 75, y: 8, direction: -1, speed: 5 }, 
      { x: 45, y: 3, direction: 1, speed: 3.5 }, 
      { x: 65, y: 12, direction: -1, speed: 4.5 }
    ];

    birdPositions.forEach((pos, i) => {
      birds.push(
        <div 
          key={`bird-${i}`} 
          className="absolute pointer-events-none animate-float" 
          style={{ 
            left: `${pos.x}%`, 
            top: `${pos.y}%`, 
            transform: `translateX(-50%) scaleX(${pos.direction}) scale(${mapScale})`, 
            zIndex: 8, 
            animationDelay: `${i * 1.5}s`, 
            animationDuration: `${pos.speed}s` 
          }}
        >
          {/* ✅ USING ACTUAL BIRD ASSET */}
          <img 
            src={ASSETS.bird} 
            alt="Magical Bird" 
            className="w-8 h-6 sm:w-10 sm:h-8 object-contain drop-shadow-lg filter brightness-110" 
            onError={(e) => { 
              e.target.style.display = 'none'; 
              e.target.nextSibling.style.display = 'block'; 
            }} 
          />
          
          {/* Fallback bird */}
          <div className="w-8 h-6 sm:w-10 sm:h-8 bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-400 rounded-full transform rotate-12 hidden">
            <div className="absolute -left-2 top-1 w-6 h-4 bg-gradient-to-r from-purple-500 to-blue-400 rounded-full animate-wing" />
            <div className="absolute -right-2 top-1 w-6 h-4 bg-gradient-to-r from-blue-400 to-cyan-300 rounded-full animate-wing" style={{ animationDelay: '0.1s' }} />
          </div>
        </div>
      );
    });
    return birds;
  };

  // ✅ FIXED: Enhanced level rendering with restricted access
  const renderLevel = (level) => {
    const isCurrentLevel = level.id === gameState.currentLevel;
    const isCompleted = level.completed;
    const isUnlocked = level.unlocked;
    
    // ✅ NEW: Determine if level is clickable (prevent going backwards)
    const isClickable = isUnlocked && (
      level.id === gameState.currentLevel || // Current level
      (level.id === gameState.currentLevel + 1 && !isCompleted) // Next level if current not completed
    );
    
    const getLevelTypeColor = (type) => {
      switch (type) {
        case 'basic': return 'from-emerald-500 to-emerald-700';
        case 'intermediate': return 'from-sky-500 to-sky-700';
        case 'advanced': return 'from-violet-500 to-violet-700';
        case 'expert': return 'from-rose-500 to-rose-700';
        case 'legendary': return 'from-amber-500 to-amber-700';
        default: return 'from-slate-500 to-slate-700';
      }
    };

    return (
      <div 
        key={level.id} 
        className={`absolute transform -translate-x-1/2 -translate-y-1/2 group ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}`} 
        style={{ 
          left: `${level.x}%`, 
          top: `${level.y}%`, 
          zIndex: 4, 
          transform: `translate(-50%, -50%) scale(${mapScale})` 
        }} 
        onClick={() => handleLevelClick(level)}
      >
        <div className="relative">
          {/* ✅ USING ACTUAL PORTAL ASSET */}
          <img 
            src={ASSETS.portal} 
            alt={`Level ${level.id} Portal`} 
            className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-contain transition-all duration-500 drop-shadow-2xl ${
              isCompleted 
                ? 'filter hue-rotate-60 brightness-125 saturate-150 animate-pulse' 
                : isCurrentLevel 
                  ? 'animate-pulse filter brightness-125 saturate-125' 
                  : isUnlocked 
                    ? 'filter brightness-100' 
                    : 'filter grayscale brightness-60'
            } ${isClickable ? 'group-hover:scale-110 group-hover:brightness-125' : ''}`} 
            onError={(e) => { 
              e.target.style.display = 'none'; 
              e.target.nextSibling.style.display = 'block'; 
            }} 
          />
          
          {/* Fallback portal */}
          <div className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full border-4 transition-all duration-500 hidden ${
            isCompleted 
              ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 border-amber-200 shadow-amber-400/80' 
              : isCurrentLevel 
                ? `bg-gradient-to-br ${getLevelTypeColor(level.type)} border-white shadow-2xl animate-pulse` 
                : isUnlocked 
                  ? `bg-gradient-to-br ${getLevelTypeColor(level.type)} border-slate-300 shadow-xl` 
                  : 'bg-gradient-to-br from-slate-600 to-slate-800 border-slate-500 opacity-50'
          } shadow-2xl ${isClickable ? 'group-hover:scale-110 group-hover:shadow-3xl' : ''}`}>
            {(isCurrentLevel || isCompleted) && (
              <>
                <div className="absolute inset-0 rounded-full border-2 border-white/40 animate-ping" />
                <div className="absolute inset-2 rounded-full border-2 border-white/30 animate-ping" style={{ animationDelay: '0.5s' }} />
                <div className="absolute inset-4 rounded-full border-2 border-white/20 animate-ping" style={{ animationDelay: '1s' }} />
              </>
            )}
          </div>

          {/* Level number */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="pixel-font text-white font-bold text-lg sm:text-xl md:text-2xl drop-shadow-2xl z-10 bg-black/60 rounded-full w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center border-2 border-white/30">
              {level.id}
            </span>
          </div>

          {/* Completion crown */}
          {isCompleted && (
            <div className="absolute -top-4 sm:-top-6 left-1/2 transform -translate-x-1/2 text-2xl sm:text-3xl md:text-4xl animate-bounce">
              👑
            </div>
          )}

          {/* Lock for unavailable levels */}
          {!isUnlocked && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-3xl sm:text-4xl md:text-5xl opacity-90 bg-black/60 rounded-full p-2 border-2 border-slate-600">
                🔒
              </div>
            </div>
          )}

          {/* ✅ NEW: "Completed" indicator for finished levels */}
          {isCompleted && level.id < gameState.currentLevel && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-green-600/80 rounded-full p-2 border-2 border-green-400">
                <div className="text-2xl">✅</div>
              </div>
            </div>
          )}

          {/* Level type badge */}
          <div className="absolute -bottom-2 sm:-bottom-3 left-1/2 transform -translate-x-1/2">
            <div className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold text-white shadow-lg ${
              level.type === 'basic' ? 'bg-emerald-600' : 
              level.type === 'intermediate' ? 'bg-sky-600' : 
              level.type === 'advanced' ? 'bg-violet-600' : 
              level.type === 'expert' ? 'bg-rose-600' :
              'bg-amber-600'
            }`}>
              {level.type.charAt(0).toUpperCase() + level.type.slice(1)}
            </div>
          </div>

          {/* Hover tooltip */}
          <div className="absolute top-full mt-4 sm:mt-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
            <div className="bg-slate-900/95 backdrop-blur-sm rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-white text-sm sm:text-base max-w-64 sm:max-w-80 text-center border-2 border-slate-700 shadow-2xl">
              <div className="pixel-font font-bold mb-2 sm:mb-3 text-cyan-300 text-lg">
                Level {level.id}
              </div>
              <div className="text-xs sm:text-sm text-slate-300 mb-2 sm:mb-3 leading-tight font-mono bg-slate-800/50 rounded-lg p-2">
                {level.title}
              </div>
              
              {/* ✅ NEW: Status indicators */}
              {isCompleted && level.id < gameState.currentLevel && (
                <div className="text-xs text-green-400 mb-2">✅ Completed - Cannot replay</div>
              )}
              {!isClickable && isUnlocked && (
                <div className="text-xs text-yellow-400 mb-2">🚫 Complete current level first</div>
              )}
              
              <div className={`text-xs sm:text-sm px-3 py-1.5 rounded-full inline-block font-semibold ${
                level.type === 'basic' ? 'bg-emerald-600' : 
                level.type === 'intermediate' ? 'bg-sky-600' : 
                level.type === 'advanced' ? 'bg-violet-600' : 
                level.type === 'expert' ? 'bg-rose-600' :
                'bg-amber-600'
              }`}>
                {level.type.charAt(0).toUpperCase() + level.type.slice(1)} Level
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ✅ FIXED: Using actual wizard asset
  const renderCharacter = () => {
    return (
      <div 
        className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-in-out ${isMoving ? 'scale-125' : 'scale-100'}`} 
        style={{ 
          left: `${characterPosition.x}%`, 
          top: `${characterPosition.y}%`, 
          zIndex: 10, 
          transform: `translate(-50%, -50%) scale(${mapScale * (isMoving ? 1.25 : 1)})` 
        }}
      >
        <div className="relative">
          <div className="absolute inset-0 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-purple-500/30 via-blue-500/30 to-cyan-500/30 rounded-full animate-pulse transform -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2" />
          
          {/* ✅ USING ACTUAL WIZARD ASSET */}
          <img 
            src={ASSETS.wizard} 
            alt="Wizard Character" 
            className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-2xl filter brightness-110" 
            onError={(e) => { 
              e.target.style.display = 'none'; 
              e.target.nextSibling.style.display = 'block'; 
            }} 
          />
          
          {/* Fallback wizard */}
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-800 via-purple-700 to-slate-800 rounded-full border-3 sm:border-4 border-cyan-300 shadow-2xl shadow-cyan-500/50 hidden">
            <div className="absolute inset-0 flex items-center justify-center text-xl sm:text-3xl">
              🧙‍♂️
            </div>
          </div>

          {isMoving && (
            <div className="absolute inset-0 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-cyan-400/50 to-purple-400/50 rounded-full animate-ping" />
          )}
        </div>
      </div>
    );
  };

  // ✅ FIXED: Using actual castle asset
  const renderCastle = () => {
    const lastLevel = updatedLevels[updatedLevels.length - 1];
    const CASTLE_Y_OFFSET = 5;
    
    return (
      <div 
        className="absolute pointer-events-none" 
        style={{ 
          left: `${lastLevel.x}%`, 
          top: `${lastLevel.y + CASTLE_Y_OFFSET -20}%`, 
          transform: `translate(-50%, -50%) scale(${mapScale})`, 
          zIndex: 6 
        }}
      >
        {/* ✅ USING ACTUAL CASTLE ASSET */}
        <img 
          src={ASSETS.castle} 
          alt="Final Castle" 
          className="w-32 h-40 sm:w-40 sm:h-48 md:w-48 md:h-56 object-contain drop-shadow-2xl filter brightness-105" 
          onError={(e) => e.target.style.display = 'none'} 
        />
      </div>
    );
  };

  // Game Over screen
  if (isGameOver) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
        <div className="bg-gradient-to-r from-red-800/80 via-rose-900/80 to-slate-900/80 backdrop-blur-xl rounded-2xl px-6 sm:px-10 py-8 border-2 border-red-500/50 shadow-2xl shadow-red-500/30 text-center">
          <div className="text-5xl mb-4 animate-bounce">💔</div>
          <h1 className="pixel-font text-2xl sm:text-3xl lg:text-4xl font-bold drop-shadow-lg text-red-300">
            Game Over
          </h1>
          <p className="text-base sm:text-lg opacity-90 mt-3 mb-6">
            You have lost all your lives. The realm needs a hero to try again!
          </p>
          <button
            onClick={handleRestart}
            className="pixel-font text-white font-bold bg-gradient-to-r from-red-600 to-rose-700 px-8 py-3 rounded-lg shadow-lg transition-all transform hover:scale-105 hover:shadow-red-500/50 active:scale-100"
          >
            Restart Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-54 bg-gradient-to-b from-slate-900 via-blue-900 to-black relative overflow-hidden">
      {/* Background using your provided image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${ASSETS.mysticalMap})`,
          filter: 'brightness(0.7) contrast(1.1)'
        }}
      />
      
      {/* Mystical overlay effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 via-transparent to-slate-900/40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(30,58,138,0.4),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(67,56,202,0.3),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(15,23,42,0.5),transparent_50%)]" />
        
        {/* Floating magical particles */}
        {[...Array(40)].map((_, i) => (
          <div 
            key={i} 
            className="absolute w-1 h-1 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full animate-pulse" 
            style={{ 
              left: `${Math.random() * 100}%`, 
              top: `${Math.random() * 100}%`, 
              animationDelay: `${Math.random() * 5}s`, 
              animationDuration: `${4 + Math.random() * 6}s` 
            }} 
          />
        ))}
      </div>

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900/90 via-blue-900/90 to-slate-900/90 backdrop-blur-xl border-b border-blue-500/30 shadow-xl">
        <div className="container mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between py-2 sm:py-4 gap-2 sm:gap-4">
            <div className="flex items-center space-x-2 sm:space-x-3 bg-gradient-to-r from-rose-900/60 to-red-900/60 rounded-full px-3 sm:px-4 py-2 border border-rose-500/40 shadow-lg backdrop-blur-sm">
              <span className="pixel-font text-white font-bold text-xs sm:text-sm lg:text-lg">Lives:</span>
              <div className="flex space-x-1 sm:space-x-2">
                {[...Array(3)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`text-base sm:text-lg lg:text-2xl xl:text-3xl transition-all duration-300 ${
                      i < gameState.lives 
                        ? 'text-rose-400 animate-pulse scale-110 drop-shadow-lg filter brightness-125' 
                        : 'text-slate-600 grayscale scale-75 opacity-50'
                    }`}
                  >
                    💖
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex-1 w-full sm:w-auto mx-2 sm:mx-4 lg:mx-8">
              <div className="bg-slate-800/60 rounded-full h-4 sm:h-6 lg:h-8 overflow-hidden border-2 border-blue-500/30 shadow-inner backdrop-blur-sm">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 transition-all duration-1000 ease-out relative overflow-hidden" 
                  style={{ width: `${(gameState.progress.length / levels.length) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-white/30 animate-pulse" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10" />
                </div>
              </div>
              <div className="text-center mt-1 sm:mt-2">
                <span className="pixel-font text-blue-300 text-xs sm:text-sm lg:text-base font-bold drop-shadow">
                  {gameState.progress.length}/{levels.length} Quests Completed
                </span>
              </div>
            </div>
            
            <div className="text-center sm:text-right bg-gradient-to-r from-blue-900/60 to-purple-900/60 rounded-full px-3 sm:px-4 py-2 border border-blue-500/40 shadow-lg backdrop-blur-sm">
              <div className="pixel-font text-blue-300 font-bold text-sm sm:text-lg lg:text-xl drop-shadow-lg">
                Level {Math.min(gameState.currentLevel, 10)}
              </div>
              <div className="text-blue-400 text-xs sm:text-sm font-medium">SQL Quest</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main map area */}
      <div className="pt-20 sm:pt-24 lg:pt-32 pb-4 sm:pb-8">
        <div 
          className="relative w-full mx-auto container" 
          style={{ 
            height: window.innerWidth < 480 ? '140vh' : window.innerWidth < 768 ? '130vh' : '150vh', 
            maxWidth: '100vw' 
          }}
        >
          {renderTreeDecorations()}
          {renderBushDecorations()}
          {renderBirdAnimations()}
          {renderRockPath()}
          {updatedLevels.map(renderLevel)}
          {renderCharacter()}
          {renderCastle()}
        </div>
      </div>
      
      {/* Bottom UI */}
      <div className="fixed bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        {isGameWon ? (
          <div className="bg-gradient-to-r from-amber-500/80 via-yellow-400/80 to-amber-500/80 backdrop-blur-xl rounded-2xl px-6 sm:px-10 py-4 border-2 border-yellow-300/50 shadow-2xl shadow-yellow-400/30">
            <div className="pixel-font text-white text-center">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold drop-shadow-lg animate-pulse">
                🏆 You Conquered the Quest! 🏆
              </div>
              <p className="text-sm opacity-90 mt-2 mb-4">You are a true SQL Quest Master!</p>
              <button
                onClick={handleRestart}
                className="pixel-font text-yellow-900 font-bold bg-gradient-to-r from-yellow-300 to-amber-400 px-6 py-2 rounded-lg shadow-lg transition-all transform hover:scale-105 hover:shadow-yellow-300/50"
              >
                Replay Game
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-slate-900/80 via-blue-900/80 to-slate-900/80 backdrop-blur-xl rounded-2xl px-4 sm:px-8 py-3 sm:py-4 border-2 border-blue-500/30 shadow-2xl">
            <div className="pixel-font text-blue-300 text-center">
              <div className="text-sm sm:text-base lg:text-lg font-bold">🗺️ Mystical SQL Realm</div>
              <div className="text-xs sm:text-sm opacity-90 mt-1">Follow the path • Click portals to begin your quest</div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes float { 
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); } 
          25% { transform: translateY(-6px) translateX(2px) rotate(1deg); } 
          50% { transform: translateY(-12px) translateX(4px) rotate(0deg); } 
          75% { transform: translateY(-6px) translateX(2px) rotate(-1deg); } 
        }
        @keyframes wing { 
          0%, 100% { transform: rotate(0deg) scaleY(1); } 
          50% { transform: rotate(-12deg) scaleY(0.8); } 
        }
        @keyframes shimmer { 
          0% { transform: translateX(-100%); } 
          100% { transform: translateX(100%); } 
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-wing { animation: wing 0.3s ease-in-out infinite; }
        .animate-shimmer { animation: shimmer 2.5s ease-in-out infinite; }
        .pixel-font { 
          font-family: 'Courier New', monospace; 
          text-shadow: 2px 2px 0px rgba(0,0,0,0.8); 
        }
        @media (max-width: 640px) { 
          .pixel-font { text-shadow: 1px 1px 0px rgba(0,0,0,0.8); } 
        }
      `}</style>
    </div>
  );
};

export default MapMainView;
