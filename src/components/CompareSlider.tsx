/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Eye, Focus } from 'lucide-react';

interface CompareSliderProps {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel?: string;
  afterLabel?: string;
  isLoading?: boolean;
}

export function CompareSlider({
  beforeUrl,
  afterUrl,
  beforeLabel = "Original Vintage",
  afterLabel = "Restored AI",
  isLoading = false
}: CompareSliderProps) {
  const [position, setPosition] = useState<number>(50); // 0 to 100 %
  const [isSliding, setIsSliding] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle slide mouse / touch movements
  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    let percentage = (x / rect.width) * 100;
    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;
    setPosition(percentage);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isSliding) return;
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isSliding) return;
    if (e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseUp = () => {
    setIsSliding(false);
  };

  useEffect(() => {
    if (isSliding) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isSliding]);

  const startSliding = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsSliding(true);
    if ('clientX' in e) {
      handleMove(e.clientX);
    } else if (e.touches && e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  return (
    <div 
      id="comparison-slider-container"
      ref={containerRef}
      className="relative w-full aspect-4/3 sm:aspect-16/10 rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-2xl select-none"
    >
      {/* Restored State (Bottom/Base Image) */}
      <img
        id="restored-image-base"
        src={afterUrl}
        alt="Restored"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        style={{ filter: isLoading ? 'blur(4px) brightness(0.6)' : 'none' }}
      />

      {/* Before State (Clipped Top Image) */}
      <img
        id="original-image-overlay"
        src={beforeUrl}
        alt="Original Vintage"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        style={{ 
          clipPath: `polygon(0 0, ${position}% 0, ${position}% 100%, 0 100%)`,
          filter: isLoading ? 'blur(4px) brightness(0.6)' : 'none' 
        }}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/40 backdrop-blur-sm z-30">
          <div className="relative flex items-center justify-center">
            <div className="h-16 w-16 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin"></div>
            <Eye className="absolute text-amber-400 animate-pulse" size={20} />
          </div>
          <span className="mt-4 text-xs font-mono text-zinc-400 uppercase tracking-widest animate-pulse">
            Analyzing textures...
          </span>
        </div>
      )}

      {/* BEFORE Badge - fades out near 0 */}
      <div 
        id="before-badge"
        className="absolute bottom-4 left-4 px-3 py-1.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono font-medium text-zinc-300 uppercase tracking-wider z-20 transition-opacity duration-200 select-none"
        style={{ opacity: position > 12 ? 1 : 0 }}
      >
        {beforeLabel}
      </div>

      {/* AFTER Badge - fades out near 100 */}
      <div 
        id="after-badge"
        className="absolute bottom-4 right-4 px-3 py-1.5 rounded-md bg-amber-500/80 backdrop-blur-md border border-amber-400/20 text-[10px] font-mono font-medium text-white uppercase tracking-wider z-20 transition-opacity duration-200 select-none"
        style={{ opacity: position < 88 ? 1 : 0 }}
      >
        {afterLabel}
      </div>

      {/* Drag Slider Handle Indicator */}
      <div
        id="slider-drag-handle"
        className="absolute top-0 bottom-0 w-1 bg-amber-500/90 hover:bg-amber-400 cursor-ew-resize z-20"
        style={{ left: `${position}%` }}
        onMouseDown={startSliding}
        onTouchStart={startSliding}
      >
        {/* Rounded control button on the handle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-zinc-900 border-2 border-amber-500 hover:border-amber-400 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform z-30">
          <Focus className="text-amber-500" size={16} />
        </div>
      </div>

      {/* Subtle Hint Tooltip */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded bg-zinc-900/40 text-[9px] font-mono text-zinc-500 uppercase tracking-wider pointer-events-none z-10">
        Drag slider to compare details
      </div>
    </div>
  );
}
