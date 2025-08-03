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
  bgMap: "/jungle_map_bg.png",
  bgMapMobile: "/bgMap2.png",
};

const MapMainView = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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

  // ✅ FIXED: Get wizard position with proper mobile adjustments
  const getWizardPosition = (level) => {
    const basePosition = getLevelPosition(level);
    const isMobileView = window.innerWidth < 768;

    if (isMobileView) {
      return {
        x: basePosition.x + 0,
        y: basePosition.y - 2,
      };
    }

    return { x: basePosition.x, y: basePosition.y };
  };

  // ✅ FIXED: Enhanced level position handler
  const getLevelPosition = (level) => {
    const isMobileView = window.innerWidth < 768;

    if (level.position) {
      const pos = isMobileView ? level.position.mobile : level.position.desktop;
      return {
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        x: pos.x,
        y: pos.y,
      };
    }

    // Fallback
    return {
      left: `${level.x ?? 0}%`,
      top: `${level.y ?? 0}%`,
      x: level.x ?? 0,
      y: level.y ?? 0,
    };
  };

  // ✅ ENHANCED: Responsive handler
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ✅ FIXED: Proper level access logic - prevent going back to completed levels
  const updatedLevels = useMemo(
    () =>
      levels.map((level) => {
        const isCompleted = gameState.progress.includes(level.id);
        const isCurrentLevel = level.id === gameState.currentLevel;

        // ✅ KEY CHANGE: More restrictive unlocking logic
        // Level is unlocked if:
        // 1. It's level 1 (starting point)
        // 2. It's the current level
        // 3. It's the next level after current (for progression)
        const isUnlocked =
          level.id === 1 ||
          level.id <= gameState.currentLevel ||
          gameState.progress.includes(level.id - 1);

        return {
          ...level,
          unlocked: isUnlocked,
          completed: isCompleted,
          ...getLevelPosition(level),
        };
      }),
    [gameState.currentLevel, gameState.progress, isMobile]
  );

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
  const [showLevelCompleteAnimation, setShowLevelCompleteAnimation] =
    useState(false);
  const [completingLevel, setCompletingLevel] = useState(null);

  const previousCurrentLevelId = usePrevious(gameState.currentLevel);
  const animationRef = useRef();

  // ✅ ENHANCED: Game state checks
  const isGameWon = gameState.progress.length >= levels.length;
  const isGameOver = gameState.lives <= 0;

  // ✅ ENHANCED: Restart handler
  const handleRestart = () => {
    localStorage.removeItem("sql-quest-game");
    // ✅ FIXED: Also remove our new localStorage flag when the game restarts.
    localStorage.removeItem("videoWatched");
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

  // ✅ ENHANCED: Responsive scaling
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

  // ✅ ENHANCED: Level completion with celebration animation
  const handleLevelComplete = (completedLevelId) => {
    const wasAlreadyCompleted = gameState.progress.includes(completedLevelId);

    if (wasAlreadyCompleted) {
      console.log("Level already completed, no progression needed");
      return;
    }

    // ✅ NEW: Show completion animation
    setCompletingLevel(completedLevelId);
    setShowLevelCompleteAnimation(true);

    // ✅ ENHANCED: Celebration sequence
    setTimeout(() => {
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
          setShowLevelCompleteAnimation(false);
          setCompletingLevel(null);
        });
      } else {
        // Last level completed
        dispatch(
          updateState({
            progress: [...gameState.progress, completedLevelId],
          })
        );
        setShowLevelCompleteAnimation(false);
        setCompletingLevel(null);
      }
    }, 2000); // Show celebration for 2 seconds
  };

  // ✅ ENHANCED: Path animation
  const animateAlongPath = (path, onComplete) => {
    if (path.length < 2) {
      onComplete();
      return;
    }

    let segment = 0;
    let t = 0;
    const speed = 0.002;

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

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // ✅ ENHANCED: Character movement on level changes
  useEffect(() => {
    const currentLevelData = updatedLevels.find(
      (level) => level.id === gameState.currentLevel
    );

    if (
      previousCurrentLevelId &&
      previousCurrentLevelId !== gameState.currentLevel &&
      currentLevelData &&
      !isFollowingPath
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

  // ✅ ENHANCED: Level click handler with strict access control
  const handleLevelClick = (level) => {
    // ✅ ENHANCED: Prevent all interactions during these states
    if (isGameOver || isFollowingPath || showLevelCompleteAnimation) {
      console.log("Interaction blocked - game state prevents level clicks");
      return;
    }

    // ✅ ENHANCED: Only allow clicks on properly unlocked levels
    if (!level.unlocked) {
      console.log(`Level ${level.id} is locked!`);
      // ✅ NEW: Show visual feedback for locked levels
      showLockedLevelFeedback(level.id);
      return;
    }

    // ✅ ENHANCED: Prevent going back to completed levels
    if (level.completed && level.id < gameState.currentLevel) {
      console.log(`Cannot replay completed level ${level.id}`);
      showCompletedLevelFeedback(level.id);
      return;
    }

    // Navigate to level
    if (level.id !== gameState.currentLevel) {
      setIsMoving(true);
      setTimeout(() => {
        dispatch(updateState({ currentLevel: level.id }));
        setCharacterPosition(getWizardPosition(level));
        setTimeout(() => {
          setIsMoving(false);
          navigate(`/level/${level.id}`);
        }, 800);
      }, 200);
    } else {
      navigate(`/level/${level.id}`);
    }
  };

  // ✅ NEW: Visual feedback functions
  const showLockedLevelFeedback = (levelId) => {
    // Create temporary locked feedback
    const element = document.querySelector(`[data-level-id="${levelId}"]`);
    if (element) {
      element.classList.add("shake-animation");
      setTimeout(() => {
        element.classList.remove("shake-animation");
      }, 600);
    }
  };

  const showCompletedLevelFeedback = (levelId) => {
    // Create temporary completed feedback
    console.log(`Level ${levelId} is already completed!`);
  };

  // ✅ ENHANCED: Global level completion handler
  const completeLevelAndMoveNext = (levelId) => {
    handleLevelComplete(levelId);
  };

  useEffect(() => {
    window.completeLevelAndMoveNext = completeLevelAndMoveNext;
    return () => {
      delete window.completeLevelAndMoveNext;
    };
  }, []);

  // ✅ ENHANCED: Responsive sizes
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

  // ✅ ENHANCED: Level rendering with better access control
  const renderLevel = (level) => {
    const isCurrentLevel = level.id === gameState.currentLevel;
    const isCompleted = level.completed;
    const isUnlocked = level.unlocked;
    const sizes = getResponsiveSizes();

    // ✅ NEW: Determine if level is actually clickable
    const isClickable =
      isUnlocked &&
      !showLevelCompleteAnimation &&
      !isFollowingPath &&
      !isGameOver &&
      !(isCompleted && level.id < gameState.currentLevel);

    return (
      <div
        key={level.id}
        data-level-id={level.id}
        className={`absolute transform -translate-x-1/2 -translate-y-1/2 group ${
          isClickable ? "cursor-pointer" : "cursor-not-allowed"
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
          {/* ✅ ENHANCED: Level glow with better states */}
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

          {/* ✅ ENHANCED: Level circle with completion animation */}
          <div
            className={`relative ${
              sizes.levelSize
            } rounded-full border-3 transition-all duration-500 flex items-center justify-center ${
              completingLevel === level.id
                ? "animate-celebration"
                : "animate-zoom-pulse"
            } ${
              isCompleted
                ? "bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 border-yellow-200 shadow-lg"
                : isCurrentLevel
                ? "bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-500 border-white shadow-lg animate-pulse"
                : isUnlocked
                ? "bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-600 border-blue-200 shadow-md"
                : "bg-gradient-to-br from-gray-600 to-gray-800 border-gray-500 opacity-60"
            } ${
              isClickable ? "group-hover:scale-110 group-hover:shadow-2xl" : ""
            }`}
          >
            {/* Enhanced rings for special states */}
            {(isCurrentLevel ||
              isCompleted ||
              completingLevel === level.id) && (
              <>
                <div className="absolute inset-0 rounded-full border-2 border-white/40 animate-ping" />
                <div
                  className="absolute inset-2 rounded-full border-2 border-white/30 animate-ping"
                  style={{ animationDelay: "0.5s" }}
                />
                {completingLevel === level.id && (
                  <div
                    className="absolute inset-4 rounded-full border-2 border-yellow-400/60 animate-ping"
                    style={{ animationDelay: "1s" }}
                  />
                )}
              </>
            )}

            {/* Level number */}
            <span
              className={`pixel-font text-white font-bold ${sizes.textSize} drop-shadow-2xl z-10`}
            >
              {level.id}
            </span>
          </div>

          {/* ✅ ENHANCED: Completion crown with animation */}
          {isCompleted && (
            <div
              className={`absolute ${
                sizes.crownOffset
              } left-1/2 transform -translate-x-1/2 text-2xl ${
                completingLevel === level.id
                  ? "animate-bounce-celebration"
                  : "animate-bounce"
              }`}
            >
              👑
            </div>
          )}

          {/* ✅ ENHANCED: Lock with shake animation for feedback */}
          {!isUnlocked && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-2xl opacity-90 bg-black/60 rounded-full p-2 border-2 border-gray-600">
                🔒
              </div>
            </div>
          )}

          {/* ✅ NEW: Blocked indicator for completed levels */}
          {isCompleted && level.id < gameState.currentLevel && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-lg opacity-80 bg-green-600/80 rounded-full p-1 border-2 border-green-400">
                ✅
              </div>
            </div>
          )}

          {/* Level type badge */}
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
                  : level.type === "expert"
                  ? "bg-rose-600/90"
                  : "bg-amber-600/90"
              }`}
            >
              {level.type.charAt(0).toUpperCase() + level.type.slice(1)}
            </div>
          </div>

          {/* ✅ ENHANCED: Tooltip with state information */}
          {
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
                  {level.title}
                </div>
                {isCompleted && level.id < gameState.currentLevel && (
                  <div className="text-xs text-yellow-300 font-bold">
                    ✅ Completed
                  </div>
                )}
                {isCompleted && level.id === gameState.currentLevel && (
                  <div className="text-xs text-green-300 font-bold">
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
          }
        </div>
      </div>
    );
  };

  // ✅ ENHANCED: Character with completion celebration
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
          {/* ✅ ENHANCED: Character glow with celebration mode */}
          <div
            className={`absolute inset-0 ${
              sizes.characterGlow
            } rounded-full animate-pulse transform -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 ${
              showLevelCompleteAnimation
                ? "bg-gradient-to-r from-yellow-400/80 via-orange-400/80 to-red-400/80 shadow-2xl shadow-orange-400/90 animate-celebration-glow"
                : isFollowingPath
                ? "bg-gradient-to-r from-yellow-400/60 via-orange-400/60 to-red-400/60 shadow-2xl shadow-orange-400/80"
                : "bg-gradient-to-r from-purple-500/40 via-blue-500/40 to-cyan-500/40"
            }`}
          />

          {/* Character image */}
          <div className="relative">
            <img
              src={ASSETS.wizard}
              alt="Wizard Character"
              className={`${
                sizes.characterSize
              } object-contain drop-shadow-2xl filter ${
                showLevelCompleteAnimation
                  ? "brightness-150 saturate-200 animate-character-celebration"
                  : isFollowingPath
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

          {/* ✅ NEW: Level completion celebration effects */}
          {showLevelCompleteAnimation && (
            <>
              <div
                className={`absolute inset-0 ${sizes.characterSize} bg-gradient-to-r from-yellow-400/90 to-orange-400/90 rounded-full animate-ping`}
              />
              <div className="absolute -top-6 -right-6 text-yellow-400 text-2xl animate-bounce-celebration">
                🎉
              </div>
              <div
                className="absolute -bottom-6 -left-6 text-orange-400 text-2xl animate-bounce-celebration"
                style={{ animationDelay: "0.2s" }}
              >
                ⭐
              </div>
              <div
                className="absolute -top-6 -left-6 text-red-400 text-2xl animate-bounce-celebration"
                style={{ animationDelay: "0.4s" }}
              >
                🔥
              </div>
              <div
                className="absolute -bottom-6 -right-6 text-yellow-400 text-2xl animate-bounce-celebration"
                style={{ animationDelay: "0.6s" }}
              >
                💫
              </div>
            </>
          )}

          {/* Enhanced path following effects */}
          {isFollowingPath && !showLevelCompleteAnimation && (
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
          {isMoving && !isFollowingPath && !showLevelCompleteAnimation && (
            <div
              className={`absolute inset-0 ${sizes.characterSize} bg-gradient-to-r from-cyan-400/50 to-purple-400/50 rounded-full animate-ping`}
            />
          )}
        </div>
      </div>
    );
  };

  // ✅ ENHANCED: Path trail with celebration mode
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
        className={`absolute ${dotSize} rounded-full animate-pulse ${
          showLevelCompleteAnimation
            ? "bg-gradient-to-r from-yellow-400/80 to-orange-400/60"
            : "bg-gradient-to-r from-yellow-400/60 to-orange-400/40"
        }`}
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

  // ✅ ENHANCED: Magical particles
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

  // ✅ NEW: Level completion celebration overlay
  const renderCompletionCelebration = () => {
    if (!showLevelCompleteAnimation || !completingLevel) return null;

    return (
      <div className="fixed inset-0 z-40 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-orange-400/30 to-red-400/20 animate-celebration-overlay" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="text-6xl animate-bounce-celebration">🎉</div>
        </div>
        <div className="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2">
          <div
            className="text-4xl animate-float"
            style={{ animationDelay: "0.2s" }}
          >
            ⭐
          </div>
        </div>
        <div className="absolute top-3/4 right-1/4 transform translate-x-1/2 translate-y-1/2">
          <div
            className="text-5xl animate-float"
            style={{ animationDelay: "0.4s" }}
          >
            ✨
          </div>
        </div>
        <div className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2 translate-y-1/2">
          <div
            className="text-3xl animate-bounce-celebration"
            style={{ animationDelay: "0.6s" }}
          >
            🏆
          </div>
        </div>
      </div>
    );
  };

  // ✅ ENHANCED: Game Over screen
  if (isGameOver) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-900/50 via-slate-900 to-black flex flex-col items-center justify-center text-white p-4">
        <div className="bg-gradient-to-r from-red-800/90 via-rose-900/90 to-slate-900/90 backdrop-blur-xl rounded-3xl px-8 sm:px-12 py-10 border-2 border-red-500/50 shadow-2xl shadow-red-500/30 text-center max-w-lg w-full">
          <div className="text-6xl sm:text-7xl mb-6 animate-bounce">💀</div>
          <h1 className="pixel-font text-2xl sm:text-3xl lg:text-4xl font-bold drop-shadow-lg text-red-300 mb-4">
            Quest Failed
          </h1>
          <div className="text-lg sm:text-xl mb-2 text-red-100">
            Lives Remaining: <span className="text-red-400 font-bold">0</span>
          </div>
          <p className="text-sm sm:text-base opacity-90 mb-8 leading-relaxed text-red-200">
            The mystical realm has claimed another soul. Your SQL journey ends
            here, but legends never die...
          </p>
          <button
            onClick={handleRestart}
            className="pixel-font text-white font-bold bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 px-8 sm:px-10 py-4 rounded-xl shadow-lg transition-all transform hover:scale-105 hover:shadow-red-500/50 active:scale-100 w-full sm:w-auto text-lg"
          >
            🔄 Begin New Quest
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-60 relative overflow-hidden">
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
      {/* ✅ UPDATED: Smaller, highly transparent header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900/20 via-blue-900/20 to-purple-900/20 backdrop-blur-sm border-b border-blue-500/10 shadow-sm">
        <div className="container mx-auto px-2 sm:px-3 lg:px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between py-1 sm:py-2 gap-1 sm:gap-2">
            {/* ✅ UPDATED: Smaller, more transparent Lives Display */}
            <div className="flex items-center space-x-1 sm:space-x-2 bg-gradient-to-r from-rose-900/30 to-red-900/30 rounded-lg px-2 sm:px-3 py-1 border border-rose-500/20 shadow-sm backdrop-blur-sm">
              <div className="flex items-center space-x-1">
                <span className="pixel-font text-white/90 font-bold text-xs">
                  Lives
                </span>
              </div>
              <div className="flex space-x-0.5">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className={`text-xs transition-all duration-500 ${
                      i < gameState.lives
                        ? "text-rose-400/90 animate-pulse"
                        : "text-slate-600/50 grayscale opacity-30"
                    }`}
                  >
                    💖
                  </div>
                ))}
              </div>
            </div>

            {/* ✅ UPDATED: Smaller, more transparent Progress Bar */}
            <div className="flex-1 w-full sm:w-auto mx-1 sm:mx-2">
              <div className="relative">
                <div className="bg-slate-800/30 rounded-lg h-2 sm:h-3 overflow-hidden border border-blue-500/20 shadow-sm backdrop-blur-sm">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600/80 via-purple-600/80 to-cyan-500/80 transition-all duration-1000 ease-out relative overflow-hidden"
                    style={{
                      width: `${
                        (gameState.progress.length / levels.length) * 100
                      }%`,
                    }}
                  >
                    <div className="absolute inset-0 bg-white/10 animate-pulse" />
                  </div>
                </div>

                <div className="text-center mt-0.5">
                  <span className="pixel-font text-blue-300/90 text-xs font-bold">
                    <span className="inline-block animate-pulse">⚔️</span>{" "}
                    {gameState.progress.length}/{levels.length}{" "}
                    <span className="inline-block animate-pulse">🏆</span>
                  </span>
                </div>
              </div>
            </div>

            {/* ✅ UPDATED: Smaller, more transparent Current Level Display */}
            <div className="text-center sm:text-right bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg px-2 sm:px-3 py-1 border border-blue-500/20 shadow-sm backdrop-blur-sm">
              <div className="flex items-center space-x-1">
                <span className="text-xs animate-spin-slow">🔮</span>
                <div>
                  <div className="pixel-font text-blue-300/90 font-bold text-xs sm:text-sm">
                    {gameState.currentLevel >= levels.length + 1
                      ? "All Levels Completed"
                      : `Level ${gameState.currentLevel}`}
                  </div>
                  <div className="text-blue-400/80 text-xs font-medium">
                    SQL Quest
                  </div>
                </div>
              </div>

              {levels[gameState.currentLevel - 1] && (
                <div className="mt-0.5">
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-xs font-bold text-white/90 shadow-sm ${
                      levels[gameState.currentLevel - 1].type === "basic"
                        ? "bg-emerald-600/70"
                        : levels[gameState.currentLevel - 1].type ===
                          "intermediate"
                        ? "bg-sky-600/70"
                        : levels[gameState.currentLevel - 1].type === "advanced"
                        ? "bg-violet-600/70"
                        : levels[gameState.currentLevel - 1].type === "expert"
                        ? "bg-rose-600/70"
                        : "bg-amber-600/70"
                    }`}
                  >
                    {levels[gameState.currentLevel - 1].type
                      .charAt(0)
                      .toUpperCase() +
                      levels[gameState.currentLevel - 1].type.slice(1)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ✅ NEW: Level completion celebration overlay */}
      {renderCompletionCelebration()}

      {/* Main Map Content */}
      <div className="pt-24 sm:pt-28 lg:pt-36 pb-4 sm:pb-8">
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
          {renderMagicalParticles()}
          {renderPathTrail()}
          {updatedLevels.map(renderLevel)}
          {renderCharacter()}
        </div>
      </div>

      {/* ✅ ENHANCED: Bottom UI with better win state */}
      <div className="fixed bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-xs sm:max-w-md">
        {isGameWon && (
          <div className="bg-gradient-to-r from-amber-500/90 via-yellow-400/90 to-amber-500/90 backdrop-blur-xl rounded-3xl px-4 sm:px-12 py-4 sm:py-6 border-2 border-yellow-300/50 shadow-2xl shadow-yellow-400/40">
            <div className="pixel-font text-white text-center">
              <div className="text-lg sm:text-2xl lg:text-3xl font-bold drop-shadow-lg animate-pulse mb-2 sm:mb-3">
                🏆👑 LEGENDARY SQL MASTER! 👑🏆
              </div>
              <p className="text-xs sm:text-sm opacity-90 mb-3 leading-relaxed">
                You conquered all {levels.length} mystical challenges! The realm
                bows to your SQL mastery!
              </p>
              <div className="text-xs text-yellow-900 mb-4 space-y-1">
                <div>🎯 Total Quests: {levels.length}</div>
                <div>⚡ Completion Rate: 100%</div>
                <div>🏅 Rank: SQL Legend</div>
              </div>
              <button
                onClick={handleRestart}
                className="pixel-font text-yellow-900 font-bold bg-gradient-to-r from-yellow-300 to-amber-400 hover:from-yellow-200 hover:to-amber-300 px-4 sm:px-8 py-2 sm:py-3 rounded-xl shadow-lg transition-all transform hover:scale-105 hover:shadow-yellow-300/60 w-full"
              >
                🌟 Start New Legend
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ✅ ENHANCED: Comprehensive CSS animations */}
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

        @keyframes shimmer-bg {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes zoom-pulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        @keyframes celebration {
          0%,
          100% {
            transform: scale(1) rotate(0deg);
          }
          25% {
            transform: scale(1.2) rotate(5deg);
          }
          50% {
            transform: scale(1.3) rotate(-5deg);
          }
          75% {
            transform: scale(1.2) rotate(5deg);
          }
        }

        @keyframes bounce-celebration {
          0%,
          100% {
            transform: translateY(0px) scale(1);
          }
          25% {
            transform: translateY(-10px) scale(1.1);
          }
          50% {
            transform: translateY(-20px) scale(1.2);
          }
          75% {
            transform: translateY(-10px) scale(1.1);
          }
        }

        @keyframes character-celebration {
          0%,
          100% {
            transform: scale(1) rotate(0deg);
            filter: brightness(110%);
          }
          20% {
            transform: scale(1.1) rotate(2deg);
            filter: brightness(150%);
          }
          40% {
            transform: scale(1.2) rotate(-2deg);
            filter: brightness(130%);
          }
          60% {
            transform: scale(1.15) rotate(1deg);
            filter: brightness(160%);
          }
          80% {
            transform: scale(1.05) rotate(-1deg);
            filter: brightness(140%);
          }
        }

        @keyframes celebration-glow {
          0%,
          100% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.3);
          }
        }

        @keyframes celebration-overlay {
          0%,
          100% {
            opacity: 0;
          }
          50% {
            opacity: 0.3;
          }
        }

        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }

        @keyframes spin-slow {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes bg-drift {
          0% {
            transform: scale(1.03) translate(0px, 0px);
          }
          100% {
            transform: scale(1.08) translate(-18px, -12px);
          }
        }

        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-shimmer {
          animation: shimmer 2.5s ease-in-out infinite;
        }
        .animate-shimmer-bg {
          animation: shimmer-bg 3s ease-in-out infinite;
        }
        .animate-zoom-pulse {
          animation: zoom-pulse 2.2s ease-in-out infinite;
        }
        .animate-celebration {
          animation: celebration 1s ease-in-out infinite;
        }
        .animate-bounce-celebration {
          animation: bounce-celebration 1s ease-in-out infinite;
        }
        .animate-character-celebration {
          animation: character-celebration 2s ease-in-out infinite;
        }
        .animate-celebration-glow {
          animation: celebration-glow 1.5s ease-in-out infinite;
        }
        .animate-celebration-overlay {
          animation: celebration-overlay 2s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 6s linear infinite;
        }
        .shake-animation {
          animation: shake 0.6s ease-in-out;
        }
        .bg-drift {
          animation: bg-drift 24s linear infinite alternate;
        }

        .pixel-font {
          font-family: "Courier New", monospace;
          text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.8);
        }

        /* Mobile optimizations */
        @media (max-width: 640px) {
          .pixel-font {
            text-shadow: 1px 1px 0px rgba(0, 0, 0, 0.8);
          }
        }

        /* Touch-friendly sizing */
        @media (max-width: 480px) {
          .group {
            min-width: 44px;
            min-height: 44px;
          }
        }

        /* Prevent zoom on double tap */
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
