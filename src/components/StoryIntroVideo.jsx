import React, { useEffect, useRef } from 'react';

const StoryIntroVideo = ({ onEnd, onSkip }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const attemptPlay = async () => {
        try {
          video.volume = 0.8;
          await video.play();
        } catch (error) {
          // Fallback: play muted, then unmute on user interaction
          try {
            video.muted = true;
            await video.play();
            const handleClick = () => {
              video.muted = false;
              video.volume = 0.8;
              document.removeEventListener('click', handleClick);
              document.removeEventListener('touchstart', handleClick);
            };
            document.addEventListener('click', handleClick);
            document.addEventListener('touchstart', handleClick);
          } catch (e) { /* If even this fails, do nothing. */ }
        }
      };
      attemptPlay();
    }
  }, []);

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black z-50 overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        src="/Story.mp4"
        autoPlay
        playsInline
        preload="auto"
        controls={false}
        onEnded={onEnd}
        volume={0.8}
      />
      <button
        onClick={onSkip}
        className="absolute top-6 right-6 bg-black/60 hover:bg-black/80 text-white px-4 py-2 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/20 text-sm font-medium z-10"
      >
        Skip Intro →
      </button>
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center space-x-2 text-white/80 text-sm">
          <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
          <span>Loading your adventure...</span>
        </div>
      </div>
    </div>
  );
};

export default StoryIntroVideo;
