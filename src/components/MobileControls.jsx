import React, { useEffect, useRef, useCallback } from "react";

const MobileControls = ({ 
  mobileControlsRef, 
  setMobileControls, 
  className = "" 
}) => {
  // Refs for each control button
  const upBtnRef = useRef(null);
  const downBtnRef = useRef(null);
  const leftBtnRef = useRef(null);
  const rightBtnRef = useRef(null);
  const attackBtnRef = useRef(null);

  // Memoized mobile control handlers
  const handleMobileControlStart = useCallback((direction) => {
    // Update both ref and state
    mobileControlsRef.current[direction] = true;
    setMobileControls((prev) => {
      if (prev[direction]) return prev;
      return { ...prev, [direction]: true };
    });
  }, [mobileControlsRef, setMobileControls]);

  const handleMobileControlEnd = useCallback((direction) => {
    // Update both ref and state
    mobileControlsRef.current[direction] = false;
    setMobileControls((prev) => {
      if (!prev[direction]) return prev;
      return { ...prev, [direction]: false };
    });
  }, [mobileControlsRef, setMobileControls]);

  const handleAttack = useCallback(() => {
    // Update both ref and state
    mobileControlsRef.current.attack = true;
    setMobileControls((prev) => ({ ...prev, attack: true }));
    setTimeout(() => {
      mobileControlsRef.current.attack = false;
      setMobileControls((prev) => ({ ...prev, attack: false }));
    }, 50);
  }, [mobileControlsRef, setMobileControls]);

  // Mobile controls setup effect
  useEffect(() => {
    const cleanupFunctions = [];

    const setupButton = (ref, direction, isAttack = false) => {
      const element = ref.current;
      if (!element) return;

      const onStart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isAttack) {
          handleAttack();
        } else {
          handleMobileControlStart(direction);
        }
      };

      const onEnd = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAttack) {
          handleMobileControlEnd(direction);
        }
      };

      // Use only pointer events for better mobile support
      element.addEventListener("pointerdown", onStart, { passive: false });
      
      if (!isAttack) {
        element.addEventListener("pointerup", onEnd, { passive: false });
        element.addEventListener("pointerleave", onEnd, { passive: false });
        element.addEventListener("pointercancel", onEnd, { passive: false });
      }

      // Add to cleanup functions
      cleanupFunctions.push(() => {
        element.removeEventListener("pointerdown", onStart);
        if (!isAttack) {
          element.removeEventListener("pointerup", onEnd);
          element.removeEventListener("pointerleave", onEnd);
          element.removeEventListener("pointercancel", onEnd);
        }
      });
    };

    // Setup all buttons
    setupButton(upBtnRef, "up");
    setupButton(downBtnRef, "down");
    setupButton(leftBtnRef, "left");
    setupButton(rightBtnRef, "right");
    setupButton(attackBtnRef, "attack", true);

    // Cleanup function
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [handleMobileControlStart, handleMobileControlEnd, handleAttack]);

  return (
    <div className={`w-full max-w-3xl p-3 bg-slate-800/50 rounded-lg border border-slate-600 ${className}`}>
      <div className="pixel-font text-slate-400 text-sm mb-2 text-center">
        <strong>CONTROLS:</strong>
      </div>

      {/* Desktop Controls */}
      <div className="hidden md:block">
        <div className="grid grid-cols-2 gap-2 text-sm text-slate-300 text-center">
          <div>↑↓←→ Move</div>
          <div>SPACE : Attack</div>
        </div>
      </div>

      {/* Mobile/Tablet Controls */}
      <div className="block md:hidden">
        <div className="flex flex-col items-center gap-4">
          {/* D-Pad */}
          <div className="relative">
            <div className="grid grid-cols-3 gap-1 w-36 h-36">
              <div></div>
              {/* UP */}
              <button
                ref={upBtnRef}
                className="bg-slate-600 hover:bg-slate-500 active:bg-slate-400 rounded text-white font-bold text-xl flex items-center justify-center select-none transition-colors"
                style={{ touchAction: "none" }}
              >
                ↑
              </button>
              <div></div>

              {/* LEFT */}
              <button
                ref={leftBtnRef}
                className="bg-slate-600 hover:bg-slate-500 active:bg-slate-400 rounded text-white font-bold text-xl flex items-center justify-center select-none transition-colors"
                style={{ touchAction: "none" }}
              >
                ←
              </button>
              {/* ATTACK BUTTON (CENTER) */}
              <button
                ref={attackBtnRef}
                className="bg-red-600 hover:bg-red-500 active:bg-red-400 rounded-full text-white font-bold text-lg flex items-center justify-center select-none transition-colors"
                style={{ touchAction: "none" }}
              >
                A
              </button>
              {/* RIGHT */}
              <button
                ref={rightBtnRef}
                className="bg-slate-600 hover:bg-slate-500 active:bg-slate-400 rounded text-white font-bold text-xl flex items-center justify-center select-none transition-colors"
                style={{ touchAction: "none" }}
              >
                →
              </button>

              <div></div>
              {/* DOWN */}
              <button
                ref={downBtnRef}
                className="bg-slate-600 hover:bg-slate-500 active:bg-slate-400 rounded text-white font-bold text-xl flex items-center justify-center select-none transition-colors"
                style={{ touchAction: "none" }}
              >
                ↓
              </button>
              <div></div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .pixel-font {
          font-family: "Courier New", monospace;
          text-shadow: 1px 1px 0px rgba(0, 0, 0, 0.8);
        }
      `}</style>
    </div>
  );
};

export default MobileControls;
