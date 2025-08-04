import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { updateState } from "../redux/gameSlice";
import { useNavigate } from "react-router-dom";
import { levels } from "../assets/data/levels";

// Asset URLs
const ASSETS = {
  wizard: "/wizard-character.png",
  bgMap: "/jungle_map_bg.png",
};

// Wizard dialogue system
const getWizardDialogue = (
  currentLevel,
  isNewUser,
  hasJustCompleted,
  isGameWon
) => {
  if (isGameWon) {
    return {
      message: `🎉 INCREDIBLE! You've conquered all ${levels.length} levels and become the ultimate SQL Champion! Your mastery of the database arts is legendary. Ready for another epic adventure?`,
      type: "champion",
      emoji: "👑",
    };
  }

  if (hasJustCompleted) {
    const completedLevel = currentLevel - 1;
    return {
      message: `🎉 Brilliant work! Level ${completedLevel} conquered! Ready for the next challenge?`,
      type: "celebration",
      emoji: "🎊",
    };
  }

  const levelDialogues = {
    1: {
      message: isNewUser
        ? "👋 Hey! I'm Arin, your SQL wizard guide. I need your help to solve mystical SQL quests and escape this enchanted realm. Ready to start?"
        : "🗺️ Welcome back, brave adventurer! Let's uncover the hidden jungle map together!",
      type: "welcome",
      emoji: "🌟",
    },
    2: {
      message:
        "⚔️ Great progress! Now we face the Dragon's Trial. We're trapped and need to find brave explorers to help us escape!",
      type: "challenge",
      emoji: "🐉",
    },
    3: {
      message:
        "🏛️ The temple gates block our path! We need to find artifacts to unlock the ancient doors and continue our escape.",
      type: "mystery",
      emoji: "🗝️",
    },
    4: {
      message:
        "🚣 We're trapped by the raging river! Help me build a magical raft using explorers who have found artifacts.",
      type: "adventure",
      emoji: "🌊",
    },
    5: {
      message:
        "🐒 A sacred beast holds the key to our freedom! Only the most courageous can free it from the stone curse.",
      type: "rescue",
      emoji: "⛰️",
    },
    6: {
      message:
        "💎 The Memory Crystal is our escape route! We need explorers with specific powers to repair it.",
      type: "mystical",
      emoji: "🔮",
    },
    7: {
      message:
        "🌋 Volcano eruption! We're trapped! Quick, find explorers with weapons to clear our escape path!",
      type: "urgent",
      emoji: "⚡",
    },
    8: {
      message:
        "🏁 Time for the Speed Circuit! Calculate courage levels to power our escape raft!",
      type: "race",
      emoji: "🏎️",
    },
    9: {
      message:
        "⚔️ Final battle! Face the guardian in epic wizard combat to unlock our freedom!",
      type: "battle",
      emoji: "🔥",
    },
    10: {
      message:
        "🏆 The final quest awaits! Open the Ancient Temple door and claim our freedom!",
      type: "final",
      emoji: "👑",
    },
  };

  return (
    levelDialogues[currentLevel] || {
      message: "🧙‍♂️ Ready for your next adventure?",
      type: "default",
      emoji: "✨",
    }
  );
};

