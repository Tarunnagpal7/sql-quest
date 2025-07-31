// components/AnimatedButton.jsx
const AnimatedButton = ({ label, onClick, color = "blue" }) => {
  const colorVariants = {
    blue: 'from-blue-800 to-cyan-500 hover:to-blue-700',
    green: 'from-emerald-500 to-green-400 hover:to-green-300',
  };

  return (
    <button
      onClick={onClick}
      className={`px-6 py-2 rounded-lg text-white font-bold tracking-wide
        bg-gradient-to-tr ${colorVariants[color]} backdrop-blur-sm
        shadow-lg shadow-black/40 
        transition-all duration-300 ease-in-out transform hover:scale-105
        ring-1 ring-white/20 hover:ring-2 hover:ring-white/40`}
    >
      {label}
    </button>
  );
};

export default AnimatedButton;
