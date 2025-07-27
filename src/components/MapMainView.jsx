import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { updateState } from "../redux/gameSlice";
import { useNavigate } from "react-router-dom";
import { levels, levelPaths, pathUtils } from "../assets/data/levels";

// Helper hook to remember the previous value of a state or prop
function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

// Asset URLs
const ASSETS = {
  wizard: "/wizard-character.png",
  bird: "/magical-bird.png",
  tree: "/magical-tree.png",
  castle: "/castle.png",
  cage: "/cage.png",
  river: "/river-segment.png",
  bush: "/bush.png",
  rock: "/rock.png",
  portal: "/portal.png",
  bgMap: "/jungle-map-bg.png", // Background map image
  bgMapMobile: "/bgMap2.png",
};

const MapMainView = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const getWizardPosition = (level) => {
    const basePosition = getLevelPosition(level);
    const isMobileView = window.innerWidth < 768;
    
    if (isMobileView) {
      // Customize these values to adjust wizard position on mobile
      return {
        x: basePosition.x +0 ,  // Move 2% to the right
        y: basePosition.y - 2   // Move 5% up
      };
    }
    
    return { x: basePosition.x, y: basePosition.y };
  };
  
  
  // Fixed function to get level position that handles both old and new structure
  const getLevelPosition = (level) => {
    const isMobileView = window.innerWidth < 768;
  
    if (level.position) {
      const pos = isMobileView ? level.position.mobile : level.position.desktop;
      return {
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        x: pos.x,
        y: pos.y
      };
    }
  
    // Fallback if structure is missing
    return {
      left: `${level.x ?? 0}%`,
      top: `${level.y ?? 0}%`,
      x: level.x ?? 0,
      y: level.y ?? 0
    };
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const gameState = useSelector(
    (state) =>
      state.game || {
        lives: 3,
        currentLevel: 1,
        progress: [],
        skipCount: 0,
        videoWatched: false,
      }
  );

  // FIXED: Proper level access logic
  const updatedLevels = useMemo(
    () =>
      levels.map((level) => {
        const isCompleted = gameState.progress.includes(level.id);
        const isCurrentLevel = level.id === gameState.currentLevel;
        // A level is unlocked if:
        // 1. It's level 1 (always accessible)
        // 2. It's completed (user can replay)
        // 3. It's the current level (user can access current level)
        const isUnlocked = level.id === 1 || isCompleted || isCurrentLevel;
        
        return {
          ...level,
          unlocked: isUnlocked,
          completed: isCompleted,
          // Add position data to the level object for easier access
          ...getLevelPosition(level)
        };
      }),
    [gameState.currentLevel, gameState.progress, isMobile]
  );

  // Find the initial level data to correctly position the character on load
  const initialLevelData = useMemo(
    () => updatedLevels.find((level) => level.id === gameState.currentLevel),
    [gameState.currentLevel, updatedLevels]
  );

  const [characterPosition, setCharacterPosition] = useState(() => {
    if (initialLevelData) {
      return getWizardPosition(initialLevelData);
    }
    const level1Position = getLevelPosition(levels[0]);
    return getWizardPosition({ ...levels[0], ...level1Position });
  });

  const [isMoving, setIsMoving] = useState(false);
  const [isFollowingPath, setIsFollowingPath] = useState(false);
  const [pathTrail, setPathTrail] = useState([]);
  const [mapScale, setMapScale] = useState(1);
  const [bgImageLoaded, setBgImageLoaded] = useState(false);

  const previousCurrentLevelId = usePrevious(gameState.currentLevel);
  const animationRef = useRef();

  // Check game win and game over conditions
  const isGameWon = gameState.progress.length >= levels.length;
  const isGameOver = gameState.lives <= 0;

  // Function to handle restarting or replaying the game
  const handleRestart = () => {
    localStorage.removeItem("sql-quest-game");
    dispatch(
      updateState({
        currentLevel: 1,
        progress: [],
        lives: 3,
        skipCount: 0,
        videoWatched: false,
      })
    );
    window.location.reload();
  };

  // Enhanced responsive handling
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 480) setMapScale(0.65);
      else if (width < 768) setMapScale(0.75);
      else if (width < 1024) setMapScale(0.85);
      else setMapScale(1);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

 // FIXED: Simplified level completion handler
 const handleLevelComplete = (completedLevelId) => {
  const wasAlreadyCompleted = gameState.progress.includes(completedLevelId);
  
  if (wasAlreadyCompleted) {
    // If replaying, just return to the current level (no change needed)
    return;
  }

  // For first-time completion, advance to next level
  const nextLevelId = completedLevelId + 1;
  const path = levelPaths[completedLevelId];

  if (path && nextLevelId <= levels.length) {
    setIsFollowingPath(true);
    setIsMoving(true);

    const smoothPath = pathUtils.createSmoothPath(path, 30);
    const curvedPath = pathUtils.addCurveToPath(smoothPath, 0.05);
    setPathTrail(curvedPath);

    animateAlongPath(curvedPath, () => {
      dispatch(
        updateState({
          currentLevel: nextLevelId,
          progress: [...gameState.progress, completedLevelId],
        })
      );
      setIsFollowingPath(false);
      setIsMoving(false);
      setPathTrail([]);
    });
  } else {
    // If no path or it's the last level, just update progress
    dispatch(
      updateState({
        progress: [...gameState.progress, completedLevelId],
      })
    );
  }
};

  // Function to animate character along a path
  const animateAlongPath = (path, onComplete) => {
    if (path.length < 2) {
      onComplete();
      return;
    }

    let segment = 0;
    let t = 0;
    const speed = 0.002; // Lower = slower

    function lerp(a, b, t) {
      return a + (b - a) * t;
    }

    function animate() {
      if (segment >= path.length - 1) {
        setCharacterPosition(path[path.length - 1]);
        onComplete();
        return;
      }

      const start = path[segment];
      const end = path[segment + 1];

      setCharacterPosition({
        x: lerp(start.x, end.x, t),
        y: lerp(start.y, end.y, t),
      });

      t += speed;
      if (t >= 1) {
        t = 0;
        segment++;
      }
      animationRef.current = requestAnimationFrame(animate);
    }

    animate();
  };

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Animate character movement when currentLevel changes (for user clicks)
  useEffect(() => {
    const currentLevelData = updatedLevels.find(
      (level) => level.id === gameState.currentLevel
    );

    if (
      previousCurrentLevelId &&
      previousCurrentLevelId !== gameState.currentLevel &&
      currentLevelData &&
      !isFollowingPath // Don't interfere with path following
    ) {
      setIsMoving(true);
      setTimeout(() => {
        setCharacterPosition(getWizardPosition(currentLevelData));
        setTimeout(() => {
          setIsMoving(false);
        }, 800);
      }, 100);
    } else if (
      currentLevelData &&
      (characterPosition.x !== currentLevelData.x ||
        characterPosition.y !== currentLevelData.y) &&
      !isFollowingPath
    ) {
      setCharacterPosition(getWizardPosition(currentLevelData));
    }
  }, [
    gameState.currentLevel,
    previousCurrentLevelId,
    updatedLevels,
    characterPosition,
    isFollowingPath,
  ]);

  // FIXED: Simplified level click handler with proper access control
  const handleLevelClick = (level) => {
    // Prevent any action during game over or path following
    if (isGameOver || isFollowingPath) return;
    
    // FIXED: Only allow clicks on unlocked levels
    if (!level.unlocked) {
      console.log(`Level ${level.id} is locked!`);
      return;
    }

    // If clicking a different level, move to it
    if (level.id !== gameState.currentLevel) {
      setIsMoving(true);
      const pathKey = `${gameState.currentLevel}-${level.id}`;
      const path = levelPaths[pathKey];
      
      if (path && path.length > 1) {
        // Animate along the custom path
        animateAlongPath(path, () => {
          dispatch(updateState({ currentLevel: level.id }));
          setCharacterPosition({ x: level.x, y: level.y });
          setTimeout(() => {
            setIsMoving(false);
            navigate(`/level/${level.id}`);
          }, 800);
        });
      } else {
        // Fallback: straight line movement
        setTimeout(() => {
          dispatch(updateState({ currentLevel: level.id }));
          setCharacterPosition({ x: level.x, y: level.y });
          setTimeout(() => {
            setIsMoving(false);
            navigate(`/level/${level.id}`);
          }, 800);
        }, 200);
      }
    } else {
      // If clicking current level, directly navigate to it
      navigate(`/level/${level.id}`);
    }
  };

  // Function to expose level completion handler
  const completeLevelAndMoveNext = (levelId) => {
    handleLevelComplete(levelId);
  };

  // Make the function available globally
  useEffect(() => {
    window.completeLevelAndMoveNext = completeLevelAndMoveNext;
    return () => {
      delete window.completeLevelAndMoveNext;
    };
  }, []);

  // Get responsive element sizes based on map scale
  const getResponsiveSizes = () => {
    if (mapScale <= 0.65) {
      return {
        levelSize: "w-8 h-8",
        levelGlow: "w-12 h-12",
        characterSize: "w-10 h-10",
        characterGlow: "w-14 h-14",
        textSize: "text-xs",
        badgeText: "text-xs",
        crownOffset: "-top-4",
        badgeOffset: "-bottom-4",
        tooltipOffset: "mt-4",
        tooltipWidth: "max-w-48",
      };
    } else if (mapScale <= 0.75) {
      return {
        levelSize: "w-10 h-10",
        levelGlow: "w-14 h-14",
        characterSize: "w-12 h-12",
        characterGlow: "w-16 h-16",
        textSize: "text-sm",
        badgeText: "text-xs",
        crownOffset: "-top-5",
        badgeOffset: "-bottom-5",
        tooltipOffset: "mt-5",
        tooltipWidth: "max-w-56",
      };
    } else if (mapScale <= 0.85) {
      return {
        levelSize: "w-12 h-12",
        levelGlow: "w-16 h-16",
        characterSize: "w-14 h-14",
        characterGlow: "w-18 h-18",
        textSize: "text-base",
        badgeText: "text-sm",
        crownOffset: "-top-6",
        badgeOffset: "-bottom-6",
        tooltipOffset: "mt-6",
        tooltipWidth: "max-w-64",
      };
    } else {
      return {
        levelSize: "w-16 h-16",
        levelGlow: "w-20 h-20",
        characterSize: "w-16 h-16",
        characterGlow: "w-20 h-20",
        textSize: "text-xl",
        badgeText: "text-sm",
        crownOffset: "-top-8",
        badgeOffset: "-bottom-8",
        tooltipOffset: "mt-8",
        tooltipWidth: "max-w-72",
      };
    }
  };

  // Enhanced Level rendering with responsive scaling
  const renderLevel = (level) => {
    const isCurrentLevel = level.id === gameState.currentLevel;
    const isCompleted = level.completed;
    const isUnlocked = level.unlocked;
    const sizes = getResponsiveSizes();

    return (
      <div
        key={level.id}
        className={`absolute transform -translate-x-1/2 -translate-y-1/2 group ${
          isUnlocked ? 'cursor-pointer' : 'cursor-not-allowed'
        }`}
        style={{
          left: level.left,
          top: level.top,
          zIndex: 20,
          transform: `translate(-50%, -50%) scale(${mapScale})`,
        }}
        onClick={() => handleLevelClick(level)}
      >
        <div className="relative">
          {/* Responsive glowing base effect */}
          <div
            className={`absolute inset-0 ${
              sizes.levelGlow
            } rounded-full transition-all duration-500 ${
              isCompleted
                ? "bg-gradient-to-r from-yellow-400/40 via-amber-400/40 to-yellow-400/40 animate-pulse shadow-2xl shadow-yellow-400/60"
                : isCurrentLevel
                ? "bg-gradient-to-r from-cyan-400/40 via-blue-400/40 to-purple-400/40 animate-pulse shadow-2xl shadow-cyan-400/60"
                : isUnlocked
                ? "bg-gradient-to-r from-blue-400/30 via-purple-400/30 to-cyan-400/30 shadow-lg shadow-blue-400/40"
                : "bg-gradient-to-r from-gray-600/20 to-gray-800/20 shadow-sm"
            } transform -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2`}
          />

          {/* Responsive level circle */}
          <div
            className={`relative ${
              sizes.levelSize
            } rounded-full border-3 transition-all duration-500 flex items-center justify-center animate-zoom-pulse ${
              isCompleted
                ? "bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 border-yellow-200 shadow-lg"
                : isCurrentLevel
                ? "bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-500 border-white shadow-lg animate-pulse"
                : isUnlocked
                ? "bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-600 border-blue-200 shadow-md"
                : "bg-gradient-to-br from-gray-600 to-gray-800 border-gray-500 opacity-60"
            } ${
              isUnlocked && !isFollowingPath
                ? "group-hover:scale-110 group-hover:shadow-2xl"
                : ""
            }`}
          >
            {/* Animated rings for current/completed levels */}
            {(isCurrentLevel || isCompleted) && (
              <>
                <div className="absolute inset-0 rounded-full border-2 border-white/40 animate-ping" />
                <div
                  className="absolute inset-2 rounded-full border-2 border-white/30 animate-ping"
                  style={{ animationDelay: "0.5s" }}
                />
              </>
            )}

            {/* Responsive level number */}
            <span
              className={`pixel-font text-white font-bold ${sizes.textSize} drop-shadow-2xl z-10`}
            >
              {level.id}
            </span>
          </div>

          {/* Responsive completion crown */}
          {isCompleted && (
            <div
              className={`absolute ${sizes.crownOffset} left-1/2 transform -translate-x-1/2 text-2xl animate-bounce`}
            >
              👑
            </div>
          )}

          {/* Responsive lock icon for locked levels */}
          {!isUnlocked && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-2xl opacity-90 bg-black/60 rounded-full p-2 border-2 border-gray-600">
                🔒
              </div>
            </div>
          )}

          {/* Responsive level type badge */}
          <div
            className={`absolute ${sizes.badgeOffset} left-1/2 transform -translate-x-1/2`}
          >
            <div
              className={`px-3 py-1 rounded-full ${
                sizes.badgeText
              } font-bold text-white shadow-lg backdrop-blur-sm ${
                level.type === "basic"
                  ? "bg-emerald-600/90"
                  : level.type === "intermediate"
                  ? "bg-sky-600/90"
                  : level.type === "advanced"
                  ? "bg-violet-600/90"
                  : "bg-rose-600/90"
              }`}
            >
              {level.type.charAt(0).toUpperCase() + level.type.slice(1)}
            </div>
          </div>

          {/* Responsive hover tooltip - only show for unlocked levels */}
          {isUnlocked && (
            <div
              className={`absolute top-full ${sizes.tooltipOffset} left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-30`}
            >
              <div
                className={`bg-slate-900/95 backdrop-blur-sm rounded-2xl px-4 py-3 text-white text-sm ${sizes.tooltipWidth} text-center border-2 border-slate-700 shadow-2xl`}
              >
                <div className="pixel-font font-bold mb-2 text-cyan-300">
                  Level {level.id}
                </div>
                <div className="text-xs text-slate-300 mb-2 leading-tight font-mono bg-slate-800/50 rounded-lg p-2">
                  {level.query}
                </div>
                {isCompleted && (
                  <div className="text-xs text-yellow-300 font-bold">
                    ✅ Completed
                  </div>
                )}
                {isCurrentLevel && !isCompleted && (
                  <div className="text-xs text-cyan-300 font-bold">
                    📍 Current Level
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Enhanced Character with responsive scaling
  const renderCharacter = () => {
    const sizes = getResponsiveSizes();

    return (
      <div
        className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ease-in-out ${
          isMoving || isFollowingPath ? "scale-125" : "scale-100"
        }`}
        style={{
          left: `${characterPosition.x}%`,
          top: `${characterPosition.y}%`,
          zIndex: 25,
          transform: `translate(-50%, -50%) scale(${
            mapScale * (isMoving || isFollowingPath ? 1.25 : 1)
          })`,
        }}
      >
        <div className="relative">
          {/* Enhanced character glow - responsive */}
          <div
            className={`absolute inset-0 ${
              sizes.characterGlow
            } rounded-full animate-pulse transform -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 ${
              isFollowingPath
                ? "bg-gradient-to-r from-yellow-400/60 via-orange-400/60 to-red-400/60 shadow-2xl shadow-orange-400/80"
                : "bg-gradient-to-r from-purple-500/40 via-blue-500/40 to-cyan-500/40"
            }`}
          />

          {/* Responsive character image */}
          <div className="relative">
            <img
              src={ASSETS.wizard}
              alt="Wizard Character"
              className={`${
                sizes.characterSize
              } object-contain drop-shadow-2xl filter ${
                isFollowingPath
                  ? "brightness-125 saturate-150"
                  : "brightness-110"
              }`}
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "block";
              }}
            />
            <div
              className={`${sizes.characterSize} bg-gradient-to-br from-indigo-800 via-purple-700 to-slate-800 rounded-full border-3 border-cyan-300 shadow-2xl shadow-cyan-500/50 hidden`}
            >
              <div className="absolute inset-0 flex items-center justify-center text-3xl">
                🧙‍♂️
              </div>
            </div>
          </div>

          {/* Enhanced movement effects for path following */}
          {isFollowingPath && (
            <>
              <div
                className={`absolute inset-0 ${sizes.characterSize} bg-gradient-to-r from-yellow-400/70 to-orange-400/70 rounded-full animate-ping`}
              />
              <div className="absolute -top-2 -right-2 text-yellow-400 animate-bounce">
                ✨
              </div>
              <div
                className="absolute -bottom-2 -left-2 text-orange-400 animate-bounce"
                style={{ animationDelay: "0.2s" }}
              >
                🔥
              </div>
              <div
                className="absolute -top-2 -left-2 text-red-400 animate-bounce"
                style={{ animationDelay: "0.4s" }}
              >
                ⭐
              </div>
            </>
          )}

          {/* Regular movement effect */}
          {isMoving && !isFollowingPath && (
            <div
              className={`absolute inset-0 ${sizes.characterSize} bg-gradient-to-r from-cyan-400/50 to-purple-400/50 rounded-full animate-ping`}
            />
          )}
        </div>
      </div>
    );
  };

  // Render path trail visualization with responsive sizing
  const renderPathTrail = () => {
    if (!isFollowingPath || pathTrail.length === 0) return null;

    const dotSize =
      mapScale <= 0.65
        ? "w-1 h-1"
        : mapScale <= 0.85
        ? "w-1.5 h-1.5"
        : "w-2 h-2";

    return pathTrail.map((point, index) => (
      <div
        key={`trail-${index}`}
        className={`absolute ${dotSize} bg-gradient-to-r from-yellow-400/60 to-orange-400/40 rounded-full animate-pulse`}
        style={{
          left: `${point.x}%`,
          top: `${point.y}%`,
          zIndex: 15,
          animationDelay: `${index * 0.02}s`,
          transform: `translate(-50%, -50%) scale(${mapScale})`,
          opacity: Math.max(0.3, 1 - index / pathTrail.length),
        }}
      />
    ));
  };

  // Responsive floating particles for magical atmosphere
  const renderMagicalParticles = () => {
    const particleCount = mapScale <= 0.65 ? 8 : mapScale <= 0.85 ? 10 : 15;
    const particleSize = mapScale <= 0.75 ? "w-1 h-1" : "w-2 h-2";

    return (
      <>
        {[...Array(particleCount)].map((_, i) => (
          <div
            key={`particle-${i}`}
            className={`absolute ${particleSize} bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full animate-float opacity-60`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 4}s`,
              zIndex: 15,
              transform: `scale(${mapScale})`,
            }}
          />
        ))}
      </>
    );
  };

  // Render Game Over screen if all lives are lost
  if (isGameOver) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
        <div className="bg-gradient-to-r from-red-800/80 via-rose-900/80 to-slate-900/80 backdrop-blur-xl rounded-2xl px-6 sm:px-10 py-8 border-2 border-red-500/50 shadow-2xl shadow-red-500/30 text-center max-w-md w-full">
          <div className="text-4xl sm:text-5xl mb-4 animate-bounce">💔</div>
          <h1 className="pixel-font text-xl sm:text-2xl lg:text-3xl font-bold drop-shadow-lg text-red-300 mb-3">
            Game Over
          </h1>
          <p className="text-sm sm:text-base opacity-90 mb-6 leading-relaxed">
            You have lost all your lives. The realm needs a hero to try again!
          </p>
          <button
            onClick={handleRestart}
            className="pixel-font text-white font-bold bg-gradient-to-r from-red-600 to-rose-700 px-6 sm:px-8 py-3 rounded-lg shadow-lg transition-all transform hover:scale-105 hover:shadow-red-500/50 active:scale-100 w-full sm:w-auto"
          >
            Restart Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-54 relative overflow-hidden">
      {/* Background Image Container */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <img
          src={isMobile ? ASSETS.bgMapMobile : ASSETS.bgMap}
          alt="SQL Quest Map Background"
          className="w-full h-full object-fill object-center bg-drift"
          style={{
            imageRendering: "crisp-edges",
            filter: "brightness(0.85) contrast(1.1) saturate(1.2)",
          }}
          onLoad={() => setBgImageLoaded(true)}
          onError={(e) => {
            console.warn(
              "Background image failed to load, falling back to gradient"
            );
            e.target.style.display = "none";
            e.target.nextSibling.style.display = "block";
          }}
        />
        {/* Fallback gradient background */}
        <div
          className="w-full h-full bg-gradient-to-b from-slate-900 via-blue-900 to-black hidden"
          style={{ display: bgImageLoaded ? "none" : "block" }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(30,58,138,0.4),transparent_70%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(67,56,202,0.3),transparent_50%)]" />
        </div>
      </div>

      {/* Overlay for better contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20 pointer-events-none z-10" />

      {/* Header UI */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900/90 via-blue-900/90 to-slate-900/90 backdrop-blur-xl border-b border-blue-500/30 shadow-xl">
        <div className="container mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between py-2 sm:py-4 gap-2 sm:gap-4">
            <div className="flex items-center space-x-2 sm:space-x-3 bg-gradient-to-r from-rose-900/60 to-red-900/60 rounded-full px-3 sm:px-4 py-2 border border-rose-500/40 shadow-lg backdrop-blur-sm">
              <span className="pixel-font text-white font-bold text-xs sm:text-sm lg:text-lg">Lives:</span>
              <div className="flex space-x-1 sm:space-x-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className={`text-base sm:text-lg lg:text-2xl xl:text-3xl transition-all duration-300 ${
                    i < gameState.lives ? 'text-rose-400 animate-pulse scale-110 drop-shadow-lg filter brightness-125' : 'text-slate-600 grayscale scale-75 opacity-50'
                  }`}>
                    💖
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 w-full sm:w-auto mx-2 sm:mx-4 lg:mx-8">
              <div className="bg-slate-800/60 rounded-full h-4 sm:h-6 lg:h-8 overflow-hidden border-2 border-blue-500/30 shadow-inner backdrop-blur-sm">
                <div className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 transition-all duration-1000 ease-out relative overflow-hidden" style={{ width: `${(gameState.progress.length / levels.length) * 100}%` }}>
                  <div className="absolute inset-0 bg-white/30 animate-pulse" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
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
                Level {gameState.currentLevel}
              </div>
              <div className="text-blue-400 text-xs sm:text-sm font-medium">
                SQL Quest
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Main Map Content */}
      <div className="pt-20 sm:pt-24 lg:pt-32 pb-4 sm:pb-8">
        <div
          className="relative w-full mx-auto container"
          style={{
            height:
              window.innerWidth < 480
                ? "120vh"
                : window.innerWidth < 768
                ? "125vh"
                : window.innerWidth < 1024
                ? "135vh"
                : "150vh",
            maxWidth: "100vw",
          }}
        >
          {/* Responsive magical particles */}
          {renderMagicalParticles()}

          {/* Path trail visualization */}
          {renderPathTrail()}

          {/* Game elements */}
          {updatedLevels.map(renderLevel)}
          {renderCharacter()}
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
          0%,
          100% {
            transform: translateY(0px) translateX(0px);
          }
          25% {
            transform: translateY(-6px) translateX(2px);
          }
          50% {
            transform: translateY(-12px) translateX(4px);
          }
          75% {
            transform: translateY(-6px) translateX(2px);
          }
        }
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        @keyframes zoom-pulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.13);
          }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-shimmer {
          animation: shimmer 2.5s ease-in-out infinite;
        }
        .animate-zoom-pulse {
          animation: zoom-pulse 2.2s ease-in-out infinite;
        }
        .pixel-font {
          font-family: "Courier New", monospace;
          text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.8);
        }
        .bg-drift {
          animation: bg-drift 24s linear infinite alternate;
        }
        @keyframes bg-drift {
          0% {
            transform: scale(1.03) translate(0px, 0px);
          }
          100% {
            transform: scale(1.08) translate(-18px, -12px);
          }
        }

        /* Mobile optimizations */
        @media (max-width: 640px) {
          .pixel-font {
            text-shadow: 1px 1px 0px rgba(0, 0, 0, 0.8);
          }
        }

        /* Touch-friendly sizing for mobile */
        @media (max-width: 480px) {
          .group {
            min-width: 44px;
            min-height: 44px;
          }
        }

        /* Prevent zoom on double tap for iOS */
        * {
          touch-action: manipulation;
        }

        /* Improved tap targets for mobile */
        @media (hover: none) and (pointer: coarse) {
          .group {
            min-width: 48px;
            min-height: 48px;
          }
        }
      `}</style>
    </div>
  );
};

export default MapMainView;