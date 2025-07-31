// components/StoryCarousel.jsx
import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { items } from "../assets/data/story";

const StoryCarousel = () => {
  const [currentPage, setCurrentPage] = useState(0);

  const nextPage = () => {
    setCurrentPage((prev) => (prev + 1) % items.length);
  };

  const prevPage = () => {
    setCurrentPage((prev) => (prev - 1 + items.length) % items.length);
  };

  const goToPage = (index) => {
    setCurrentPage(index);
  };

  return (
    <section className="relative snap-start w-full min-h-screen  bg-black flex flex-col items-center justify-center overflow-hidden py-12 px-4 sm:px-6 md:px-12"
        style={{
        backgroundImage: `url('/final.png')`,
        bacckgroundPosition: "center",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Title Section */}
      <div className="mb-8 md:mb-12 max-w-4xl  mx-auto">
        <h2 className="text-4xl font-black tracking-widest mb-4 bg-gradient-to-r from-purple-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent drop-shadow-2xl">
          THE LEGEND UNFOLDS
        </h2>

        <div className="w-32 h-1 bg-gradient-to-r from-purple-400 to-cyan-400 mx-auto shadow-lg shadow-purple-400/50 mb-6" />
      </div>

      {/* Story Content */}
      <div className="w-full max-w-6xl flex-1 flex items-center justify-center relative">
        {/* Navigation Buttons */}
        <button
          onClick={prevPage}
          className="absolute left-4 z-10 p-3 rounded-full bg-gradient-to-r from-blue-900 to-cyan-700 text-white hover:from-black hover:to-blue-700  shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 sm:p-2 "
          disabled={items.length <= 1}
        >
          <ChevronLeft size={24} className="sm:w-8 sm:h-8" />
        </button>

        <button
          onClick={nextPage}
          className="absolute right-4 z-10 p-3 rounded-full bg-gradient-to-r from-cyan-700 to-blue-900 text-white hover:from-blue-700 hover:to-black  shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 sm:p-2 "
          disabled={items.length <= 1}
        >
          <ChevronRight size={24} className="sm:w-8 sm:h-8" />
        </button>

        {/* Story Page */}
        <div className="w-full max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-8 md:p-12 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
            {/* Page Image */}
            {items[currentPage]?.image && (
              <div className="mb-8 relative overflow-hidden rounded-xl">
                <img
                  src={items[currentPage].image}
                  alt={
                    items[currentPage].title || `Story page ${currentPage + 1}`
                  }
                  className="w-full h-64 md:h-80 object-cover transition-transform duration-300 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            )}

            {/* Page Title */}
            {items[currentPage]?.title && (
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text">
                {items[currentPage].title}
              </h3>
            )}

            {/* Page Content */}
            <div className="text-gray-300 text-lg md:text-xl leading-relaxed text-center space-y-4">
              {items[currentPage]?.content ||
                items[currentPage]?.description ||
                "Story content goes here..."}
            </div>
          </div>
        </div>
      </div>

      {/* Page Counter */}
      <div className="mt-4 text-gray-400 text-sm">
        {currentPage + 1} of {items.length}
      </div>

      {/* Bottom Fade Effect */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black to-transparent pointer-events-none" />
    </section>
  );
};

export default StoryCarousel;
