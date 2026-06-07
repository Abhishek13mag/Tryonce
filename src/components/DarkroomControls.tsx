/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ImageAdjustments } from '../types';
import { Sliders, Sun, EyeOff, RotateCcw, Sparkles, Droplet, Zap, Shuffle } from 'lucide-react';

interface DarkroomControlsProps {
  adjustments: ImageAdjustments;
  onChange: (adjustments: ImageAdjustments) => void;
  onReset: () => void;
  disabled?: boolean;
}

export function DarkroomControls({
  adjustments,
  onChange,
  onReset,
  disabled = false
}: DarkroomControlsProps) {

  // Preset definition handler
  const applyPreset = (presetName: string) => {
    if (disabled) return;
    
    let updated: ImageAdjustments = {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      warmth: 0,
      sharpness: 0,
      denoise: 0,
      colorize: false,
      scratchRemoval: 0
    };

    switch (presetName) {
      case 'b_w': // Silver Halide High Contrast BW
        updated = {
          brightness: 5,
          contrast: 35,
          saturation: -100,
          warmth: -5,
          sharpness: 40,
          denoise: 10,
          colorize: false,
          scratchRemoval: 20
        };
        break;
      case 'warm_glow': // Nostalgia Warm Colorizer
        updated = {
          brightness: 10,
          contrast: 15,
          saturation: 30,
          warmth: 35,
          sharpness: 20,
          denoise: 25,
          colorize: true,
          scratchRemoval: 30
        };
        break;
      case 'deep_clean': // Max Scratch & Noise Eraser
        updated = {
          brightness: 5,
          contrast: 20,
          saturation: 10,
          warmth: -5,
          sharpness: 50,
          denoise: 75,
          colorize: false,
          scratchRemoval: 80
        };
        break;
      case 'chromatic': // Faded Polaroid Pop
        updated = {
          brightness: 0,
          contrast: 25,
          saturation: 50,
          warmth: -10,
          sharpness: 30,
          denoise: 15,
          colorize: true,
          scratchRemoval: 15
        };
        break;
      default:
        break;
    }
    onChange(updated);
  };

  const handleSliderChange = (field: keyof ImageAdjustments, value: number | boolean) => {
    if (disabled) return;
    onChange({
      ...adjustments,
      [field]: value
    });
  };

  return (
    <div id="darkroom-panel-wrapper" className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Sliders className="text-amber-500" size={18} />
          <h3 className="font-sans font-semibold text-sm text-zinc-100 uppercase tracking-wider">
            Digital Darkroom Lab
          </h3>
        </div>
        <button
          onClick={onReset}
          disabled={disabled}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono text-zinc-400 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:hover:bg-zinc-800 rounded transition-colors"
          title="Reset Sliders to Original"
        >
          <RotateCcw size={12} />
          Reset
        </button>
      </div>

      {/* Aesthetic Presets */}
      <div className="mb-6">
        <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2">
          One-Click Correction Presets
        </label>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <button
            onClick={() => applyPreset('deep_clean')}
            disabled={disabled}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-zinc-800/80 hover:bg-amber-600/15 border border-zinc-700/60 hover:border-amber-500/50 text-zinc-200 hover:text-amber-400 rounded-lg transition-all"
          >
            <Sparkles size={11} className="text-amber-500" />
            Max Dust Cleanup
          </button>
          <button
            onClick={() => applyPreset('warm_glow')}
            disabled={disabled}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-zinc-800/80 hover:bg-amber-600/15 border border-zinc-700/60 hover:border-amber-500/50 text-zinc-200 hover:text-amber-400 rounded-lg transition-all"
          >
            <Droplet size={11} className="text-amber-500" />
            Warm Nostalgia Glow
          </button>
          <button
            onClick={() => applyPreset('b_w')}
            disabled={disabled}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-zinc-800/80 hover:bg-amber-600/15 border border-zinc-700/60 hover:border-amber-500/50 text-zinc-200 hover:text-amber-400 rounded-lg transition-all"
          >
            <Zap size={11} className="text-zinc-500" />
            High-Contrast B&W
          </button>
          <button
            onClick={() => applyPreset('chromatic')}
            disabled={disabled}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-zinc-800/80 hover:bg-amber-600/15 border border-zinc-700/60 hover:border-amber-500/50 text-zinc-200 hover:text-amber-400 rounded-lg transition-all"
          >
            <Shuffle size={11} className="text-zinc-400" />
            Vibrant Polaroid Pop
          </button>
        </div>
      </div>

      <div className="h-px bg-zinc-800/60 mb-5"></div>

      {/* Manual Sliders */}
      <div className="space-y-4">
        {/* Scratch Removal */}
        <div>
          <div className="flex justify-between text-xs font-medium text-zinc-300 mb-1">
            <span className="flex items-center gap-1">Scratch & Tear Eraser</span>
            <span className="font-mono text-[11px] text-zinc-400">{adjustments.scratchRemoval}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={adjustments.scratchRemoval}
            disabled={disabled}
            onChange={(e) => handleSliderChange('scratchRemoval', parseInt(e.target.value))}
            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        {/* Denoise / Grain Reduction */}
        <div>
          <div className="flex justify-between text-xs font-medium text-zinc-300 mb-1">
            <span>Grain Noise Reduction</span>
            <span className="font-mono text-[11px] text-zinc-400">{adjustments.denoise}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={adjustments.denoise}
            disabled={disabled}
            onChange={(e) => handleSliderChange('denoise', parseInt(e.target.value))}
            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        {/* Sharpen Details */}
        <div>
          <div className="flex justify-between text-xs font-medium text-zinc-300 mb-1">
            <span>Fidelity Sharpening</span>
            <span className="font-mono text-[11px] text-zinc-400">{adjustments.sharpness}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={adjustments.sharpness}
            disabled={disabled}
            onChange={(e) => handleSliderChange('sharpness', parseInt(e.target.value))}
            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        {/* Brightness */}
        <div>
          <div className="flex justify-between text-xs font-medium text-zinc-300 mb-1">
            <span>Exposure (Brightness)</span>
            <span className="font-mono text-[11px] text-zinc-400">{adjustments.brightness > 0 ? `+${adjustments.brightness}` : adjustments.brightness}</span>
          </div>
          <input
            type="range"
            min="-50"
            max="50"
            value={adjustments.brightness}
            disabled={disabled}
            onChange={(e) => handleSliderChange('brightness', parseInt(e.target.value))}
            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        {/* Contrast */}
        <div>
          <div className="flex justify-between text-xs font-medium text-zinc-300 mb-1">
            <span>Faded Shadows (Contrast)</span>
            <span className="font-mono text-[11px] text-zinc-400">{adjustments.contrast > 0 ? `+${adjustments.contrast}` : adjustments.contrast}</span>
          </div>
          <input
            type="range"
            min="-50"
            max="50"
            value={adjustments.contrast}
            disabled={disabled}
            onChange={(e) => handleSliderChange('contrast', parseInt(e.target.value))}
            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        {/* Warmth */}
        <div>
          <div className="flex justify-between text-xs font-medium text-zinc-300 mb-1">
            <span>Temperature (Warmth)</span>
            <span className="font-mono text-[11px] text-zinc-400">{adjustments.warmth > 0 ? `+${adjustments.warmth}` : adjustments.warmth}</span>
          </div>
          <input
            type="range"
            min="-50"
            max="50"
            value={adjustments.warmth}
            disabled={disabled}
            onChange={(e) => handleSliderChange('warmth', parseInt(e.target.value))}
            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        {/* Saturation */}
        <div>
          <div className="flex justify-between text-xs font-medium text-zinc-300 mb-1">
            <span>Saturation (Color Pop)</span>
            <span className="font-mono text-[11px] text-zinc-400">{adjustments.saturation > 0 ? `+${adjustments.saturation}` : adjustments.saturation}</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={adjustments.saturation}
            disabled={disabled}
            onChange={(e) => handleSliderChange('saturation', parseInt(e.target.value))}
            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        <div className="pt-3 border-t border-zinc-800/60">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={adjustments.colorize}
              disabled={disabled}
              onChange={(e) => handleSliderChange('colorize', e.target.checked)}
              className="rounded bg-zinc-800 border-zinc-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-zinc-900 w-4 h-4"
            />
            <span className="text-xs font-medium text-zinc-300">
              Restore Lost Color Channels (Auto Colorize)
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