const MapMainView = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showSpeechBubble, setShowSpeechBubble] = useState(true);
  const [speechBubbleAnimation, setSpeechBubbleAnimation] = useState("fadeIn");
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [showTransition, setShowTransition] = useState(false);

  const gameState = useSelector(
    (state) =>
      state.game || {
        lives: 3,
        currentLevel: 1,
        progress: [],
        skipCount: 0,
        videoWatched: false,
        lastCompletedLevel: null,
      }
  );

  // Check if user just completed a level
  const hasJustCompleted =
    gameState.lastCompletedLevel &&
    gameState.lastCompletedLevel === gameState.currentLevel - 1;

  // Check if user is new
  const isNewUser = !gameState.videoWatched;

  // Check if game is won
  const isGameWon = gameState.progress.length >= levels.length;

  // Get current level data
  const currentLevel = levels.find(
    (level) => level.id === gameState.currentLevel
  );

  // Get wizard dialogue
  const wizardDialogue = getWizardDialogue(
    gameState.currentLevel,
    isNewUser,
    hasJustCompleted,
    isGameWon
  );

  // Calculate remaining lives (lives - skips used)
  const remainingLives = Math.max(0, gameState.lives - gameState.skipCount);
  const allSkipsUsed = gameState.skipCount >= gameState.lives;

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Clear completion state after showing dialogue
  useEffect(() => {
    if (hasJustCompleted) {
      const timer = setTimeout(() => {
        dispatch(
          updateState({
            lastCompletedLevel: null,
          })
        );
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [hasJustCompleted, dispatch]);

  // Handle level completion
  const handleLevelComplete = (completedLevelId) => {
    const wasAlreadyCompleted = gameState.progress.includes(completedLevelId);
    if (wasAlreadyCompleted) return;

    const nextLevelId = completedLevelId + 1;

    if (nextLevelId <= levels.length) {
      dispatch(
        updateState({
          currentLevel: nextLevelId,
          progress: [...gameState.progress, completedLevelId],
          lastCompletedLevel: completedLevelId,
        })
      );
    } else {
      dispatch(
        updateState({
          progress: [...gameState.progress, completedLevelId],
          lastCompletedLevel: completedLevelId,
        })
      );
    }
  };

  // Global level completion handler
  useEffect(() => {
    window.completeLevelAndMoveNext = handleLevelComplete;
    return () => {
      delete window.completeLevelAndMoveNext;
    };
  }, [gameState.progress]);

  // Handle start level
  const handleStartLevel = () => {
    setShowTransition(true);

    setTimeout(() => {
      navigate(`/level/${gameState.currentLevel}`);
    }, 3000); // Duration of your video (in ms)
  };

  // Handle restart
  const handleRestart = () => {
    localStorage.removeItem("sql-quest-game");
    dispatch(
      updateState({
        currentLevel: 1,
        progress: [],
        lives: 3,
        skipCount: 0,
        lastCompletedLevel: null,
      })
    );
    window.location.reload();
  };

  // Handle reset confirmation
  const handleResetClick = () => {
    setShowResetConfirmation(true);
  };

  const handleConfirmReset = () => {
    setShowResetConfirmation(false);
    handleRestart();
  };

  const handleCancelReset = () => {
    setShowResetConfirmation(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background - Full Screen Coverage */}
      <div
        className="fixed inset-0 w-screen h-screen bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(/mapbg.png)`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundColor: "#1e293b",
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/30 via-green-900/20 to-black/50" />

      {/* Header Stats */}
      <div className="fixed top-0 left-0 right-0 z-50 p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          {/* Lives or Reset Button */}
          {!allSkipsUsed ? (
            <div className="flex items-center space-x-2 bg-black/60 backdrop-blur-sm rounded-xl px-4 py-2 border border-red-500/30">
              <span className="text-white font-bold text-sm">Lives</span>
              <div className="flex space-x-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className={`text-lg transition-all ${
                      i < remainingLives ? "text-red-400" : "text-gray-600"
                    }`}
                  >
                    {i < remainingLives ? "❤️" : "🖤"}
                  </div>
                ))}
              </div>
              {gameState.skipCount > 0 && (
                <div className="ml-2 text-xs text-yellow-400">
                  ({gameState.skipCount} skips used)
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2 bg-black/60 backdrop-blur-sm rounded-xl px-4 py-2 border border-orange-500/30">
              <button
                onClick={handleResetClick}
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold py-2 px-4 rounded-lg transition-all transform hover:scale-105 active:scale-95"
              >
                🔄 Reset Game
              </button>
            </div>
          )}

          {/* Level Info */}
          <div className="bg-black/60 backdrop-blur-sm rounded-xl px-4 py-2 border border-blue-500/30">
            <div className="text-white font-bold text-center">
              Level {gameState.currentLevel}
            </div>
            {currentLevel && (
              <div className="text-xs text-center mt-1">
                <span
                  className={`px-2 py-1 rounded-full text-white font-bold ${
                    currentLevel.type === "basic"
                      ? "bg-green-600"
                      : currentLevel.type === "intermediate"
                      ? "bg-blue-600"
                      : currentLevel.type === "advanced"
                      ? "bg-purple-600"
                      : currentLevel.type === "expert"
                      ? "bg-red-600"
                      : "bg-yellow-600"
                  }`}
                >
                  {currentLevel.type.charAt(0).toUpperCase() +
                    currentLevel.type.slice(1)}
                </span>
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="bg-black/60 backdrop-blur-sm rounded-xl px-4 py-2 border border-green-500/30">
            <div className="text-white font-bold text-sm">
              Progress: {gameState.progress.length}/{levels.length}
            </div>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl p-8 text-center max-w-md mx-4 shadow-2xl border-2 border-orange-500/30">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Reset Adventure?
            </h2>
            <p className="text-white/90 mb-6 leading-relaxed">
              Are you sure you want to start over? All progress will be lost,
              but legends never die!
              <br />
              <br />
              <span className="text-orange-400 font-bold">
                Try again, champion!
              </span>
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleCancelReset}
                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReset}
                className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold py-3 px-6 rounded-lg transition-all"
              >
                🔄 Reset Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Game Area - Flex Container */}
      <div className="flex items-center justify-center min-h-screen pt-20 pb-8 px-4">
        <div className="max-w-6xl mx-auto w-full">
          {/* Flex Container for Wizard and Level Info */}
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
            {/* Left Side - Wizard Character */}
            <div className="flex-1 flex flex-col items-center justify-center">
              {/* Speech Bubble */}
              {showSpeechBubble && (
                <div className={`speech-bubble mb-4 ${speechBubbleAnimation}`}>
                  <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 md:p-6 shadow-2xl border-2 border-gray-300 relative max-w-sm md:max-w-md">
                    {/* Close button */}
                    <button
                      onClick={() => setShowSpeechBubble(false)}
                      className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl font-bold w-6 h-6 flex items-center justify-center"
                    >
                      ×
                    </button>

                    {/* Content */}
                    <div className="pr-6">
                      {/* Header */}
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="text-2xl">{wizardDialogue.emoji}</span>
                        <span className="font-bold text-gray-800">
                          Arin says:
                        </span>
                      </div>

                      {/* Message */}
                      <p className="text-gray-800 text-sm md:text-base leading-relaxed">
                        {wizardDialogue.message}
                      </p>
                    </div>

                    {/* Speech bubble tail */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                      <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-8 border-t-white"></div>
                      <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-8 border-t-gray-300 absolute top-0 transform translate-y-px"></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Wizard Image */}
              <div className="relative">
                {/* Glow effect */}
                <div
                  className={`absolute inset-0 w-64 h-64 md:w-80 md:h-80 rounded-full transform -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 ${
                    isGameWon
                      ? "bg-gradient-to-r from-yellow-400/60 via-orange-400/60 to-purple-500/60 animate-pulse"
                      : hasJustCompleted
                      ? "bg-gradient-to-r from-yellow-400/40 via-orange-400/40 to-red-400/40 animate-pulse"
                      : "bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 animate-pulse"
                  }`}
                />

                <div className="relative w-64 h-64 md:w-80 md:h-80">
                  <img
                    src={ASSETS.wizard}
                    alt="Arin the SQL Wizard"
                    className="w-full h-full object-contain drop-shadow-2xl cursor-pointer transition-transform hover:scale-105"
                    onClick={() => setShowSpeechBubble(true)}
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "block";
                    }}
                  />
                  {/* Fallback */}
                  <div
                    className="w-full h-full bg-gradient-to-br from-blue-800 to-purple-800 rounded-full border-4 border-white shadow-2xl hidden items-center justify-center cursor-pointer"
                    onClick={() => setShowSpeechBubble(true)}
                  >
                    <div className="text-8xl">🧙‍♂️</div>
                  </div>
                </div>

                {/* Stage Image - Fixed positioning */}
                <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 z-0">
                  <img
                    src="/stage.png"
                    alt="Stage"
                    className="w-32 h-16 md:w-40 md:h-20 object-contain opacity-80"
                  />
                </div>

                {/* Click to interact hint */}
                {!showSpeechBubble && (
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-black/70 text-white px-3 py-1 rounded-full text-sm animate-bounce">
                      Click to interact 💬
                    </div>
                  </div>
                )}
              </div>
            </div>

            {showTransition && (
              <div className="fixed inset-0 z-50 bg-black flex items-center ">
                <video
                  src="/Transition2.mp4" // put this in your public/videos folder
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Right Side - Level Information Panel or Champion Card */}
            <div className="flex-1 w-full max-w-lg">
              {isGameWon ? (
                <div className="bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-purple-600/20 backdrop-blur-lg rounded-3xl p-6 md:p-8 border-2 border-yellow-500/50 shadow-2xl">
                  {/* Champion Header */}
                  <div className="text-center mb-6">
                    <div className="text-6xl mb-4">🏆</div>
                    <h3 className="text-3xl font-bold text-yellow-400 mb-2">
                      SQL QUEST CHAMPION!
                    </h3>
                    <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                      LEGENDARY STATUS ACHIEVED
                    </div>
                  </div>

                  {/* Achievement Stats */}
                  <div className="bg-black/50 rounded-xl p-4 mb-6 border border-yellow-500/30">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-yellow-400">
                          {levels.length}
                        </div>
                        <div className="text-xs text-white/80">
                          Levels Conquered
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-400">
                          100%
                        </div>
                        <div className="text-xs text-white/80">
                          Completion Rate
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Champion Message */}
                  <div className="text-center mb-6">
                    <p className="text-white/90 text-sm md:text-base leading-relaxed">
                      🎉 You've mastered the ancient art of SQL! From basic
                      queries to complex database magic, you've proven yourself
                      a true champion. Want to relive the adventure?
                    </p>
                  </div>

                  {/* Play Again Button */}
                  <button
                    onClick={handleRestart}
                    className="w-full bg-gradient-to-r from-yellow-600 via-orange-600 to-purple-600 hover:from-yellow-500 hover:via-orange-500 hover:to-purple-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all transform hover:scale-105 active:scale-95 text-lg"
                  >
                    <span className="mr-3">🌟</span>
                    Play Again, Champion!
                    <span className="ml-3">🌟</span>
                  </button>

                  {/* Champion Badge */}
                  <div className="mt-4 text-center">
                    <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full px-4 py-2">
                      <span className="text-yellow-400">👑</span>
                      <span className="text-xs text-yellow-300 font-semibold">
                        SQL QUEST LEGEND
                      </span>
                      <span className="text-yellow-400">👑</span>
                    </div>
                  </div>
                </div>
              ) : (
                currentLevel && (
                  <div className="bg-black/80 backdrop-blur-lg rounded-3xl p-6 md:p-8 border-2 border-blue-500/30 shadow-2xl">
                    {/* Level Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-3xl font-bold text-white mb-2">
                          Level {currentLevel.id}
                        </h3>
                        <span
                          className={`px-4 py-2 rounded-full text-sm font-bold text-white shadow-lg ${
                            currentLevel.type === "basic"
                              ? "bg-green-600"
                              : currentLevel.type === "intermediate"
                              ? "bg-blue-600"
                              : currentLevel.type === "advanced"
                              ? "bg-purple-600"
                              : currentLevel.type === "expert"
                              ? "bg-red-600"
                              : "bg-yellow-600"
                          }`}
                        >
                          {currentLevel.type.charAt(0).toUpperCase() +
                            currentLevel.type.slice(1)}
                        </span>
                      </div>
                      <div className="text-4xl">
                        {currentLevel.type === "basic"
                          ? "🌱"
                          : currentLevel.type === "intermediate"
                          ? "⚔️"
                          : currentLevel.type === "advanced"
                          ? "🔥"
                          : currentLevel.type === "expert"
                          ? "💀"
                          : "👑"}
                      </div>
                    </div>

                    {/* Level Title */}
                    <h4 className="text-xl md:text-2xl font-bold text-cyan-300 mb-4">
                      {currentLevel.title}
                    </h4>

                    {/* Level Description/Riddle */}
                    <div className="bg-gray-800/50 rounded-xl p-4 mb-6 border border-gray-600/30">
                      <div className="flex items-start space-x-2 mb-2">
                        <span className="text-yellow-400 text-lg">📜</span>
                        <span className="text-yellow-300 font-semibold text-sm">
                          Quest Description:
                        </span>
                      </div>
                      <p className="text-gray-200 text-sm md:text-base leading-relaxed">
                        {currentLevel.riddle}
                      </p>
                    </div>

                    {/* Start Level Button */}
                    <button
                      onClick={handleStartLevel}
                      className="w-full bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 hover:from-cyan-500 hover:via-blue-500 hover:to-purple-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all transform hover:scale-105 active:scale-95 text-lg"
                    >
                      <span className="mr-3">⚔️</span>
                      Start Level {currentLevel.id}
                      <span className="ml-3">🗡️</span>
                    </button>

                    <div className="text-center mt-0.5">
                      <span className="pixel-font text-blue-300/90 text-xs font-bold">
                        <span className="inline-block animate-pulse">⚔️</span>{" "}
                        {gameState.progress.length}/{levels.length}{" "}
                        <span className="inline-block animate-pulse">🏆</span>
                      </span>
                    </div>
                  </div>
                )
              )}
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        .speech-bubble.fadeIn {
          animation: fadeInUp 0.5s ease-out forwards;
        }

        .speech-bubble.fadeOut {
          animation: fadeOutDown 0.3s ease-in forwards;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeOutDown {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-20px);
          }
        }

        @media (max-width: 1024px) {
          .speech-bubble {
            max-width: calc(100vw - 2rem);
          }
        }
      `}</style>
    </div>
  );
};

export default MapMainView;
