// components/StoryCarousel.jsx
import React from 'react';
import InfiniteMenu from '../assets/style/InfiniteMenu';
import { items } from '../assets/data/story';

const StoryCarousel = () => {
  return (
    <section className="relative snap-start w-full min-h-screen bg-black flex flex-col items-center justify-center overflow-hidden py-12 px-4 sm:px-6 md:px-12">
      
      {/* Title Section */}
      <div className=" mb-8 md:mb-12 max-w-4xl mx-auto">
        <h2 className="text-4xl font-black tracking-widest mb-4 bg-gradient-to-r from-purple-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent drop-shadow-2xl">
          THE LEGEND UNFOLDS
        </h2>
        
        <div className="w-32 h-1 bg-gradient-to-r from-purple-400 to-cyan-400 mx-auto shadow-lg shadow-purple-400/50 mb-6" />

      </div>

      {/* Story Carousel */}
      <div className="w-full max-w-7xl flex-1 flex items-center justify-center">
        <div className="w-full h-[500px] sm:h-[500px] md:h-[550px] lg:h-[600px] xl:h-[700px]">
          <InfiniteMenu items={items} />
        </div>
      </div>
      
      {/* Optional Bottom Fade Effect */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black to-transparent pointer-events-none" />
    </section>
  );
};

export default StoryCarousel;
